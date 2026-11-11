import withPWA from 'next-pwa'

/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  // Pin the project root so a lockfile in a parent folder is never picked up
  outputFileTracingRoot: import.meta.dirname,
  images: {
    unoptimized: true,
  },
}

// PWA configuration for offline support
const pwaConfig = withPWA({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development', // Disable in dev to avoid caching issues
})

export default pwaConfig(nextConfig)
