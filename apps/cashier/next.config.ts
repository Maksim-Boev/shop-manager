import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  transpilePackages: ['@pkg/ui', '@pkg/components', '@pkg/db'],
}

export default nextConfig
