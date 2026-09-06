I built [Runvault](https://runvault.ai) with Claude Code agents doing most of the actual typing, often while I was nowhere near my laptop.

The hard part wasn't getting them to write code. It was figuring out whether I could trust what they'd built without sitting down at my desk to check.

This post is about the Railway and Cloudflare setup that made that possible.

## The loop I wanted

When agents write most of the code, verification becomes the bottleneck.

An agent opens a PR. Now I need to know: does this actually work end to end? Against a real database, with real auth, calling the real third-party APIs? Did it quietly break something else?

Reading the diff isn't enough. Running it locally works if I'm at my desk. Trusting the tests works right up until the thing that matters isn't covered by one.

What I wanted was:

1. The agent opens a PR.
2. CI passes.
3. A real, isolated copy of the whole app comes up at its own URL: UI, API, worker, sandbox, database, queue, all of it.
4. I open that URL on whatever device I have on me and actually use the feature.
5. If it's wrong, I tell the agent what's wrong. If it's right, I merge.

Step 3 is the one that took real infrastructure work. The rest was already close.

## The app, briefly

Runvault is an agent platform. You chat with it from a dashboard or a messaging channel, and the agent runs its tool calls inside an isolated sandbox.

That means a few moving parts:

- a **dashboard SPA**,
- a **gateway API** for HTTP, webhooks, and SSE,
- an **agent worker** that consumes jobs and runs the agent loop,
- a **sandbox host** where the agent's shell actually executes, with persistent per-user storage.

Plus Postgres and Redis.

The API and worker run on **Railway**, the sandbox host is a **Cloudflare Worker** with containers, and the dashboard is on **Cloudflare Pages**.

![](/content/92d5ce66a0712147fd042c2e2b95865e286ada28-1600x800.png)

Production topology. The diagram itself isn't the interesting part; what I wanted was for this same shape to exist automatically for every PR.

## Three environments, one repo

The setup is simple:

- **PR previews**: one full stack per open pull request, deleted when the PR merges or closes.
- **staging**: a long-lived environment tracking the `staging` branch.
- **production**: tracks `main`.

Every PR targets `staging`.

When a PR merges, Railway and Cloudflare redeploy staging on their own. When I'm ready to ship, I run a GitHub Action that fast-forwards `main` to a known-good `staging` commit. That ref update is what triggers the production deploys on both platforms.

![](/content/fd9f5cdb67432f29a5a881fc619295dd7d22f9bd-1600x560.png)

Branches map directly to environments. Promotion is a fast-forward, not a separate deploy system.

None of this is exotic. What matters for agent-driven development is that every PR gets a real, working URL. Not a static frontend preview or a screenshot bot or a mocked backend, but the full stack.

## Railway: how a PR becomes a full stack

Railway's **environments** are what made PR previews manageable.

Each environment gets its own copy of every service, its own Postgres, its own Redis, and its own variables. PR environments are automatic: open a PR and Railway spins up a fresh environment named after the PR number, runs the same services, and hands them temporary `*.up.railway.app` URLs.

That fits the agent workflow really well. The agent doesn't need to know anything about deployments. It pushes a branch and opens a PR, and by the time I look there's usually a live URL waiting.

![](/content/2b47f1ee9ed7ce116458f2e9ada09cd01abf2221-1600x720.png)

Each Railway environment is a full, isolated stack. Production and staging have two services; PR previews add a third for the dashboard.

### Why the dashboard runs on Railway only for PR previews

In production and staging the dashboard lives on Cloudflare Pages, which is simply better at serving an SPA from the edge.

But for a PR preview, the dashboard has to point at *that PR's* gateway API, not the shared staging one. Threading a per-PR API URL into a Pages preview build was more friction than it was worth, so in preview environments only, the dashboard is a third Railway service.

Railway lets one service reference another's generated domain through a template variable, so the preview dashboard gets:

`VITE_API_URL=https://${{gateway.RAILWAY_PUBLIC_DOMAIN}}`

and Railway fills in the right value for that environment. Open PR #123 and the dashboard at `runvault-pr-123.up.railway.app` already points at `gateway-pr-123.up.railway.app`. Nothing for me to configure and nothing for the agent to remember.

> **Cookie gotcha.** `up.railway.app` is on the [Public Suffix List](https://publicsuffix.org/), like `vercel.app` and `netlify.app`. That means two Railway auto-domains are *not* the same site as far as cookies are concerned, even though they look related. In PR previews the session cookie has to be `SameSite=None; Secure`. In production, where my real domains are same-site, it can be `SameSite=Lax`. I switch based on the `RAILWAY_ENVIRONMENT_NAME` variable Railway injects.

### Promotion is a git operation

I deliberately didn't build a "deploy to production" button that talks to the Railway API. Railway already does what I need:

- production watches `main`,
- staging watches `staging`,
- PRs create preview environments.

So promoting to production is just a git push. A small GitHub Action fast-forwards `main` to a chosen `staging` commit, with a few checks first:

- the SHA has to be reachable from `origin/staging`,
- `origin/main` has to already be an ancestor of it,
- CI has to have passed on that commit.

The push is gated by a GitHub Environment with required reviewers, so production still needs a human. But what I'm approving is a git push, not a custom deploy process, and that means I can approve it from the GitHub app on my phone and move on.

## Cloudflare: one Worker per environment, isolated by R2 prefix

The sandbox host is where the agent's shell tool actually runs. It's a Cloudflare Worker that owns Durable Objects, one per tenant, and mounts an R2 bucket into each container as `/workspace`. Persistent storage, compute at the edge, containers on demand. It's a good fit for the problem.

It's also the part of the system I least want shared between environments, because if one shared Worker breaks it takes every in-flight agent run down with it. I learned that the hard way.

For a while I had one sandbox Worker shared by staging and all PR previews. Then a PR changed the Worker's internal protocol and broke staging mid-run. Worse, the PR-preview gateway APIs were seeing staging tenant state, because they all pointed at the same R2 prefix.

That defeats the whole point. If a preview can touch staging data it isn't a safe playground anymore, and if I can't trust the preview, the "agent opens a PR, I test from my phone" loop falls apart.

So every environment now gets its own Worker, and each Worker's storage is isolated behind its own R2 prefix.

![](/content/14b1c47017dd44ab38e0722e6b5b8eea17ae7884-1600x800.png)

Three Workers, one bucket, three prefixes. Tenant state can't leak across environments, even if a bug routes a request to the wrong place.

### How the Railway side finds the right Worker

I expected this to be annoying, and it turned out to be pretty clean.

Each environment's Worker needs a shared secret so Railway can authenticate to it, and Railway needs to know which Worker URL to call. The obvious approach is to have CI write environment-specific values back into Railway. That works, but it's more glue, and it's exactly the kind of thing that drifts.

Instead, both sides derive the same values from the environment name. The GitHub Action computes:

- Worker name: `runvault-sandbox-host-${ENV_NAME}`
- Shared secret: `HMAC(master, "sandbox-host:" + ENV_NAME)`

and the Railway services do the same derivation at runtime from the `RAILWAY_ENVIRONMENT_NAME` that Railway already injects. No CI-to-Railway plumbing, no per-environment secret sync. A new PR environment appears and everything it needs is already derivable.

### Pages for the production dashboard

The Pages side is intentionally boring. Pages watches the repo, runs

`pnpm install && pnpm --filter dashboard build`

and serves the built SPA with fallback routing. `VITE_API_URL` is set at build time per environment, so the right API origin is baked into the bundle. Pages handles caching, TLS, and custom domains. There's no GitHub Action involved; it just rebuilds when the branch changes.

## GitHub Actions: as little glue as possible

I kept CI/CD small on purpose. Most of the deployment behavior lives in Railway and Cloudflare, and GitHub Actions only does three things:

1. **CI**: install, build, lint, type-check, test. Runs on every PR and every push to `staging` or `main`. This is the gate before I trust a preview.
2. **Sandbox-host deploy**: the only workflow that actually deploys code. It runs on PR open/sync/close and on pushes to `staging` or `main`. It resolves the environment name, computes the Worker name and secrets, runs `wrangler deploy`, and cleans up on PR close.
3. **Promote to production**: the fast-forward described above, behind a required-reviewer Environment.

Not in GitHub Actions: Railway deploys, Pages deploys, Postgres migrations, Worker URL plumbing. Railway and Pages watch their branches themselves, migrations run on container start, and Worker URLs are derived. Less glue, fewer things to break.

The cleanup on PR close matters more than it sounds. When the workflow is "open lots of PRs and throw most of them away," stale resources pile up fast: Workers, R2 prefixes, Durable Object namespaces, container apps. Forgetting to clean them up is how a small bill quietly becomes an embarrassing one. So PR close runs the same workflow in teardown mode: delete the Worker, the per-PR R2 prefix, the container app, and the Durable Object namespace.

![](/content/d077775dbe8971af5da98b95f50fdbaa78ff3250-1600x640.png)

Three event sources, three pairs of outcomes. Each row is one deploy shape.

## The loop in practice

A typical session: I'm on a walk, on a train, or out to lunch. An agent finishes something I asked for earlier, maybe a dashboard page, an integrations fix, or a change to how sandbox file uploads work. It opens a PR.

My phone buzzes when CI passes, and again when the Cloudflare workflow finishes deploying the PR's Worker. I open the PR, tap the Railway preview URL, sign in, and use the feature. The real feature, against a real database, hitting a sandbox Worker that's separate from staging and from every other PR.

If something's wrong, I dictate a follow-up to the agent and put my phone away. If it looks good, I approve and merge, and staging redeploys itself.

Later, usually the next morning, I run the promote workflow from the GitHub mobile app, approve the protected-environment prompt, and production catches up.

Whole features have landed in this codebase that I never once ran on my laptop.

## What worked, and what I'd change

**What worked.** Letting each platform watch its own branch removed a lot of fragile deploy orchestration. Deriving per-environment secrets from a master secret plus the environment name removed even more glue. But the biggest win was full per-PR isolation at every tier. Previews that share state with staging seem fine until you start opening lots of PRs, and then they bite.

**What I'd do differently.** I should have given each PR its own Cloudflare Worker from day one. Sharing the staging Worker "to save time" cost me more time than it saved. The state leaks and weird bugs were bad, but the real cost was losing trust in the previews. For this kind of workflow, "every environment gets its own copy of the loudest thing" is a much better default than "share it until it breaks."

**What surprised me.** This wasn't really ops work. It was about removing the last reason I had to be chained to a laptop. The agents were already doing most of the typing; what I needed was a way to check their work from wherever I was. Once that existed, the way I work changed.
