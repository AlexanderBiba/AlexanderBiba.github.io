Runvault is an agent platform for engineering teams. You talk to an agent from a web dashboard or from Telegram, Discord, WhatsApp or Slack, and it reads your docs, runs shell commands in a Linux sandbox, calls your internal APIs and runs scheduled jobs without anyone watching.

The part I care most about is the sandbox. Every user gets an isolated container with persistent storage, so the agent has a real shell and a real filesystem instead of a list of pre-approved functions. Everything else it can do, like settings, schedules, memory, integrations, channels, members and billing, goes through a `runvault` CLI installed in the sandbox. Anything you can do from the dashboard you can do from the CLI, and the other way around.

Integrations go through a credential proxy. You connect an API once and the agent calls it directly, and the auth headers get added at the edge, so the agent never touches the secret.

What's in it:

- bring your own key for Anthropic, OpenAI, Google, Groq or OpenRouter
- Google sign-in with role-based access
- one-off, cron and delayed schedules
- reusable skills
- an audit log and an inspect panel on every message
- a self-hosted option that comes up with `docker compose up`

It's built with TypeScript as a monorepo: a Fastify gateway API, a BullMQ worker running the agent loop on LangGraph, a React dashboard, Postgres and Redis. The API and worker run on Railway, the sandbox host is a Cloudflare Worker with containers, and the dashboard is on Cloudflare Pages.

Related post: [Shipping a SaaS from my phone](/blog/runvault-development/)
