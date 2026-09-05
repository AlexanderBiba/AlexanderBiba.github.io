It's an agent platform: users chat with it from a dashboard or a messaging channel, and the agent runs tool calls inside an isolated sandbox. That gives you four moving parts:

* a dashboard SPA for the UI,
* a gateway API (HTTP + webhooks + SSE),
* an agent worker (background queue consumer that runs the agent loop), and
* a sandbox host (where the agent's shell actually executes, with persistent per-user storage).

Plus Postgres and Redis. I run the API and worker on Railway, the sandbox host as a Cloudflare Worker with containers, and the dashboard from Cloudflare Pages.