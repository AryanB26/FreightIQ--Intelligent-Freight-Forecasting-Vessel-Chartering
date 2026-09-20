import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // CesiumJS requires special webpack configuration
  webpack: (config, { isServer }) => {
    // CesiumJS uses `require` for worker files and needs to be treated as external
    // on the server side
    if (isServer) {
      config.externals = [...(config.externals || []), { cesium: "commonjs cesium" }];
    }

    // Handle CesiumJS worker files
    config.resolve = config.resolve || {};
    config.resolve.alias = {
      ...config.resolve.alias,
    };

    // Ensure CesiumJS assets can be served
    config.module = config.module || {};
    config.module.rules = config.module.rules || [];
    config.module.rules.push({
      test: /\.wasm$/,
      type: "asset/resource",
    });

    return config;
  },
  // Transpile CesiumJS for proper ESM/CJS compatibility
  transpilePackages: ["cesium"],
};

export default nextConfig;
