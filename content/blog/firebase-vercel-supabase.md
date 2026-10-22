I've been building on Firebase for a few years and it's great for moving fast. You get a database, auth, storage and hosting all in one place, Firestore scales without you having to think about it, and hosting deploys straight from GitHub. You can build a whole React or Next.js app on it without touching infrastructure.

Then I started building apps for clients and one thing started to bother me.

## There's no off switch

Firebase has no hard billing cap. On the Blaze pay-as-you-go plan you can set budget alerts, but an alert doesn't actually stop anything. A traffic spike, an infinite loop, a misconfigured client or a [DDoS attack](https://www.reddit.com/r/googlecloud/comments/1jzoi8v/ddos_attack_facing_100000_bill/) can run up the bill and nothing gets in the way. This has been a known problem with Firebase and Google Cloud for years.

There are scripts out there that try to shut off the billing account when an alert fires, but they're unreliable and can take production down with them. For side projects that's fine, but it's not something I want to explain to a client. So I went looking for something where I can actually cap the cost.

## Why I moved to Supabase

Supabase is a managed backend built on Postgres, running on AWS (with Fly.io for some of the compute), with storage, auth and edge functions on top.

The big one is the spend cap. On paid plans you can turn it on, and then the project stops scaling past what your plan includes, metered resources just stop instead of charging you more. It doesn't cover absolutely everything, add-ons you enable yourself for example, but compared to Firebase it's a huge difference.

It's also real Postgres, with schemas, constraints, migrations and SQL, which is a big step up from a document store once your data model grows past a handful of collections. Storage sits behind Postgres row-level security too, so access rules live in the same place as everything else, which is a lot easier to reason about than Firebase's rules language. And the free tier gives you two projects with a real Postgres instance, which is plenty to get started.

Moving my client apps over was easier than I expected. Most of the data was media, which mapped straight onto Supabase buckets, and backups are just `pg_dump`. You do have to design a schema instead of throwing documents into a collection, but I think that's part of why it holds up better over time.

## Vercel for hosting

For hosting I paired Supabase with Vercel and it's been smooth. Every push deploys, every pull request gets its own preview URL, and the free tier is enough for several small projects. For Next.js apps especially the two fit together really well.

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

I still use Firebase for quick prototypes and personal apps. But for client work, not having a billing cap is a risk I'm not willing to take anymore. You still need to read the fine print on what Supabase's spend cap covers, but it's been a solid choice so far.
