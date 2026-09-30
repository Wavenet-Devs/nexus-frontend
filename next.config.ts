import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Imagen de producción mínima: .next/standalone trae server.js y solo las
  // dependencias que usa la app (ver Dockerfile).
  output: "standalone",
  poweredByHeader: false,
};

export default nextConfig;
