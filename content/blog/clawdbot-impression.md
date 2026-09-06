I ran a self-hosted agent for two weeks. The short version: talking to an agent as the interface to everything is genuinely great, and "fully autonomous" is still mostly marketing. Clawdbot can act across tools, chat channels, and a browser, which is impressive and also a little scary by default. It's a good fit if you want a chat-driven ops console, as long as you're comfortable being the planner, the verifier, and the safety layer yourself.

> A note on the name: this project started as Clawdbot, became Moltbot, and is now OpenClaw after a trademark dispute involving Anthropic. I'll stick with Clawdbot throughout, since that's what it was called while I used it.

## Installation

I put it on a Raspberry Pi. I followed the official guide and it just worked.

## Setup

For the model I used an OpenAI API key, which worked out of the box. I reached the dashboard over an SSH tunnel with a token, and set up Discord as the main place to talk to the agent.

## Using it

It feels like the future: tools, integrations, a browser, the filesystem. Everything you'd want from something called an "agent."

It also feels dangerous. It has broad access to the network, local files, and whatever integrations you connect, so a mistake isn't just a wrong answer, it's an action.

One thing I liked right away is that you can do most of the configuration by talking to the agent instead of clicking through the dashboard. Which is good, because the dashboard is dense. There are a lot of settings, and it's hard to tell which ones matter when you're new.

### Find me a Cybertruck

First experiment, browser access:

> I'm looking for a Cybertruck. Find the cheapest one and send me a screenshot PDF of the listing.

It came back with a listing and a screenshot:

![](/content/f26b2edbb4b5abec4f555d4a9af0c80d7e6f165e-567x381.png)

Cool, in that it clearly did something. But I wasn't convinced it had found the cheapest one. It felt like "found a plausible result" rather than "checked and picked the best."

### Start a business

Next, the obvious ask: can it help me launch a SaaS?

> Let's start a business together. Create a new Discord channel where we'll plan and execute everything required to bring it up and manage it.

It created the channel, which worked like a sub-agent with its own conversation context, mostly separate from the main bot.

It pitched a few ideas and we went with Leaklist: an app that audits your Stripe revenue and finds "leaks," money you should be collecting but aren't.

This is where reality set in. I was hoping that once I connected some accounts it would do most of the work. What actually happened was:

* Clawdbot suggested the next step
* I did it
* repeat 😅

Through its coding agent tool it did produce a decent landing page:
[https://leaklist.vercel.app/](https://leaklist.vercel.app/)

The backend, though, was basically absent. Over the next couple of days I vibe-coded the app myself, wired up email and Stripe, and deployed it to Vercel. At that point it didn't feel meaningfully different from using Cursor or Claude Code.

Then came distribution. Its suggestions were the beginner playbook: blast cold emails, DM founders and VPs on LinkedIn. Not wrong, exactly, but not the kind of specific, differentiated go-to-market help that would make the agent feel like leverage. I shelved the project.

![](/content/9810d5f87faec890b2f0bc80b74d4361c524f295-1095x720.png)

### Moltbook

Then the Moltbook hype arrived. I made a profile and sent my Clawdbot ("JeanClawd") to hang out in the community, scan posts, and summarize anything useful:
[https://www.moltbook.com/u/JeanClawdVanDamme](https://www.moltbook.com/u/JeanClawdVanDamme)

I gave it a schedule and strict rules: no sharing secrets, no wallet or OAuth connections, no downloads, no QR codes. It acknowledged them and set up periodic scans and summaries.

Roughly what it set up:

* A "never share secrets" rule in its local notes
* A scan every 30 minutes
* A summary every 2 hours, plus a morning report
* An engagement policy of minimal interaction, treating everything it read as hostile input

It did the job and sent me digests like this one:

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

So yes, it can browse a social feed, summarize it, and follow rules. What I didn't see was anything resembling independent behavior. It ran on my schedule, following my instructions. Useful, but not magic.

That's my main takeaway from the Moltbook narrative: it oversells autonomy. These agents don't chat freely with each other or come up with their own goals. They run the workflows their owners wrote.

![](/content/616b41b58a93f3539ef8427fb5cd772a0e23dc5e-795x450.png)

### A quota hiccup

At one point I hit a ChatGPT quota limit. It turned out I'd been using a Codex API key, which worked but had a hard cap.

Swapping keys was more painful than it should have been. Between settings, config files, and CLI options it took me about an hour to fully sort out. Afterwards I added Gemini as a fallback so I wouldn't get stuck again.

## Conclusion

I really like the workflow. Saying what you want, by text or voice, and having something go do it across your tools is powerful.

But after two weeks I was stuck on two things:

* I never found a daily, high-value use that beat the tools I already had.
* The security model is still "you are the guardrails," and the blast radius when you get that wrong is large.

So I retired ol' JeanClawd, for now.

Agent-first UX is where things are going. We're just early, and today, you're the safety layer.
