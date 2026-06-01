import { NextRequest, NextResponse } from "next/server";
import { writeFile, unlink, mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import { config } from "@/lib/config";
import { ingestDocument } from "@/lib/ingestion";
import { isSupportedFileType, getFileExtension, generateId } from "@/lib/utils";
import type { ApiResponse, UploadResult } from "@/lib/types";

const UPLOAD_DIR = path.join(process.cwd(), "data", "uploads");

/**
 * POST /api/documents/upload
 * 接收 FormData，保存文件并触发文档摄入管道
 */
export async function POST(request: NextRequest) {
  try {
    // 确保上传目录存在
    if (!existsSync(UPLOAD_DIR)) {
      await mkdir(UPLOAD_DIR, { recursive: true });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "未找到文件" } satisfies ApiResponse,
        { status: 400 }
      );
    }

    // 文件大小校验
    if (file.size > config.maxFileSize) {
      return NextResponse.json(
        { success: false, error: "文件大小超过 20MB 限制" } satisfies ApiResponse,
        { status: 400 }
      );
    }

    // 文件类型校验
    if (!isSupportedFileType(file.name)) {
      return NextResponse.json(
        {
          success: false,
          error: `不支持的文件类型，允许: ${config.supportedTypes.join(", ")}`,
        } satisfies ApiResponse,
        { status: 400 }
      );
    }

    // 保存文件
    const ext = getFileExtension(file.name);
    const uniqueName = `${generateId()}.${ext}`;
    const filePath = path.join(UPLOAD_DIR, uniqueName);

    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filePath, buffer);

    console.log(`[Upload] 文件已保存: ${filePath}`);

    // 触发摄入管道
    let result: UploadResult;
    try {
      result = await ingestDocument(filePath, file.name, ext);
    } catch (ingestError) {
      console.error("[Upload] 摄入失败:", ingestError);
      // 摄入失败时清理已保存的文件
      await unlink(filePath).catch(() => {});
      return NextResponse.json(
        {
          success: false,
          error: `文档处理失败: ${ingestError instanceof Error ? ingestError.message : "未知错误"}`,
        } satisfies ApiResponse,
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result,
    } satisfies ApiResponse<UploadResult>);
  } catch (error) {
    console.error("[Upload] 请求处理失败:", error);
    return NextResponse.json(
      { success: false, error: "服务器内部错误" } satisfies ApiResponse,
      { status: 500 }
    );
  }
}
