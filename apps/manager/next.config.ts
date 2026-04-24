import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  transpilePackages: ['@shop/ui', '@shop/db'],
}

export default nextConfig
