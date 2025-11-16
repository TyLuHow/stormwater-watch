/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // All TypeScript errors should be fixed before production
    ignoreBuildErrors: false,
  },
  images: {
    unoptimized: true,
  },
  // Increase API route timeout for case packet generation
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
}

export default nextConfig
