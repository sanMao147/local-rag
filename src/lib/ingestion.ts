import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { TextLoader } from "langchain/document_loaders/fs/text";
import { DocxLoader } from "@langchain/community/document_loaders/fs/docx";
import type { Document } from "@langchain/core/documents";
import { getEmbeddings } from "./ollama-client";
import { getCollection } from "./chroma-client";
import { config } from "./config";
import { normalizeFileType, getFileExtension } from "./utils";
import type { UploadResult } from "./types";

/**
 * 根据文件路径和类型选择合适的 Document Loader
 */
function getLoader(filePath: string, fileType: string) {
  const ext = getFileExtension(filePath) || fileType;

  switch (ext) {
    case "pdf":
      return new PDFLoader(filePath, {
        splitPages: true,
      });
    case "docx":
      return new DocxLoader(filePath);
    case "md":
    case "markdown":
    case "txt":
    default:
      return new TextLoader(filePath);
  }
}

/**
 * 完整文档摄入管道
 * 1. 解析文档内容
 * 2. 智能分块
 * 3. 生成向量并存储到 Chroma
 */
export async function ingestDocument(
  filePath: string,
  originalFilename: string,
  fileType: string
): Promise<UploadResult> {
  const normalizedType = normalizeFileType(fileType);

  // Step 1: 加载文档
  console.log(`[Ingestion] 加载文档: ${originalFilename}`);
  const loader = getLoader(filePath, normalizedType);
  let rawDocs = await loader.load();

  console.log(`[Ingestion] 文档加载完成, ${rawDocs.length} 页/段`);

  // Step 2: 智能分块
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: config.chunkSize,
    chunkOverlap: config.chunkOverlap,
    separators: ["\n\n", "\n", "。", "！", "？", "；", " ", ""],
  });

  const chunks = await splitter.splitDocuments(rawDocs);
  console.log(`[Ingestion] 分块完成, 共 ${chunks.length} 块`);

  // Step 3: 为每个 chunk 添加元数据
  const docsWithMetadata = chunks.map((doc: Document) => ({
    ...doc,
    metadata: {
      ...doc.metadata,
      source: originalFilename,
      fileName: originalFilename,
      fileType: normalizedType,
      uploadedAt: new Date().toISOString(),
    },
  }));

  // Step 4: 向量化并写入 Chroma
  console.log(`[Ingestion] 向量化并写入 Chroma...`);
  const embeddings = getEmbeddings();
  const collection = await getCollection();

  // 批量写入（使用文档内容生成向量）
  const ids = Array.from({ length: docsWithMetadata.length }, (_, i) =>
    `${originalFilename}_${Date.now()}_${i}`
  );

  await collection.add({
    ids,
    documents: docsWithMetadata.map((d) => d.pageContent),
    metadatas: docsWithMetadata.map((d) => d.metadata),
  });

  console.log(`[Ingestion] 完成! 文档 "${originalFilename}" 共 ${chunks.length} 块已入库`);

  return {
    documentId: ids[0],
    filename: originalFilename,
    fileType: normalizedType,
    chunkCount: chunks.length,
  };
}

/**
 * 删除指定文档的所有向量
 */
export async function removeDocument(filename: string): Promise<void> {
  const collection = await getCollection();

  // 按 metadata.fileName 过滤并删除
  const results = await collection.get({
    where: { fileName: { $eq: filename } },
  });

  if (results.ids.length > 0) {
    await collection.delete({ ids: results.ids });
    console.log(`[Ingestion] 已删除文档 "${filename}" 的 ${results.ids.length} 个向量`);
  }
}
