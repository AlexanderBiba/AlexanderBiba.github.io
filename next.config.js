/** @type {import('next').NextConfig} */
const nextConfig = {
  // The whole site is prebuilt into `out/` and served as static assets by a
  // Cloudflare Worker (see wrangler.jsonc), so there is no Next.js server.
  output: 'export',
  trailingSlash: true,
  // Static export can't use the on-demand image optimizer.
  images: { unoptimized: true },
}

module.exports = nextConfig
