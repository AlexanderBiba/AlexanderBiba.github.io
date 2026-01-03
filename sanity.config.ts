import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'
import { visionTool } from '@sanity/vision'
import { markdownSchema } from 'sanity-plugin-markdown'

// Import schemas
import blogPosts from './sanity/schemas/blogPosts'
import siteSettings from './sanity/schemas/siteSettings'

export default defineConfig({
  name: 'default',
  title: 'Alex Biba Portfolio',
  
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  
  basePath: '/studio',
  
  plugins: [
    structureTool({
      structure: (S) =>
        S.list()
          .title('Content')
          .items([
            // Singleton site settings
            S.listItem()
              .title('Site Settings')
              .id('siteSettings')
              .child(
                S.document()
                  .schemaType('siteSettings')
                  .documentId('siteSettings')
              ),
            // Divider
            S.divider(),
            // Blog posts
            ...S.documentTypeListItems().filter(
              (listItem) => !['siteSettings'].includes(listItem.getId() || '')
            ),
          ]),
    }), 
    visionTool(),
    markdownSchema(),
  ],
  
  schema: {
    types: [
      blogPosts,
      siteSettings,
    ],
  },
})

