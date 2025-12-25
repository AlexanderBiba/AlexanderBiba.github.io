import { createClient } from '@sanity/client'

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production'

// Only create client if projectId is configured
export const client = projectId
  ? createClient({
      projectId,
      dataset,
      useCdn: process.env.NODE_ENV === 'production',
      apiVersion: '2024-01-01',
    })
  : null

export const isSanityConfigured = () => !!projectId

