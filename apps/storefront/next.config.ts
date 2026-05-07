import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Transpile hydrogen-react so Turbopack processes it as local code and
  // shares the same React instance as the rest of the app.
  // Using serverExternalPackages instead causes a second React copy to be
  // loaded via Node require, breaking hooks ("Cannot read useContext of null").
  transpilePackages: ["@shopify/hydrogen-react"],

  images: {
    remotePatterns: [
      // Shopify-hosted product, collection, and shop assets.
      { protocol: "https", hostname: "cdn.shopify.com", pathname: "/**" },
    ],
  },
};

export default nextConfig;
