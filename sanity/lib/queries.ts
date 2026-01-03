// Site Settings query (singleton)
export const siteSettingsQuery = `*[_type == "siteSettings" && _id == "siteSettings"][0]{
  name,
  aboutBlurb,
  email,
  github,
  linkedin,
  twitter,
  avatar{
    asset->{
      _id,
      url
    }
  }
}`

// Blog Posts queries
export const blogPostQuery = `*[_type == "blogPosts" && slug.current == $slug][0]{
  ...,
  ogImage{
    asset->{
      _id,
      url
    }
  }
}`
export const allBlogPostsQuery = `*[_type == "blogPosts"] | order(date desc){
  ...,
  ogImage{
    asset->{
      _id,
      url
    }
  }
}`
export const latestBlogPostsQuery = `*[_type == "blogPosts"] | order(date desc)[0...$limit]{
  ...,
  ogImage{
    asset->{
      _id,
      url
    }
  }
}`


