/**
 * 统一 RAG Service 封装
 * 所有前端 API 请求的集中管理，类型安全
 */
import { apiClient } from "./api-client";
import type { ApiResponse, DocumentRecord, UploadResult } from "./types";

/** 健康检查 */
export async function checkHealth() {
  const res = await apiClient.get<ApiResponse<{ chroma: string; ollama: string }>>(
    "/api/health"
  );
  return res.data;
}

/** 获取文档列表 */
export async function getDocuments() {
  const res = await apiClient.get<ApiResponse<DocumentRecord[]>>(
    "/api/documents"
  );
  return res.data;
}

/**
 * 发送 RAG 查询（SSE 流式响应）
 * 返回 ReadableStream，调用方自行解析 SSE 事件流
 */
export async function queryStream(question: string, history: string[]) {
  const res = await apiClient.post(
    "/api/query",
    { question, history },
    {
      responseType: "stream",
    }
  );
  return res.data as ReadableStream<Uint8Array>;
}

/** 上传文档 */
export async function uploadDocument(file: File) {
  const formData = new FormData();
  formData.append("file", file);

  const res = await apiClient.post<ApiResponse<UploadResult>>(
    "/api/documents/upload",
    formData
  );
  return res.data;
}

/** 删除文档 */
export async function deleteDocument(filename: string) {
  const res = await apiClient.delete<ApiResponse>(
    "/api/documents",
    { data: { filename } }
  );
  return res.data;
}
