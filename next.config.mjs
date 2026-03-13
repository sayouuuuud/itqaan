/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['puppeteer-core', '@sparticuz/chromium', 'puppeteer'],
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  devIndicators: {
    buildActivity: false,
  },
}

export default nextConfig
