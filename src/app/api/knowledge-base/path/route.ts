import { NextResponse } from "next/server";
import { config } from "@/lib/config";
import type { ApiResponse } from "@/lib/types";

/**
 * GET /api/knowledge-base/path
 * 返回 knowledge-base/ 文件夹的绝对路径，供前端展示
 */
export async function GET() {
  return NextResponse.json({
    success: true,
    data: { path: config.knowledgeBaseDir },
  } satisfies ApiResponse<{ path: string }>);
}
