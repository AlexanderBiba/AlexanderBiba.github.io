# Alex’s website

Live: https://alexbiba.com/

## Run and build

```sh
npm ci
npm run dev     # Next.js dev server
npm run build   # static export into out/
npm start       # serves out/ locally the way Cloudflare does (wrangler dev)
```

No CMS account, token, or environment variables are required.

## Deploy

The site is a fully static Next.js export (`output: 'export'` in `next.config.js`), so there's no server: Next.js features that need one (ISR, route handlers, middleware, the image optimizer) won't work here. A Cloudflare Worker with only static assets serves `out/`, configured in `wrangler.jsonc`, with `out/404.html` for unknown paths.

Workers Builds is connected to this repo, builds with `npm run build` and deploys with `npx wrangler deploy` on every push to `master`. Other branches get preview URLs on workers.dev. alexbiba.com is attached to the `alexanderbiba-github-io` Worker as a custom domain in the Cloudflare dashboard, and www.alexbiba.com redirects to it with a Cloudflare redirect rule. Publishing content means committing to `master`. `public/_redirects` sends the old `/projects/` URLs to `/works/`.

## Edit content

- `content/site.json`: name, bio, and social links, shared by the homepage and house.
  Update `chess` for the Play app’s Chess.com profile and `youtube3dPrinting` for the printer’s YouTube channel. Both accept full URLs; no code changes are needed when a username changes.
- `content/blog.json`: blog titles, slugs, dates, and cover images.
- `content/blog/<slug>.md`: each article’s Markdown body.
- `content/works.json`: titles, slugs, dates, live site links, and screenshots for the “Things I’ve built” section at `/works/`.
- `content/works/<slug>.md`: each entry’s Markdown body.
- `public/content/`: local article images and site screenshots. Reference them as `/content/filename.png`.
- `src/house/content.ts`: house dialogue; its works/blog links use the same content indexes as the main site.
- `src/house/world.ts`: house models, layout, and animations.

To add a post or something you built, add its Markdown file and matching index entry. Keep existing slugs to preserve incoming links. Entries are displayed newest first.

The repository contains all five published articles, four entries under “Things I’ve built”, profile settings, and their images. Both the main site and 3D mode read these local files; no external CMS or credentials are needed.

## Analytics

Page views go to Cloudflare Web Analytics and PostHog (US cloud), both without cookies or any storage on the visitor's device, so no cookie banner is needed. Both only load on `alexbiba.com` and never for visitors who send Do Not Track or Global Privacy Control (`src/lib/privacy.ts`).

Cloudflare Web Analytics setup lives in `src/components/CloudflareAnalytics.tsx`. `CLOUDFLARE_ANALYTICS_TOKEN` holds the public site token from the Cloudflare dashboard (Web Analytics, alexbiba.com). It stays off while the token is empty. Don't also turn on the dashboard's automatic beacon injection for the site, or page views get counted twice and Do Not Track is ignored.

PostHog setup lives in `src/components/PostHogAnalytics.tsx`:

- `POSTHOG_KEY` holds the public PostHog project API key. Analytics stays off if it's empty.
- The PostHog project (shared with Gloss) must keep **Cookieless tracking** on under Settings > Web analytics, otherwise PostHog drops these events. Cookieless processing also strips IP addresses and user agents from the site's events, so the project-wide **Discard client IP data** setting isn't needed.
- Don't call `posthog.identify()` or turn on session replay; either would need consent. `/privacy/` describes the setup and should change if this does.

## Verify

```sh
node --test tests/*.test.mjs
npm run build
```

The experimental game is at `/play/`; see `src/house/README.md` for controls.
