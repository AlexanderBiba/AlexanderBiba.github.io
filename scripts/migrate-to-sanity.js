const { createClient } = require('@sanity/client')
const fs = require('fs')
const path = require('path')
const matter = require('gray-matter')

// Load environment variables from .env.local (preferred) or .env
const envLocalPath = path.join(__dirname, '../.env.local')
const envPath = path.join(__dirname, '../.env')

if (fs.existsSync(envLocalPath)) {
  require('dotenv').config({ path: envLocalPath })
  console.log('📄 Loaded environment from .env.local')
} else if (fs.existsSync(envPath)) {
  require('dotenv').config({ path: envPath })
  console.log('📄 Loaded environment from .env')
} else {
  // Try to load from default locations (Next.js will handle this in runtime)
  require('dotenv').config()
  console.log('📄 Attempting to load environment variables...')
}

// Initialize Sanity client
const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  useCdn: false,
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN,
})

// Helper to format date
function formatDate(date) {
  if (!date) {
    const now = new Date()
    return now.toISOString().split('T')[0]
  }
  if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return date
  }
  const dateObj = new Date(date)
  return dateObj.toISOString().split('T')[0]
}

// Migrate blog posts
async function migrateBlogPosts() {
  console.log('📝 Migrating blog posts...')
  const postsDir = path.join(__dirname, '../src/posts')
  const files = fs.readdirSync(postsDir).filter(file => 
    file.endsWith('.md') && !file.toLowerCase().includes('readme')
  )

  for (const file of files) {
    const filePath = path.join(postsDir, file)
    const fileContent = fs.readFileSync(filePath, 'utf-8')
    const { data, content } = matter(fileContent)
    
    // Extract title from first line starting with single '#'
    let title = data.title || 'Untitled'
    let processedContent = content
    
    const lines = content.split('\n')
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      if (line.trim().startsWith('# ')) {
        title = line.trim().substring(2).trim()
        lines.splice(i, 1)
        if (i < lines.length && lines[i].trim() === '') {
          lines.splice(i, 1)
        }
        processedContent = lines.join('\n')
        break
      }
    }
    
    const slug = file.replace('.md', '')
    
    const document = {
      _type: 'blogPosts',
      title,
      slug: {
        _type: 'slug',
        current: slug,
      },
      date: formatDate(data.date),
      description: data.description || '',
      content: processedContent,
    }

    if (data.ogImage) {
      document.ogImage = {
        _type: 'image',
        asset: {
          _type: 'reference',
          _ref: data.ogImage,
        },
      }
    }

    try {
      // Check if post already exists
      const existing = await client.fetch(
        `*[_type == "blogPosts" && slug.current == $slug][0]`,
        { slug }
      )

      if (existing) {
        console.log(`  ⏭️  Skipping ${slug} (already exists)`)
        continue
      }

      await client.create(document)
      console.log(`  ✅ Migrated: ${slug}`)
    } catch (error) {
      console.error(`  ❌ Error migrating ${slug}:`, error.message)
    }
  }
}

// Main migration function
async function migrate() {
  console.log('🚀 Starting Sanity migration...\n')

  // Check for required environment variables
  if (!process.env.NEXT_PUBLIC_SANITY_PROJECT_ID) {
    console.error('❌ NEXT_PUBLIC_SANITY_PROJECT_ID is not set')
    console.error('   Make sure you have a .env.local file with:')
    console.error('   NEXT_PUBLIC_SANITY_PROJECT_ID=your-project-id')
    process.exit(1)
  }

  if (!process.env.SANITY_API_TOKEN) {
    console.error('❌ SANITY_API_TOKEN is not set')
    console.error('   You need a write token to migrate data.')
    console.error('   Add it to your .env.local file:')
    console.error('   SANITY_API_TOKEN=your-api-token')
    console.error('   Get one from: https://sanity.io/manage')
    process.exit(1)
  }

  console.log(`✅ Using Sanity Project ID: ${process.env.NEXT_PUBLIC_SANITY_PROJECT_ID}`)
  console.log(`✅ Using Dataset: ${process.env.NEXT_PUBLIC_SANITY_DATASET || 'production'}\n`)

  try {
    await migrateBlogPosts()
    
    console.log('\n✅ Migration complete!')
  } catch (error) {
    console.error('\n❌ Migration failed:', error)
    process.exit(1)
  }
}

migrate()

