import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'
import { visionTool } from '@sanity/vision'
import { markdownSchema } from 'sanity-plugin-markdown'

// Import schemas
import blogPosts from './sanity/schemas/blogPosts'

export default defineConfig({
  name: 'default',
  title: 'Alex Biba Portfolio',
  
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  
  basePath: '/studio',
  
  plugins: [
    structureTool(), 
    visionTool(),
    markdownSchema(),
  ],
  
  schema: {
    types: [
      blogPosts,
    ],
  },
})

