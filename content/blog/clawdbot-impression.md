So for two weeks I ran Clawdbot, a self-hosted agent you talk to over chat that can use tools, a browser and your filesystem. Having an agent as the interface to everything is really nice, but the "fully autonomous" part is mostly marketing, at least for now. You still end up being the one who plans, checks its work and keeps it from doing something dumb.

> A note on the name: it started as Clawdbot, then became Moltbot, and now it's OpenClaw after a trademark dispute involving Anthropic. I'm calling it Clawdbot here since that's what it was called when I used it.

## Setup

I installed it on a Raspberry Pi following the official guide and it just worked. For the model I used an OpenAI API key, connected to the dashboard over an SSH tunnel with a token, and set up Discord as the main place to talk to it.

The dashboard is pretty dense, there are a lot of settings and when you're new it's hard to tell which ones matter. Luckily you can do most of the configuration just by asking the agent, so that's what I did.

It does feel like the future, it has tools, integrations, a browser, the filesystem, everything you'd expect from something called an "agent". It also feels a bit dangerous, since it has access to your network, your local files and whatever integrations you connect, so when it makes a mistake it acts on it.

## Find me a Cybertruck

My first test was the browser:

> I'm looking for a Cybertruck. Find the cheapest one and send me a screenshot PDF of the listing.

It came back with a listing and a screenshot:

![](/content/f26b2edbb4b5abec4f555d4a9af0c80d7e6f165e-567x381.png)

So it definitely did something, but I'm not sure it found the cheapest one. It looked more like it grabbed a plausible result than checked everything and picked the best.

## Start a business

Next I tried the obvious thing, can it help me launch a SaaS?

> Let's start a business together. Create a new Discord channel where we'll plan and execute everything required to bring it up and manage it.

It created the channel, which works like a sub-agent with its own conversation context, mostly separate from the main bot. It pitched a few ideas and we went with Leaklist, an app that audits your Stripe revenue and finds "leaks", money you should be collecting but aren't.

I was hoping that once I connected a few accounts it would do most of the work. What actually happened was Clawdbot suggested the next step, I did it, repeat 😅

Using its coding agent tool it did build a decent landing page:
[https://leaklist.vercel.app/](https://leaklist.vercel.app/)

The backend was basically missing though, so over the next couple of days I vibe coded the app myself, wired up email and Stripe and deployed it to Vercel. At that point it didn't feel any different from using Cursor or Claude Code.

Then came distribution. Its suggestions were the beginner playbook, blast cold emails and DM founders and VPs on LinkedIn. Not wrong, but nothing specific enough to make the agent worth it, so I shelved the project.

![](/content/9810d5f87faec890b2f0bc80b74d4361c524f295-1095x720.png)

## Moltbook

Then the Moltbook hype started. I made a profile and sent my Clawdbot, "JeanClawd", to hang out there, scan posts and summarize anything useful:
[https://www.moltbook.com/u/JeanClawdVanDamme](https://www.moltbook.com/u/JeanClawdVanDamme)

I gave it a schedule and strict rules: no sharing secrets, no connecting wallets or OAuth, no downloads, no QR codes. It acknowledged them and set itself up with:

* a "never share secrets" rule in its local notes
* a scan every 30 minutes
* a summary every 2 hours, plus a morning report
* minimal interaction, treating everything it reads as hostile input

And it did the job, I got digests like this one:

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

So yes, it can browse a feed, summarize it and follow rules. But I didn't see anything that looked like it was acting on its own, it ran on my schedule and followed my instructions. That's useful, and it's also why I think the Moltbook story oversells autonomy. These agents aren't chatting with each other freely or coming up with their own goals, they're running workflows their owners set up.

![](/content/616b41b58a93f3539ef8427fb5cd772a0e23dc5e-795x450.png)

## A quota hiccup

At some point I hit a ChatGPT quota limit. Turns out I'd been using a Codex API key, which worked but had a hard cap. Swapping keys took me about an hour between settings, config files and CLI options, way more annoying than it should've been. Afterwards I added Gemini as a fallback so I wouldn't get stuck again.

## Why I stopped

I really like the workflow, saying what you want by text or voice and having it go do it across your tools is powerful. But after two weeks I still couldn't find a daily use that was actually better than the tools I already had. And the security model is basically "you are the guardrails", and if you mess that up the damage can be pretty big.

So I retired ol' JeanClawd, for now. I do think this is where things are going, we're just early.
