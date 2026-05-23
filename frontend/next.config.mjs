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
};

export default withPWA(nextConfig);
