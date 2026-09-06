Gloss is a review app for documents written by AI agents. Your agent writes it, your team reviews it.

It came out of a gap I kept hitting. Claude Code will happily draft a plan, a report, or a design doc, but the moment someone else needs to read and comment on it, you're pasting into a Google Doc and then pasting the comments back into the terminal. Gloss closes that loop.

It works as an MCP server. From a Claude Code session (or any MCP client that speaks Streamable HTTP and OAuth), the agent publishes an HTML or Markdown document and gets back a link. It invites reviewers by email; they sign in with Google and comment right on the page, nothing to install. When the reviews are in, the agent pulls a revision brief, everything reviewers said grouped by the document's own headings, replies in the threads, revises, and republishes to the same link.

The interesting engineering is in the comments. They're anchored to the words they were made on, not to line numbers, so when a document is republished, comments on untouched passages stay exactly where they were and comments on rewritten passages are parked in plain sight instead of quietly lost. Every version stays readable. Documents render inside a sandboxed frame with scripts stripped, and the publish response tells you what stopped working as a result.

I built it with the loop itself: the implementation plan was published through the MCP server, reviewed by two people through the product, and revised from the brief that came back.

Stack: a TypeScript monorepo, Fastify over Postgres with plain SQL, an anchoring library that runs the same code in Node and the browser, an MCP server in both stdio and hosted forms (Gloss is its own OAuth 2.1 authorization server for the hosted one), and Stripe for plans. It runs on Fly.io with Neon Postgres, Resend for email, and Cloudflare in front. Authors get a free tier; reviewers never pay.
