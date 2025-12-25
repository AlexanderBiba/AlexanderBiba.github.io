# Sanity CMS Setup

This site is now powered by Sanity CMS. All content (blog posts, about section, experience, education, projects, skills, and home) is managed through Sanity.

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
     SANITY_API_TOKEN=your-api-token
     ```
   - Get your Sanity Project ID from your project settings
   - Get your API token from https://sanity.io/manage (needed for the migration script)
   - **Note:** `.env.local` is automatically ignored by git and loaded by Next.js

4. **Run the migration script:**
   ```bash
   npm run migrate-sanity
   ```
   This will backfill all existing content from local files into Sanity.

5. **Start the development server:**
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

The migration script (`scripts/migrate-to-sanity.js`) will:
- Migrate all blog posts from `src/posts/*.md`
- Create initial content for About, Experience, Education, Projects, Skills, and Home sections
- Skip existing documents to allow re-running safely

After migration, you can manage all content through the Sanity Studio interface.

