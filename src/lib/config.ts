/**
 * 统一配置对象
 * 所有环境变量在这里集中管理，提供默认值
 */
export const config = {
  /** Ollama 服务地址 */
  ollamaBaseUrl: process.env.OLLAMA_BASE_URL || "http://localhost:11434",

  /** Chroma 向量数据库地址 */
  chromaUrl: process.env.CHROMA_URL || "http://localhost:8000",

  /** LLM 模型名称 */
  llmModel: process.env.LLM_MODEL || "qwen3.5:0.8b",

  /** Embedding 模型名称 */
  embeddingModel: process.env.EMBEDDING_MODEL || "bge-m3",

  /** Chroma Collection 名称 */
  collectionName: process.env.CHROMA_COLLECTION || "enterprise_knowledge",

  /** 文档分块大小 */
  chunkSize: parseInt(process.env.CHUNK_SIZE || "1000", 10),

  /** 分块重叠大小 */
  chunkOverlap: parseInt(process.env.CHUNK_OVERLAP || "200", 10),

  /** 检索 Top-K */
  topK: parseInt(process.env.TOP_K || "4", 10),

  /** 上传文件大小限制 (20MB) */
  maxFileSize: 20 * 1024 * 1024,

  /** 支持的文件类型 */
  supportedTypes: ["pdf", "txt", "md", "markdown", "docx"] as const,
};

export type SupportedFileType = (typeof config.supportedTypes)[number];
