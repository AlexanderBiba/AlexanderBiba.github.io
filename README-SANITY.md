# Sanity CMS Setup

This site is powered by Sanity CMS for blog content. The Sanity Studio is available at `/studio`.

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Create a Sanity project:**
   - Go to [sanity.io](https://sanity.io) and create a new project
   - Note your Project ID and Dataset name (usually "production")

3. **Configure environment variables:**
   - Create a `.env.local` file in the root directory (or copy from `.env.local.example` if it exists)
   - Add the following variables:
     ```env
     NEXT_PUBLIC_SANITY_PROJECT_ID=your-project-id
     NEXT_PUBLIC_SANITY_DATASET=production
     ```
   - Get your Sanity Project ID from your project settings
   - **Note:** `.env.local` is automatically ignored by git and loaded by Next.js

4. **Start the development server:**
   ```bash
   npm run dev
   ```

## Sanity Studio

To access the Sanity Studio for content management, you can either:

1. **Deploy Sanity Studio separately** (recommended for production):
   - Follow the [Sanity Studio deployment guide](https://www.sanity.io/docs/deployment)

2. **Add Studio to your Next.js app** (for development):
   - The studio can be accessed at `/studio` if you add the studio route to your Next.js app

## Content Types

The following content types are available in Sanity:

- **Blog Post** - Blog posts with markdown content
- **About** - About section with bio, avatar, and passions
- **Experience** - Work experience entries
- **Education** - Education entries
- **Project** - Portfolio projects
- **Skill Category** - Skill categories with associated skills
- **Home** - Home page hero section

## Migration Notes

If you previously used local markdown posts + a migration script, those were removed after the content was migrated into Sanity.

