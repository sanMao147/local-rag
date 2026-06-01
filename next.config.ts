import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ChromaDB 和 pdf-parse 等包含 Node 原生依赖的包需要在服务端外部化
  serverExternalPackages: ["chromadb", "pdf-parse", "mammoth", "@langchain/core", "@langchain/community", "langchain"],
};

export default nextConfig;
