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


