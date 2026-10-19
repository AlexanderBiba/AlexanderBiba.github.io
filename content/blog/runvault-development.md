I built [Runvault](https://runvault.ai) with Claude Code agents doing most of the typing, a lot of the time while I wasn't anywhere near my laptop. Getting them to write code was the easy part, the hard part was knowing whether what they built actually works without sitting down at my desk to check. This is the Railway and Cloudflare setup I ended up with for that.

## The loop I wanted

When agents write most of the code, checking their work becomes the bottleneck. Reading the diff isn't enough, running it locally only works if I'm at my desk, and the tests only help until the thing that matters isn't covered by one. What I wanted was:

1. The agent opens a PR.
2. CI passes.
3. A real, isolated copy of the whole app comes up at its own URL, with the UI, API, worker, sandbox, database and queue.
4. I open that URL on whatever device I have on me and actually use the feature.
5. If it's wrong I tell the agent what's wrong, if it's right I merge.

Step 3 is the one that took real infrastructure work.

## The app

Runvault is an agent platform. You chat with it from a dashboard or a messaging channel, and the agent runs its tool calls inside an isolated sandbox. So there's a dashboard SPA, a gateway API for HTTP, webhooks and SSE, an agent worker that runs the agent loop, and a sandbox host where the agent's shell actually runs, with persistent storage per user. Plus Postgres and Redis. The API and worker run on Railway, the sandbox host is a Cloudflare Worker with containers, and the dashboard is on Cloudflare Pages.

![](/content/92d5ce66a0712147fd042c2e2b95865e286ada28-1600x800.png)

Production topology. What I wanted was this same setup coming up automatically for every PR.

## Three environments, one repo

PR previews get one full stack per open pull request, deleted when the PR merges or closes. Staging is long-lived and tracks the `staging` branch, and production tracks `main`. Every PR targets `staging`, and when it merges Railway and Cloudflare redeploy staging on their own.

![](/content/fd9f5cdb67432f29a5a881fc619295dd7d22f9bd-1600x560.png)

Branches map directly to environments, and promoting is a fast-forward instead of a separate deploy system.

## Railway: a full stack for every PR

Railway's environments are what made PR previews manageable. Each environment gets its own copy of every service, its own Postgres, Redis and variables, and PR environments are automatic. You open a PR and Railway spins up a fresh environment named after the PR number, with temporary `*.up.railway.app` URLs. The agent doesn't need to know anything about deployments, it pushes a branch and opens a PR, and by the time I look there's usually a live URL waiting.

![](/content/2b47f1ee9ed7ce116458f2e9ada09cd01abf2221-1600x720.png)

Each Railway environment is a full, isolated stack. Production and staging have two services, PR previews add a third for the dashboard.

### Why the dashboard runs on Railway only for PR previews

In production and staging the dashboard is on Cloudflare Pages, which is better at serving an SPA from the edge. But in a PR preview the dashboard has to point at *that PR's* gateway API, and getting a per-PR API URL into a Pages preview build was more trouble than it was worth. So in previews only, the dashboard runs as a third Railway service, with a template variable that references the gateway's generated domain:

`VITE_API_URL=https://${{gateway.RAILWAY_PUBLIC_DOMAIN}}`

Open PR #123 and the dashboard at `runvault-pr-123.up.railway.app` already points at `gateway-pr-123.up.railway.app`, nothing for me to configure and nothing for the agent to remember.

> A cookie gotcha: `up.railway.app` is on the [Public Suffix List](https://publicsuffix.org/), like `vercel.app` and `netlify.app`, so two Railway auto-domains are *not* the same site as far as cookies go. In PR previews the session cookie has to be `SameSite=None; Secure`, while in production, where my real domains are same-site, it can be `SameSite=Lax`. I switch based on the `RAILWAY_ENVIRONMENT_NAME` variable Railway injects.

### Promoting is a git push

Railway already watches `main` and `staging`, so I didn't build a "deploy to production" button. Promoting is just a git push. A small GitHub Action fast-forwards `main` to a chosen `staging` commit after checking that the SHA is reachable from `origin/staging`, that `origin/main` is already an ancestor of it, and that CI passed on that commit. The push is gated by a GitHub Environment with required reviewers, so production still needs a human, but since what I'm approving is a git push I can do it from the GitHub app on my phone.

## Cloudflare: one Worker per environment

The sandbox host is a Cloudflare Worker that owns Durable Objects, one per tenant, and mounts an R2 bucket into each container as `/workspace`. It's also the part I least want shared between environments, and I learned that the hard way.

For a while staging and all the PR previews shared one sandbox Worker. Then a PR changed the Worker's internal protocol and broke staging mid-run. Even worse, the PR preview gateway APIs were seeing staging tenant state, because they all pointed at the same R2 prefix. If a preview can touch staging data it's not a safe place to test anymore, and the whole "test it from my phone" loop falls apart. So now every environment gets its own Worker, and each Worker's storage is isolated behind its own R2 prefix.

![](/content/14b1c47017dd44ab38e0722e6b5b8eea17ae7884-1600x800.png)

Three Workers, one bucket, three prefixes. Tenant state can't leak across environments, even if a bug sends a request to the wrong place.

### How Railway finds the right Worker

Railway needs to know which Worker URL to call and which shared secret to authenticate with. The obvious way is to have CI write those values back into Railway, but that's more glue and exactly the kind of thing that drifts. Instead both sides derive them from the environment name:

- Worker name: `runvault-sandbox-host-${ENV_NAME}`
- Shared secret: `HMAC(master, "sandbox-host:" + ENV_NAME)`

The GitHub Action computes them when it deploys, and the Railway services compute the same thing at runtime from the `RAILWAY_ENVIRONMENT_NAME` Railway already injects. A new PR environment shows up and everything it needs can already be derived.

The Pages side for the production dashboard is boring on purpose. Pages watches the repo, runs `pnpm install && pnpm --filter dashboard build`, and serves the SPA with `VITE_API_URL` baked in per environment.

## GitHub Actions: as little glue as possible

GitHub Actions only does three things:

1. CI: install, build, lint, type-check, test. It runs on every PR and every push to `staging` or `main`, and it's the gate before I trust a preview.
2. Sandbox host deploy: the only workflow that actually deploys code. It computes the Worker name and secrets for the PR or branch and runs `wrangler deploy`.
3. Promote to production: the fast-forward from above.

Railway and Pages deploy themselves, migrations run when the container starts, and Worker URLs are derived.

Cleaning up on PR close matters more than you'd think. When the workflow is "open lots of PRs and throw most of them away", stale Workers, R2 prefixes, Durable Object namespaces and container apps pile up fast, and that's how a small bill turns into an embarrassing one. So closing a PR runs the same workflow in teardown mode and deletes all of them.

![](/content/d077775dbe8971af5da98b95f50fdbaa78ff3250-1600x640.png)

Three event sources, three pairs of outcomes. Each row is one deploy shape.

## What it looks like in practice

Usually I'm on a walk, on the train or out to lunch when an agent finishes something I asked for earlier, like a dashboard page or a change to how sandbox file uploads work, and opens a PR. My phone buzzes when CI passes, and again when the PR's Worker is deployed. I tap the Railway preview URL, sign in and use the real feature against a real database. If something's wrong I dictate a follow-up to the agent, and if it looks good I merge. Usually the next morning I run the promote workflow from the GitHub app and production catches up.

Whole features have landed in this codebase that I never ran on my laptop even once.

## What I'd do differently

The biggest win was full per-PR isolation at every layer. Previews that share state with staging seem fine until you start opening lots of PRs, and then they bite you. So the one thing I'd change is giving each PR its own Cloudflare Worker from day one. Sharing the staging Worker "to save time" cost me more time than it saved, and the worst part was that I stopped trusting the previews.

The agents were already doing most of the typing, I just needed a way to check their work from wherever I was. Once I had that, it changed how I work.
