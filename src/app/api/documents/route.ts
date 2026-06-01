import { NextRequest, NextResponse } from "next/server";
import { unlink } from "fs/promises";
import path from "path";
import fs from "fs";
import { getCollection } from "@/lib/chroma-client";
import { removeDocument } from "@/lib/ingestion";
import type { ApiResponse, DocumentRecord } from "@/lib/types";

const UPLOAD_DIR = path.join(process.cwd(), "data", "uploads");

/**
 * GET /api/documents
 * 列出所有已入库文档（从 Chroma 元数据去重获取）
 */
export async function GET() {
  try {
    const collection = await getCollection();
    const results = await collection.get();

    // 从所有 chunks 的元数据中提取去重的文档信息
    const docMap = new Map<string, DocumentRecord>();

    if (results.metadatas && results.ids) {
      for (let i = 0; i < results.metadatas.length; i++) {
        const meta = results.metadatas[i] as Record<string, unknown>;
        const fileName = meta.fileName as string;

        if (!fileName || docMap.has(fileName)) {
          // 已存在则只增加 chunkCount
          if (fileName && docMap.has(fileName)) {
            const existing = docMap.get(fileName)!;
            existing.chunkCount += 1;
          }
          continue;
        }

        docMap.set(fileName, {
          id: results.ids[i] as string,
          filename: fileName,
          fileType: (meta.fileType as DocumentRecord["fileType"]) || "txt",
          fileSize: 0,
          chunkCount: 1,
          uploadedAt: (meta.uploadedAt as string) || "",
        });
      }
    }

    // 获取文件系统中的文件大小
    const fileNames = fs.readdirSync(UPLOAD_DIR).filter((f) => !f.startsWith("."));
    for (const [fileName, doc] of docMap) {
      const matchingFile = fileNames.find((f) => f.endsWith(path.extname(fileName)));
      if (matchingFile) {
        try {
          const stats = fs.statSync(path.join(UPLOAD_DIR, matchingFile));
          doc.fileSize = stats.size;
        } catch {
          // ignore
        }
      }
    }

    const docs = Array.from(docMap.values()).sort(
      (a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
    );

    return NextResponse.json({
      success: true,
      data: docs,
    } satisfies ApiResponse<DocumentRecord[]>);
  } catch (error) {
    console.error("[Documents] 获取文档列表失败:", error);
    return NextResponse.json(
      { success: false, error: "获取文档列表失败" } satisfies ApiResponse,
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/documents
 * 删除指定文档及其所有向量数据
 */
export async function DELETE(request: NextRequest) {
  try {
    const { filename } = await request.json();

    if (!filename) {
      return NextResponse.json(
        { success: false, error: "缺少文件名参数" } satisfies ApiResponse,
        { status: 400 }
      );
    }

    // 从 Chroma 删除向量
    await removeDocument(filename);

    // 从文件系统删除源文件
    const files = fs.readdirSync(UPLOAD_DIR);
    for (const file of files) {
      if (file.endsWith(path.extname(filename))) {
        const fullPath = path.join(UPLOAD_DIR, file);
        // 简单判断：文件名中包含相同的扩展名
        await unlink(fullPath).catch(() => {});
      }
    }

    console.log(`[Documents] 已删除文档: ${filename}`);

    return NextResponse.json({
      success: true,
      data: { filename },
    } satisfies ApiResponse);
  } catch (error) {
    console.error("[Documents] 删除文档失败:", error);
    return NextResponse.json(
      { success: false, error: "删除文档失败" } satisfies ApiResponse,
      { status: 500 }
    );
  }
}
