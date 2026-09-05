/** @type {import('next').NextConfig} */
const nextConfig = {
  trailingSlash: true,
  outputFileTracingIncludes: { '/*': ['./content/**/*.md'] },
}

module.exports = nextConfig
