/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  trailingSlash: true,

  images: {
    unoptimized: true,
  },

  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },

  compress: true,
  poweredByHeader: false,

  async rewrites() {
    return [
      { source: "/passport/:id", destination: "/passport?id=:id" },
      { source: "/passport/:id/", destination: "/passport?id=:id" },
    ];
  },
}

export default nextConfig
