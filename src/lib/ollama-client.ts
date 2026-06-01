import { OllamaEmbeddings } from "@langchain/community/embeddings/ollama";
import { ChatOllama } from "@langchain/community/chat_models/ollama";
import { config } from "./config";
import { serverApi } from "./server-api";

/** Embedding 模型单例 */
let embeddingsInstance: OllamaEmbeddings | null = null;

export function getEmbeddings(): OllamaEmbeddings {
  if (!embeddingsInstance) {
    embeddingsInstance = new OllamaEmbeddings({
      model: config.embeddingModel,
      baseUrl: config.ollamaBaseUrl,
    });
    console.log(`[Ollama] Embedding 模型 "${config.embeddingModel}" 已初始化`);
  }
  return embeddingsInstance;
}

/** LLM 模型工厂（每次新建，避免状态污染） */
export function createLLM(): ChatOllama {
  return new ChatOllama({
    model: config.llmModel,
    baseUrl: config.ollamaBaseUrl,
    temperature: 0.3,
  });
}

/** 健康检查：验证 Ollama 是否可用 */
export async function checkOllamaHealth(): Promise<boolean> {
  try {
    const resp = await serverApi.get("/api/tags");
    return resp.status === 200;
  } catch {
    return false;
  }
}
