# Moving from Firebase to Vercel + Supabase

I’ve been using Firebase for a few years, building several web apps on top of it. Firebase is excellent for moving fast: it gives you a backend, auth, storage, and hosting in one place so you can focus on the product. What I’ve valued most:

- Easy-to-use, scalable document database (Firestore)  
- Storage with a built-in CDN  
- Hosting with a deployment pipeline directly connected to GitHub  

It makes it effortless to build a React or Next.js app without thinking about infrastructure. And because it runs on Google Cloud, scaling is never the bottleneck.

But after building applications for clients, I ran into concerns that pushed me to rethink the stack.

---

## The Problem With Firebase for Client Projects

Firebase is amazing for side projects, prototypes, and internal tools. The issues surface when you deploy something for a client—and you need predictable, controllable costs.

**The biggest issue: Firebase has no hard billing cap.**

- On the Blaze (pay-as-you-go) plan, you can set budget alerts, but alerts do *not* stop usage.  
- A traffic spike, infinite loop, misconfigured client, or DDOS attack can push your bill up with no automatic safeguard.  
- This is a long-standing limitation across Firebase and Google Cloud.

There are workaround scripts that attempt to shut down billing accounts when alerts trigger, but they’re unreliable and can break production systems. For client apps, that level of financial risk is hard to justify.

This led me to look for alternatives where cost exposure is easier to control.

---

## Why Supabase Was a Better Fit

Supabase is a managed backend built on Postgres and AWS (plus Fly.io for some compute), offering SQL databases, storage, authentication, edge functions, and more. A few advantages stood out immediately:

### **Hard Spend Cap**
Supabase allows you to enable a spend cap on paid plans.  
When enabled:

- Your project stops scaling past its plan limits  
- Certain usage categories stop rather than charging more  
- You avoid runaway billing

It’s not a global cap on *every* possible expansion (e.g., manually added add-ons), but it dramatically reduces exposure compared to Firebase.

### **Postgres**
A full relational database with:

- schemas  
- constraints  
- migrations  
- SQL  
- predictable queries  

This is a significant upgrade over a NoSQL document database once your data model grows.

### **Storage With SQL-Style Policies**
Supabase storage sits behind Postgres row-level policies, making the rules easier to reason about than Firebase’s custom rules language.

### **Smooth Onboarding**
The free tier lets you launch two projects with storage and a proper Postgres instance—ideal for early development.

---

## Migration Experience

Migrating my client apps was straightforward. Most of their data involved media files (images, audio, videos), which mapped cleanly into Supabase buckets. Postgres made relational data, backups, and exports easier using standard tools like `pg_dump`.

You do need to design schemas and think relationally—but that’s part of what makes the system more robust long-term.

---

## Deployments With Vercel

I paired Supabase with Vercel for deployments. The experience has been smooth:

- Automatic deployments on every GitHub push  
- Preview URLs on pull requests  
- Straightforward environment variable management  
- Built-in serverless and edge functions  
- A generous free tier that works well for multiple small projects  

Vercel + Supabase is a natural fit, especially for Next.js apps. The stack is modern, scalable, and easier to reason about than Firebase once you move past prototypes.

---

## Firebase vs. Supabase + Vercel: Feature Comparison

| Feature | Firebase | Supabase | Vercel |
|--------|----------|----------|--------|
| **Database** | Firestore (NoSQL) | Postgres | N/A |
| **Hard Billing Cap** | ❌ | ✔️ (for capped resources) | ✔️ (per-project limits) |
| **Auth** | ✔️ | ✔️ | Third-party or custom |
| **Storage** | ✔️ CDN | ✔️ with SQL policies | Integrations / edge storage |
| **Functions** | Cloud Functions | Edge Functions | Serverless / Edge Functions |
| **Git Deploy** | Partial | N/A | ✔️ |
| **Pricing Predictability** | Low | High (with spend cap enabled) | High |

---

## Conclusion

Firebase is fantastic for rapid prototyping and personal apps. But for client projects, the lack of a true hard billing cap introduces financial risk that’s difficult to justify.

Supabase + Vercel offers:

- more predictable cost structure,  
- a powerful relational database,  
- strong developer ergonomics, and  
- modern deployment workflows.

You still need to understand how Supabase’s spend caps work and what’s covered, but overall it’s a safer, more controllable setup for production work.

If you’re building real applications for clients or planning to scale, the Vercel + Supabase combination has been a reliable choice so far.
