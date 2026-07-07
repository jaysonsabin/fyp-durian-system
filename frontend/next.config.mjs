import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development", // Disable SW in development to avoid caching dev hot-reload pages
  register: true,
  skipWaiting: true,
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: process.env.BACKEND_URL
          ? `${process.env.BACKEND_URL}/:path*`
          : "http://localhost:8001/:path*",
      },
    ];
  },

  async headers() {
    return [
      {
        source: '/((?!(?:_next|api|uploads)/).*)*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https://pcuvvkvpoowidzltiqmt.supabase.co; connect-src 'self' http://localhost:8001 https://open-meteo.com https://geocoding-api.open-meteo.com https://pcuvvkvpoowidzltiqmt.supabase.co;",
          }
        ],
      },
    ]
  }

};

export default withPWA(nextConfig);
