# Alex’s website

Live: https://alexbiba.com/

## Run and build

```sh
npm ci
npm run dev
npm run build
npm start
```

No CMS account, token, or environment variables are required. Deploy the Next.js app using the usual GitHub-connected hosting workflow; publishing content means committing changes and deploying a new build.

## Edit content

- `content/site.json`: name, bio, and social links, shared by the homepage and house.
- `content/blog.json`: blog titles, slugs, dates, and cover images.
- `content/blog/<slug>.md`: each article’s Markdown body.
- `content/projects.json`: project titles, slugs, dates, links, and preview images.
- `content/projects/<slug>.md`: each project’s Markdown body.
- `public/content/`: local article images and project previews. Reference them as `/content/filename.png`.
- `src/house/content.ts`: house dialogue; its project/blog links use the same content indexes as the main site.
- `src/house/world.ts`: house models, layout, and animations.

To add a post or project, add its Markdown file and matching index entry. Keep existing slugs to preserve incoming links. Entries are displayed newest first.

The repository contains all five published articles, four projects, profile settings, and their images. Both the main site and 3D mode read these local files; no external CMS or credentials are needed.

## Verify

```sh
node --test tests/*.test.mjs
npm run build
```

The experimental game is at `/play/`; see `src/house/README.md` for controls.
