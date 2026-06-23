import { createRequire } from 'module';

const require = createRequire(import.meta.url);

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ["bcryptjs"],
  },
  // swagger-ui-react ships its own CSS; allow it through the build
  transpilePackages: ["swagger-ui-react", "swagger-client", "react-syntax-highlighter"],
};

export default nextConfig;
