Runvault is an agent platform for engineering teams. You talk to an agent from a web dashboard or from Telegram, Discord, WhatsApp, or Slack, and it does real work: reads your docs, runs shell commands in a Linux sandbox, calls your internal APIs, and follows schedules that run without anyone watching.

The part I care most about is the sandbox. Every user gets an isolated container with persistent storage, so the agent has a real shell and a real filesystem rather than a list of pre-approved functions. Everything else it can do (settings, schedules, memory, integrations, channels, members, billing) goes through a `runvault` CLI installed inside that sandbox, and anything you can do from the dashboard you can do from the CLI, and the other way round.

Integrations work through a credential proxy. You connect an API once, the agent calls it directly, and the auth headers are stamped on at the edge, so the agent never handles the secret itself.

Other bits: bring your own key for Anthropic, OpenAI, Google, Groq, or OpenRouter; Google sign-in with role-based access; one-off, cron, and delayed schedules; reusable skills; an audit log and an inspect panel on every message; and a self-hosted option that comes up with `docker compose up`.

Under the hood it's a TypeScript monorepo: a Fastify gateway API, a BullMQ worker running the agent loop on LangGraph, a React dashboard, Postgres and Redis. The API and worker run on Railway, the sandbox host is a Cloudflare Worker with containers, and the dashboard is on Cloudflare Pages. I wrote about [how that setup lets me ship from my phone](/blog/runvault-development/).
