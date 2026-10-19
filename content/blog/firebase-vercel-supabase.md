I've been building on Firebase for a few years and it's great for moving fast. You get a database, auth, storage and hosting all in one place, so you can just focus on the app. Firestore is easy to use and scales without you having to think about it, storage comes with a CDN, and hosting deploys straight from GitHub. You can build a whole React or Next.js app on it without touching infrastructure, and since it's Google Cloud underneath, scale is never the problem.

Then I started building apps for clients and one thing started to bother me.

## There's no off switch

For side projects, prototypes and internal tools Firebase is perfect. The problem is when you ship something for a client and need the bill to be predictable.

Firebase has no hard billing cap. On the Blaze pay-as-you-go plan you can set budget alerts, but an alert doesn't actually stop anything. A traffic spike, an infinite loop, a misconfigured client or a [DDoS attack](https://www.reddit.com/r/googlecloud/comments/1jzoi8v/ddos_attack_facing_100000_bill/) can run up the bill and nothing gets in the way. This has been a known problem with Firebase and Google Cloud for years.

There are scripts out there that try to shut off the billing account when an alert fires, but they're unreliable and can take production down with them. That's not something I want to explain to a client.

So I went looking for something where I can actually cap the cost.

## Why I moved to Supabase

Supabase is a managed backend built on Postgres, running on AWS (with Fly.io for some of the compute). You get a SQL database, storage, auth, edge functions and so on, and a few things won me over pretty quickly.

The big one is the spend cap. On paid plans you can turn it on, and then the project stops scaling past what your plan includes, metered resources just stop instead of charging you more. It doesn't cover absolutely everything, add-ons you enable yourself for example, but compared to Firebase it's a huge difference.

It's also real Postgres, with schemas, constraints, migrations, SQL and queries you can predict. Once your data model grows past a handful of collections that's a big step up from a document store. Storage sits behind Postgres row-level security too, so access rules live in the same place as everything else, which is a lot easier to reason about than Firebase's rules language.

And it's easy to start, the free tier gives you two projects with storage and a real Postgres instance, which is plenty for early development.

## Migrating

Moving my client apps over was easier than I expected. Most of the data was media (images, audio, video), which mapped straight onto Supabase buckets, and since it's Postgres underneath, backups and exports are just `pg_dump`. You do have to design a schema and think relationally instead of throwing documents into a collection, but I think that's part of why it holds up better over time.

## Vercel for hosting

For hosting I paired Supabase with Vercel and it's been smooth. Every push to GitHub deploys, every pull request gets its own preview URL, env vars are simple to manage, serverless and edge functions are built in, and the free tier is enough for several small projects. For Next.js apps especially the two fit together really well, and once you're past the prototype stage I find it simpler to manage than Firebase.

## Side by side

| Feature | Firebase | Supabase | Vercel |
|--------|----------|----------|--------|
| **Database** | Firestore (NoSQL) | Postgres | N/A |
| **Hard billing cap** | ❌ | ✔️ (for capped resources) | ✔️ (per-project limits) |
| **Auth** | ✔️ | ✔️ | Third-party or custom |
| **Storage** | ✔️ CDN | ✔️ with SQL policies | Integrations / edge storage |
| **Functions** | Cloud Functions | Edge Functions | Serverless / Edge Functions |
| **Git deploy** | Partial | N/A | ✔️ |
| **Pricing predictability** | Low | High (with spend cap on) | High |

## What I use now

I still use Firebase for quick prototypes and personal apps. But for client work, not having a billing cap is a risk I'm not willing to take anymore. With Supabase and Vercel I get costs I can predict, a real relational database and deploys I don't have to think about. You still need to read the fine print on what the spend cap covers, but for client work it's been a solid choice so far.
