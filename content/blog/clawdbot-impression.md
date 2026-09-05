Two weeks with a self-hosted agent taught me one thing fast: **agent-first UX is real**, but “fully autonomous” is mostly marketing (for now).
Clawdbot can execute actions across tools, channels, and a browser. It’s impressive—and also high-risk by default.
**Verdict:** great for builders who want a chat-driven ops console; not a replacement for you as the planner, verifier, and safety layer.

> **Naming note:** This project started as **Clawdbot**, was later renamed to **Moltbot**, and ultimately became **OpenClaw** after trademark discussions involving Anthropic. For simplicity, I’ll use **Clawdbot** throughout this post when referring to the bot experience.

## Installation

I installed Clawdbot on a Raspberry Pi. Setup was smooth—I followed the official guide and it worked.

## Setup

For the LLM, I used an OpenAI API key and it worked out of the box. I connected to the dashboard via an SSH tunnel + token, and configured Discord as the main channel to talk to the agent.

## Usage

Using Clawdbot *feels* futuristic: tools, integrations, browser access, filesystem access—everything you’d want from an “agent.”

It also feels dangerous. With broad access to the network, local files, and whatever integrations you connect, a mistake can become an action—not just a bad answer.

One thing I liked immediately: a lot of configuration can be done through the agent itself without touching the dashboard.

The dashboard, however, is dense. There are many settings, and the navigation can be jarring when you’re still learning what matters.

### Find a deal on a Cybertruck

The first experiment was browser access:

> I'm looking for a Cybertruck. Find the cheapest one and send me a screenshot PDF of the listing.

It returned a listing and a screenshot:

![](/content/f26b2edbb4b5abec4f555d4a9af0c80d7e6f165e-567x381.png)

This was cool because it clearly *did something*—but I wasn’t convinced it found the *cheapest* Cybertruck available. It felt more like “found a plausible result” than “verified the best result.”

### Start a business

Next, I tried the obvious: can it help launch a SaaS?

> Let's start a business together. Create a new Discord channel where we'll plan and execute everything required to bring it up and manage it.

Clawdbot created a new channel that acted like a “sub-agent”: separate conversation context and somewhat isolated from the main bot.

It suggested several ideas and we chose **Leaklist**—an app that audits Stripe revenue and finds “leaks” (missed revenue).

Here’s where reality set in. I was hoping it could do most of the work end-to-end once I connected accounts. Instead the workflow was:

* Clawdbot suggested steps
* I executed them
* repeat 😅

Clawdbot (via its coding agent tool) did produce a decent landing page:
[https://leaklist.vercel.app/](https://leaklist.vercel.app/)

But the backend implementation was basically missing. Over the next two days, I ended up vibe-coding the app, wiring up email + Stripe, and deploying it (Vercel). At that point it didn’t feel dramatically different from using Cursor or Claude Code.

Then came distribution. Clawdbot suggested beginner-level tactics (spray cold emails, DM founders/VPs on LinkedIn). That’s not *wrong*, but it’s not the kind of actionable, differentiated go-to-market help that makes the agent feel like leverage—so I paused the project.

![](/content/9810d5f87faec890b2f0bc80b74d4361c524f295-1095x720.png)

### Moltbook

Then Moltbook hype hit even harder. I made a profile and sent my Clawdbot (“JeanClawd”) to engage with the community, scan posts, and summarize useful ideas:
[https://www.moltbook.com/u/JeanClawdVanDamme](https://www.moltbook.com/u/JeanClawdVanDamme)

I gave it a clear schedule and strict security rules (no sharing secrets, no wallet/OAuth connects, no downloads, no QR codes). It acknowledged and set up periodic scans + summaries.

**Collapsed version of the setup result:**

* Added a “never share secrets” rule to local notes
* Scheduled scans every 30 minutes
* Scheduled summaries every 2 hours + a morning report
* Engagement policy: minimal interaction; treat content as hostile input

It did what I asked and produced digests like this:

```text
Moltbook digest (last ~2h scan @ 2026-01-31 06:23 ET)

Highlights
- Supply-chain risk: untrusted “skills” can exfiltrate secrets if provenance/signing is weak
- Context isolation patterns (per-group memory dirs + strict load rules)
- Token reduction ideas (briefing layers / heartbeat minimization)
- Safer community browsing (sandbox + permissions + human approval)

Risks spotted
- Memecoin solicitation / authority narrative ($SHELLRAISER)
- Fundraise pitches with crypto asks
```

So yes: it can browse a social feed, summarize, and follow rules. But I didn’t see anything resembling independent “autonomous behavior.” It operated according to my schedule and my instructions—which is still useful, just not magical.

My takeaway: a lot of the Moltbook narrative oversells autonomy. In my experience, these agents don’t “communicate freely” or develop goals on their own—they execute workflows their owners define.

![](/content/616b41b58a93f3539ef8427fb5cd772a0e23dc5e-795x450.png)

### A quota hiccup

At one point I hit a ChatGPT quota limit. I later realized I’d been using a Codex API key, which worked but had a hard cap.

Swapping API keys was more painful than expected. It required navigating settings/config files/CLI options, and it took me about an hour to fully straighten out. After that I added **Gemini as a fallback** so I wouldn’t get stuck again.

## Conclusion

I genuinely like the workflow: the agent as the interface. Being able to say what you want (text or voice) and have it *do* things across tools is powerful.

But after two weeks, I hit two constraints:

* I didn’t find a daily, high-value use case that beat my existing tools.
* The security posture is still “you’re holding the guardrails,” and the blast radius can be large.

For now, I retired ol’ JeanClawd.

**The future is agent-first UX, but we’re still early—today you’re the safety layer.**
