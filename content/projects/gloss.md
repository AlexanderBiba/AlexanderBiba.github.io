Gloss is an app for reviewing documents that AI agents write. Your agent writes the document and your team comments on it.

I built it because I kept running into the same problem. Claude Code is happy to draft a plan, a report or a design doc, but as soon as someone else needs to read it and comment, you end up pasting it into a Google Doc and then pasting the comments back into the terminal. Gloss handles that round trip.

It works as an MCP server. From a Claude Code session, or any MCP client that speaks Streamable HTTP and OAuth, the agent publishes an HTML or Markdown document and gets back a link. It invites reviewers by email, and they sign in with Google and comment right on the page, nothing to install. When the reviews are in, the agent pulls a revision brief with everything reviewers said grouped by the document's own headings, replies in the threads, revises and republishes to the same link.

The interesting engineering is in the comments. They're anchored to the words they were made on instead of line numbers. So when a document is republished, comments on passages that didn't change stay exactly where they were, and comments on rewritten passages get parked where you can still see them instead of disappearing. Every version stays readable. Documents render in a sandboxed frame with scripts stripped, and the publish response tells you what stopped working because of that.

I also used Gloss to build Gloss. The implementation plan was published through the MCP server, two people reviewed it in the product, and it was revised from the brief that came back.

It's a TypeScript monorepo with Fastify over Postgres using plain SQL, an anchoring library that runs the same code in Node and the browser, and an MCP server in both stdio and hosted versions (for the hosted one, Gloss is its own OAuth 2.1 authorization server). Stripe handles plans. It runs on Fly.io with Neon Postgres, Resend for email and Cloudflare in front. Authors get a free tier and reviewers never pay.
