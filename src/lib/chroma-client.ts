import { ChromaClient } from "chromadb";
import { config } from "./config";

/** ChromaClient 单例 */
let chromaClient: ChromaClient | null = null;

export function getChromaClient(): ChromaClient {
  if (!chromaClient) {
    chromaClient = new ChromaClient({
      path: config.chromaUrl,
    });
    console.log(`[Chroma] 已连接: ${config.chromaUrl}`);
  }
  return chromaClient;
}

/** 获取或创建 Chroma Collection */
export async function getCollection() {
  const client = getChromaClient();
  try {
    const collection = await client.getOrCreateCollection({
      name: config.collectionName,
    });
    console.log(`[Chroma] Collection "${config.collectionName}" 就绪`);
    return collection;
  } catch (error) {
    console.error("[Chroma] 获取 Collection 失败:", error);
    throw new Error("Chroma 连接失败，请确认 Docker 容器已启动");
  }
}

/** 健康检查：验证 Chroma 是否可用 */
export async function checkChromaHealth(): Promise<boolean> {
  try {
    const client = getChromaClient();
    await client.heartbeat();
    return true;
  } catch {
    return false;
  }
}
