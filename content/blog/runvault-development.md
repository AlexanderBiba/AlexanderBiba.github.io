I built [Runvault](https://runvault.ai) with Claude Code agents doing most of the typing, a lot of the time while I wasn't anywhere near my laptop. Getting them to write code was the easy part. The hard part was knowing whether what they built actually works without sitting down at my desk to check, so I ended up building a Railway and Cloudflare setup for that, and that's what this post is about.

## The loop I wanted

When agents write most of the code, checking their work becomes the bottleneck. An agent opens a PR and I need to know if it actually works end to end, against a real database, with real auth, calling the real third-party APIs, and whether it quietly broke something else.

Reading the diff isn't enough. Running it locally only works if I'm at my desk, and trusting the tests works until the thing that matters isn't covered by one.

What I wanted was:

1. The agent opens a PR.
2. CI passes.
3. A real, isolated copy of the whole app comes up at its own URL, with the UI, API, worker, sandbox, database and queue.
4. I open that URL on whatever device I have on me and actually use the feature.
5. If it's wrong I tell the agent what's wrong, if it's right I merge.

Step 3 is the one that took real infrastructure work, the rest was mostly there already.

## The app

Runvault is an agent platform. You chat with it from a dashboard or a messaging channel, and the agent runs its tool calls inside an isolated sandbox. So there are a few moving parts:

- a dashboard SPA
- a gateway API for HTTP, webhooks and SSE
- an agent worker that picks up jobs and runs the agent loop
- a sandbox host where the agent's shell actually runs, with persistent storage per user

Plus Postgres and Redis. The API and worker run on Railway, the sandbox host is a Cloudflare Worker with containers, and the dashboard is on Cloudflare Pages.

![](/content/92d5ce66a0712147fd042c2e2b95865e286ada28-1600x800.png)

Production topology. What I wanted was this same setup coming up automatically for every PR.

## Three environments, one repo

There are three environments:

- PR previews, one full stack per open pull request, deleted when the PR merges or closes
- staging, a long-lived environment that tracks the `staging` branch
- production, which tracks `main`

Every PR targets `staging`. When a PR merges, Railway and Cloudflare redeploy staging on their own. When I'm ready to ship I run a GitHub Action that fast-forwards `main` to a known-good `staging` commit, and that ref update is what triggers the production deploys on both platforms.

![](/content/fd9f5cdb67432f29a5a881fc619295dd7d22f9bd-1600x560.png)

Branches map directly to environments, and promoting is a fast-forward instead of a separate deploy system.

This is all pretty standard. The part that matters for working with agents is that every PR gets a URL running the full stack with a real backend. A static frontend preview, a screenshot bot or a mocked backend wouldn't be enough.

## Railway: a full stack for every PR

Railway's environments are what made PR previews manageable. Each environment gets its own copy of every service, its own Postgres, its own Redis and its own variables. PR environments are automatic, you open a PR and Railway spins up a fresh environment named after the PR number, runs the same services and gives them temporary `*.up.railway.app` URLs.

That fits the agent workflow really well. The agent doesn't need to know anything about deployments, it pushes a branch and opens a PR, and by the time I look there's usually a live URL waiting.

![](/content/2b47f1ee9ed7ce116458f2e9ada09cd01abf2221-1600x720.png)

Each Railway environment is a full, isolated stack. Production and staging have two services, PR previews add a third for the dashboard.

### Why the dashboard runs on Railway only for PR previews

In production and staging the dashboard is on Cloudflare Pages, which is just better at serving an SPA from the edge. But in a PR preview the dashboard has to point at *that PR's* gateway API, not the shared staging one. Getting a per-PR API URL into a Pages preview build was more trouble than it was worth, so in preview environments only, the dashboard runs as a third Railway service.

Railway lets one service reference another's generated domain with a template variable, so the preview dashboard gets:

`VITE_API_URL=https://${{gateway.RAILWAY_PUBLIC_DOMAIN}}`

and Railway fills in the right value for each environment. Open PR #123 and the dashboard at `runvault-pr-123.up.railway.app` already points at `gateway-pr-123.up.railway.app`, nothing for me to configure and nothing for the agent to remember.

> A cookie gotcha: `up.railway.app` is on the [Public Suffix List](https://publicsuffix.org/), like `vercel.app` and `netlify.app`. That means two Railway auto-domains are *not* the same site as far as cookies go, even though they look related. In PR previews the session cookie has to be `SameSite=None; Secure`, while in production, where my real domains are same-site, it can be `SameSite=Lax`. I switch based on the `RAILWAY_ENVIRONMENT_NAME` variable Railway injects.

### Promoting is a git push

I didn't want to build a "deploy to production" button that talks to the Railway API, Railway already does what I need. Production watches `main`, staging watches `staging`, and PRs create preview environments.

So promoting to production is just a git push. A small GitHub Action fast-forwards `main` to a chosen `staging` commit after checking that:

- the SHA is reachable from `origin/staging`
- `origin/main` is already an ancestor of it
- CI passed on that commit

The push is gated by a GitHub Environment with required reviewers, so production still needs a human to approve it. But since what I'm approving is a git push, I can do it from the GitHub app on my phone and move on.

## Cloudflare: one Worker per environment

The sandbox host is where the agent's shell tool actually runs. It's a Cloudflare Worker that owns Durable Objects, one per tenant, and mounts an R2 bucket into each container as `/workspace`, so you get persistent storage, compute at the edge and containers on demand. It's a good fit for this.

It's also the part I least want shared between environments, because if one shared Worker breaks it takes down every agent run that's in progress. I learned that the hard way.

For a while I had one sandbox Worker shared by staging and all the PR previews. Then a PR changed the Worker's internal protocol and broke staging mid-run. Even worse, the PR preview gateway APIs were seeing staging tenant state, because they all pointed at the same R2 prefix.

That kills the whole idea. If a preview can touch staging data it's not a safe place to test anymore, and if I can't trust the preview then the whole "agent opens a PR, I test it from my phone" loop falls apart. So now every environment gets its own Worker, and each Worker's storage is isolated behind its own R2 prefix.

![](/content/14b1c47017dd44ab38e0722e6b5b8eea17ae7884-1600x800.png)

Three Workers, one bucket, three prefixes. Tenant state can't leak across environments, even if a bug sends a request to the wrong place.

### How Railway finds the right Worker

I expected this to be annoying but it turned out pretty clean. Each environment's Worker needs a shared secret so Railway can authenticate to it, and Railway needs to know which Worker URL to call. The obvious way is to have CI write environment-specific values back into Railway, which works, but it's more glue and exactly the kind of thing that drifts.

Instead both sides derive the same values from the environment name. The GitHub Action computes:

- Worker name: `runvault-sandbox-host-${ENV_NAME}`
- Shared secret: `HMAC(master, "sandbox-host:" + ENV_NAME)`

and the Railway services do the same thing at runtime from the `RAILWAY_ENVIRONMENT_NAME` Railway already injects. There's no CI-to-Railway plumbing and no syncing secrets per environment. A new PR environment shows up and everything it needs can already be derived.

### Pages for the production dashboard

The Pages side is boring on purpose. Pages watches the repo, runs

`pnpm install && pnpm --filter dashboard build`

and serves the built SPA with fallback routing. `VITE_API_URL` is set per environment at build time, so the right API origin gets baked into the bundle. Pages takes care of caching, TLS and custom domains, and there's no GitHub Action involved, it just rebuilds when the branch changes.

## GitHub Actions: as little glue as possible

I kept CI/CD small on purpose. Most of the deploy behavior lives in Railway and Cloudflare, and GitHub Actions only does three things:

1. CI: install, build, lint, type-check, test. It runs on every PR and every push to `staging` or `main`, and it's the gate before I trust a preview.
2. Sandbox host deploy: the only workflow that actually deploys code. It runs on PR open/sync/close and on pushes to `staging` or `main`, resolves the environment name, computes the Worker name and secrets, runs `wrangler deploy`, and cleans up when the PR closes.
3. Promote to production: the fast-forward from above, behind an Environment with required reviewers.

Railway deploys, Pages deploys, Postgres migrations and Worker URLs aren't in GitHub Actions at all. Railway and Pages watch their own branches, migrations run when the container starts, and Worker URLs are derived.

Cleaning up on PR close matters more than you'd think. When the workflow is "open lots of PRs and throw most of them away", stale Workers, R2 prefixes, Durable Object namespaces and container apps pile up fast, and forgetting about them is how a small bill turns into an embarrassing one. So closing a PR runs the same workflow in teardown mode, which deletes the Worker, the per-PR R2 prefix, the container app and the Durable Object namespace.

![](/content/d077775dbe8971af5da98b95f50fdbaa78ff3250-1600x640.png)

Three event sources, three pairs of outcomes. Each row is one deploy shape.

## What it looks like in practice

Usually I'm on a walk, on the train or out to lunch when an agent finishes something I asked for earlier, like a dashboard page, an integrations fix or a change to how sandbox file uploads work, and opens a PR.

My phone buzzes when CI passes, and again when the Cloudflare workflow finishes deploying the PR's Worker. I open the PR, tap the Railway preview URL, sign in and use the feature, the real one, against a real database, on a sandbox Worker that's separate from staging and from every other PR.

If something's wrong I dictate a follow-up to the agent and put my phone away. If it looks good I approve and merge, and staging redeploys itself. Later, usually the next morning, I run the promote workflow from the GitHub mobile app, approve the protected environment prompt, and production catches up.

Whole features have landed in this codebase that I never ran on my laptop even once.

## What I'd do differently

Letting each platform watch its own branch got rid of a lot of fragile deploy orchestration, and deriving per-environment secrets from a master secret and the environment name got rid of even more glue. The biggest win though was full per-PR isolation at every layer. Previews that share state with staging seem fine until you start opening lots of PRs, and then they bite you.

The one thing I'd change is giving each PR its own Cloudflare Worker from day one. Sharing the staging Worker "to save time" ended up costing me more time than it saved. The state leaks and weird bugs were bad, but the worst part was that I stopped trusting the previews. For this kind of workflow I'd rather give every environment its own copy of anything that can break loudly than share it until it does.

What surprised me is that this didn't feel like ops work, it was really about getting rid of the last reason I had to be at my laptop. The agents were already doing most of the typing, I just needed a way to check their work from wherever I was, and once I had that it changed how I work.
