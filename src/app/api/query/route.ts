import { NextRequest } from "next/server";
import { queryRAG } from "@/lib/rag-chain";

/**
 * POST /api/query
 * SSE 流式 RAG 问答接口
 *
 * Request: { question: string, history: string[] }
 * Response: SSE stream
 *   event: sources  → 检索到的文档来源
 *   event: token    → LLM 生成的文本片段
 *   event: done     → 生成完成
 *   event: error    → 错误信息
 */
export async function POST(request: NextRequest) {
  try {
    const { question, history = [] } = await request.json();

    if (!question || typeof question !== "string") {
      return new Response(
        JSON.stringify({ success: false, error: "缺少问题参数" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of queryRAG(question, history)) {
            const data = encoder.encode(
              `event: ${event.type}\ndata: ${JSON.stringify({
                content: event.content,
                sources: event.sources,
              })}\n\n`
            );
            controller.enqueue(data);
          }
        } catch (error) {
          const errData = encoder.encode(
            `event: error\ndata: ${JSON.stringify({
              content: error instanceof Error ? error.message : "服务器内部错误",
            })}\n\n`
          );
          controller.enqueue(errData);
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("[Query API] 请求处理失败:", error);
    return new Response(
      JSON.stringify({ success: false, error: "服务器内部错误" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
