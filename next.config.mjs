/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enforce TypeScript errors at build time so we catch regressions early
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
