import { NextResponse } from "next/server";
import { existsSync, readdirSync, statSync } from "fs";
import path from "path";
import { config } from "@/lib/config";
import { getCollection } from "@/lib/chroma-client";
import { ingestDocument } from "@/lib/ingestion";
import { isSupportedFileType, getFileExtension } from "@/lib/utils";
import type { ApiResponse, UploadResult } from "@/lib/types";

export const maxDuration = 300; // 扫描大文档最多 5 分钟

export interface ScanResult {
  scanned: number;
  ingested: number;
  skipped: number;
  errors: { filename: string; error: string }[];
  results: UploadResult[];
}

/**
 * POST /api/documents/scan
 * 扫描 knowledge-base/ 目录，批量摄入新文档
 */
export async function POST() {
  try {
    const knowledgeBaseDir = config.knowledgeBaseDir;

    // 确保知识库目录存在
    if (!existsSync(knowledgeBaseDir)) {
      return NextResponse.json({
        success: true,
        data: {
          scanned: 0,
          ingested: 0,
          skipped: 0,
          errors: [],
          results: [],
        },
      } satisfies ApiResponse<ScanResult>);
    }

    // Step 1: 扫描目录中所有文件
    const allFiles = readdirSync(knowledgeBaseDir).filter(
      (f) => !f.startsWith(".") && isSupportedFileType(f)
    );

    console.log(`[Scan] 发现 ${allFiles.length} 个受支持的文件`);

    // Step 2: 获取 Chroma 中已入库的文件名
    const collection = await getCollection();
    const existingDocs = await collection.get();
    const ingestedFiles = new Set<string>();

    if (existingDocs.metadatas) {
      for (const meta of existingDocs.metadatas) {
        const fileName = (meta as Record<string, unknown>).fileName as string;
        if (fileName) {
          ingestedFiles.add(fileName);
        }
      }
    }

    // Step 3: 找出新文件
    const newFiles = allFiles.filter((f) => !ingestedFiles.has(f));
    const skippedCount = allFiles.length - newFiles.length;

    console.log(
      `[Scan] 已入库 ${ingestedFiles.size} 个文档, ` +
        `${newFiles.length} 个新文档待摄入`
    );

    // Step 4: 逐个摄入新文档
    const errors: { filename: string; error: string }[] = [];
    const results: UploadResult[] = [];

    for (const filename of newFiles) {
      const filePath = path.join(knowledgeBaseDir, filename);
      const ext = getFileExtension(filename);

      console.log(`[Scan] 正在摄入: ${filename}`);

      try {
        const result = await ingestDocument(filePath, filename, ext);
        results.push(result);
        console.log(`[Scan] ✓ ${filename} 摄入成功 (${result.chunkCount} 块)`);
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : "未知错误";
        console.error(`[Scan] ✗ ${filename} 摄入失败:`, errMsg);
        errors.push({ filename, error: errMsg });
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        scanned: allFiles.length,
        ingested: results.length,
        skipped: skippedCount,
        errors,
        results,
      },
    } satisfies ApiResponse<ScanResult>);
  } catch (error) {
    console.error("[Scan] 扫描失败:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "扫描知识库失败",
      } satisfies ApiResponse,
      { status: 500 }
    );
  }
}
