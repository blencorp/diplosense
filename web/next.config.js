/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  images: {
    domains: ['localhost'],
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: process.env.NODE_ENV === 'production' 
          ? 'http://api:8000/api/:path*'
          : 'http://localhost:8000/api/:path*',
      },
    ]
  },
}

module.exports = nextConfig