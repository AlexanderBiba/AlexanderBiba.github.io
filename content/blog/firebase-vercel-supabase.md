I've been building on Firebase for a few years. It's great for moving fast: database, auth, storage, and hosting in one place, so you can get on with the actual product. The things I liked most:

- Firestore, a document database that's easy to use and scales without you thinking about it
- Storage with a CDN in front of it
- Hosting that deploys straight from GitHub

You can put together a React or Next.js app on it without touching infrastructure, and because it's Google Cloud underneath, scale is never the problem.

Then I started building apps for clients, and one thing began to bother me.

---

## The problem: there's no off switch

Firebase is perfect for side projects, prototypes, and internal tools. The trouble starts when you ship something for a client and need the bill to be predictable.

Firebase has no hard billing cap. On the Blaze pay-as-you-go plan you can set budget alerts, but an alert doesn't stop anything. A traffic spike, an infinite loop, a misconfigured client, or a [DDoS attack](https://www.reddit.com/r/googlecloud/comments/1jzoi8v/ddos_attack_facing_100000_bill/) can run the bill up with nothing in the way. This has been a known gap in Firebase and Google Cloud for years.

There are scripts floating around that try to shut off the billing account when an alert fires, but they're unreliable and can take production down with them. For a client app, that's a hard risk to explain, let alone justify.

So I went looking for something where I could actually bound the cost.

---

## Why Supabase

Supabase is a managed backend on Postgres, running on AWS (with Fly.io for some compute). You get a SQL database, storage, auth, edge functions, and so on. A few things won me over quickly.

### A real spend cap

On paid plans you can turn on a spend cap. When it's on, the project stops scaling past what the plan includes, and metered resources stop rather than charging more. It doesn't cover absolutely everything (add-ons you enable by hand, for instance), but compared to Firebase it's night and day.

### Postgres

A proper relational database: schemas, constraints, migrations, SQL, predictable queries. Once a data model grows past a handful of collections, this is a big step up from a document store.

### Storage with SQL-style policies

Storage sits behind Postgres row-level security, so access rules live in the same place as everything else and are much easier to reason about than Firebase's rules language.

### An easy start

The free tier gives you two projects with storage and a real Postgres instance, which is plenty for early development.

---

## The migration

Moving my client apps over was easier than I feared. Most of the data was media (images, audio, video), which mapped straight onto Supabase buckets. And having Postgres underneath means backups and exports are just `pg_dump` and friends.

You do have to design a schema and think relationally instead of tossing documents into a collection, but that discipline is part of why the result holds up better over time.

---

## Deploying with Vercel

For hosting I paired Supabase with Vercel, and it's been smooth:

- Every push to GitHub deploys
- Every pull request gets a preview URL
- Environment variables are simple to manage
- Serverless and edge functions are built in
- The free tier is generous enough for several small projects

For Next.js apps in particular the two fit together well. Once you're past the prototype stage, the combination is easier to reason about than Firebase.

---

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

---

## Where I landed

Firebase is still my pick for quick prototypes and personal apps. For client work, the missing billing cap is a risk I'm no longer willing to carry.

Supabase and Vercel give me a cost structure I can predict, a real relational database, good developer ergonomics, and a deploy workflow I don't have to think about. You still need to read the fine print on what the spend cap covers, but overall it's a much safer setup for production.

If you're building for clients, or planning to scale, it's been a solid choice for me so far.
