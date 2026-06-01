import { NextResponse } from "next/server";
import { checkChromaHealth } from "@/lib/chroma-client";
import { checkOllamaHealth } from "@/lib/ollama-client";
import type { ApiResponse } from "@/lib/types";

/**
 * GET /api/health
 * 健康检查：验证 Chroma 和 Ollama 连接状态
 */
export async function GET() {
  try {
    const [chromaOk, ollamaOk] = await Promise.all([
      checkChromaHealth().catch(() => false),
      checkOllamaHealth().catch(() => false),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        chroma: chromaOk ? "connected" : "disconnected",
        ollama: ollamaOk ? "connected" : "disconnected",
      },
    } satisfies ApiResponse);
  } catch {
    return NextResponse.json({
      success: true,
      data: {
        chroma: "disconnected",
        ollama: "disconnected",
      },
    } satisfies ApiResponse);
  }
}
