/** @type {import('next').NextConfig} */
const nextConfig = {
  api: {
    bodyParser: {
      sizeLimit: '10mb', // Increase to 10MB or more as needed
    },
  },

    typescript: {
    ignoreBuildErrors: true
  },
  // If using App Router with server actions:
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
}

module.exports = nextConfig