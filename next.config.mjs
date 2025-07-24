// next.config.mjs
import withPWA from 'next-pwa'

const isDev = process.env.NODE_ENV === 'development'

const nextConfig = {
  // Your base Next.js config here (e.g., images, i18n, etc.)
}

export default withPWA({
  dest: 'public',
  disable: isDev,
  register: true,
  skipWaiting: true,
  swSrc: 'sw.js', // your custom Service Worker source
})(nextConfig)
