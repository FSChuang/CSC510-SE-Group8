/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    typedRoutes: true
  },
  images: {
    domains: ["i.ytimg.com"]
  }
};
module.exports = nextConfig;
