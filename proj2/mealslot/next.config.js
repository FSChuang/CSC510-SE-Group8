/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    typedRoutes: false
  },
  images: {
    domains: ["i.ytimg.com"]
  }
};
module.exports = nextConfig;
