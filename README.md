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

- `content/site.json`: name, bio, and social links, shared by the homepage and the card packs.
  `chess` (Chess.com profile) and `youtube3dPrinting` (3D printing YouTube channel) become cards in the Social pack. Both accept full URLs; no code changes are needed when a username changes.
- `content/blog.json`: blog titles, slugs, dates, and cover images.
- `content/blog/<slug>.md`: each article’s Markdown body.
- `content/works.json`: titles, slugs, dates, live site links, and screenshots for the “Things I’ve built” section at `/works/`.
- `content/works/<slug>.md`: each entry’s Markdown body.
- `public/content/`: local article images and site screenshots. Reference them as `/content/filename.png`.
- `src/cards/build.ts`: turns posts, works and `site.json` into the cards at `/play/`. The short lines on the Social cards live here too.

To add a post or something you built, add its Markdown file and matching index entry. Keep existing slugs to preserve incoming links. Entries are displayed newest first.

The repository contains all the published articles, four entries under “Things I’ve built”, profile settings, and their images. Both the main site and the card packs read these local files; no external CMS or credentials are needed.

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

## Card packs (`/play/`)

The 🎮 link in the navbar (`src/components/PlayLink.tsx`) shrinks the visible page into a card pack (`src/cards/morph.tsx`) and then navigates to `/play/`, which draws the same pack in the same spot (`src/cards/geometry.ts`) so the hand-off doesn't jump. The pack's art is painted while the homepage is idle, so the animation starts on the first tap, and `/play/` builds its 3D scene under the painted pack before fading it out. The "← alexbiba.com" button plays it backwards: the other packs slide away and the homepage grows out of the pack. People with reduced motion turned on, or who open the link in a new tab, go straight to the other page.

On `/play/` the packs and cards are 3D models drawn with Three.js (`src/cards/stage3d.ts`). Each pack is one puffed-up wrapper mesh with a front, a back and sealed crimped ends (its shape is in `src/cards/shapes.ts`), and each card is a thin slab with a printed front, a back and an edge. Their art is painted onto canvases (`src/cards/paint.ts`, colors in `src/cards/palette.ts`) and used as textures, and the homepage morph and the recap grid reuse the same paintings. The captions, buttons and links on top are ordinary HTML (`src/cards/CardGame.tsx`), so they stay sharp and screen readers can read them.

You swipe between three packs (Blog, Built and Social) and tap one to pick it. You can drag the picked pack sideways to spin it and see the back, which lists what's inside. Tapping it again brings it up close (`zoomRect` in `src/cards/geometry.ts`), where a flash runs along the dashed line, and swiping along that line cuts it open with a glowing line that follows your finger, and the strip, a small soft-body sheet of foil (`src/cards/strip.ts`), peels up as you cut, lies back down if you let go early, and flutters off once it's free; the cards rise out of the torn top and land as a stack: swipe the top card left for the next one or right to bring the last one back, and after the last card you see them all together. Going back puts the cards into the pack and seals it so it can be opened again. The top card leans toward the pointer or the phone's angle (`src/cards/motion.ts`); on iPhone the first tap asks for motion access. If the browser can't draw WebGL, the page links back to the homepage. Nothing is stored on the visitor's device.

Every change of state on `/play/` is animated, and a few rules keep that smooth:

- nothing is cut: words, buttons and the light behind the pack fade or rise in and out (`data-out`, `.swap` and `.captionBody` in `src/cards/cards.module.css`), and the 3D parts ease toward their new place every frame
- where a picture on the page and a 3D card stand in for each other (the recap grid, the homepage's painted pack), the 3D one is drawn in the same spot first and made to look the same (`shade` in `stage3d.ts`) before the picture fades
- slow work never runs while something moves: textures are painted between frames at quiet moments (`quiet` in `stage3d.ts`) and sent to the GPU ahead of the frame that needs them, and the first pictures start loading when 🎮 is tapped (`warmArt` in `morph.tsx`)
- the light behind the pack only changes `opacity`, `translate` and `scale`, which the browser animates without repainting it

Add `?slowmo=6` to the `/play/` URL to slow the 3D scene down six times when checking it frame by frame (the page's own fades keep their speed). It also puts the scene on `window.cardStage`, so a test script can wait on its clock instead of on real time.

New posts and works show up as cards automatically.
