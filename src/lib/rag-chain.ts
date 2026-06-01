import { StringOutputParser } from "@langchain/core/output_parsers";
import { getEmbeddings, createLLM } from "./ollama-client";
import { getCollection } from "./chroma-client";
import { buildSystemPrompt } from "./prompt";
import { config } from "./config";
import type { SourceChunk } from "./types";

/**
 * RAG 问答管道
 * 1. 用户问题 → Embedding
 * 2. Chroma 语义检索
 * 3. 构建 System Prompt + 上下文
 * 4. LLM 流式生成
 *
 * 返回一个 ReadableStream，用于 SSE 流式输出
 */
export async function* queryRAG(question: string, history: string[]): AsyncGenerator<{
  type: "sources" | "token" | "done" | "error";
  content: string;
  sources?: SourceChunk[];
}> {
  try {
    // Step 1: 语义检索
    const embeddings = getEmbeddings();
    const collection = await getCollection();

    // 将问题向量化后检索
    const queryEmbedding = await embeddings.embedQuery(question);

    const results = await collection.query({
      queryEmbeddings: [queryEmbedding],
      nResults: config.topK,
    });

    // 构造 SourceChunk 列表
    const sources: SourceChunk[] = [];
    if (results.documents?.[0] && results.metadatas?.[0]) {
      for (let i = 0; i < results.documents[0].length; i++) {
        const doc = results.documents[0][i];
        const meta = results.metadatas[0][i] as Record<string, unknown>;
        const distance = results.distances?.[0]?.[i] ?? 0;
        sources.push({
          content: doc || "",
          source: (meta.source as string) || (meta.fileName as string) || "未知",
          fileName: (meta.fileName as string) || "未知",
          page: meta.page as number | undefined,
          score: 1 - distance, // 将距离转换为相似度分数
        });
      }
    }

    console.log(`[RAG] 检索到 ${sources.length} 个相关片段`);

    // 先返回来源信息
    yield { type: "sources", content: "", sources };

    // Step 2: 构建提示词
    const systemPrompt = buildSystemPrompt(sources);

    // Step 3: LLM 流式生成
    const llm = createLLM();
    const parser = new StringOutputParser();

    // 构造消息
    const messages = [
      ["system", systemPrompt],
      ...history.map((msg, i) =>
        i % 2 === 0 ? ["human", msg] as [string, string] : ["assistant", msg] as [string, string]
      ),
      ["human", question],
    ];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const stream = await (llm as any).stream(messages);

    for await (const chunk of stream) {
      const text = typeof chunk === "string" ? chunk : chunk.content || "";
      if (text) {
        yield { type: "token", content: text };
      }
    }

    yield { type: "done", content: "" };
  } catch (error) {
    console.error("[RAG] 查询失败:", error);
    yield {
      type: "error",
      content: error instanceof Error ? error.message : "查询处理失败",
    };
  }
}
