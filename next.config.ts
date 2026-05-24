import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/dashboard/admin",
        destination: "/admin",
        permanent: false,
      },
      {
        source: "/dashboard/admin/login",
        destination: "/admin/login",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
