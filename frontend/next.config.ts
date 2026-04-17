/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['@clerk/nextjs'],
  experimental: {
    serverComponentsExternalPackages: ['@clerk/nextjs'],
  },
}

module.exports = nextConfig