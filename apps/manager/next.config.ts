import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  transpilePackages: ['@pkg/ui', '@pkg/db'],
}

export default nextConfig
