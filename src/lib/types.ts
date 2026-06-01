/** 文档记录 */
export interface DocumentRecord {
  id: string;
  filename: string;
  fileType: "pdf" | "markdown" | "txt" | "docx";
  fileSize: number;
  chunkCount: number;
  uploadedAt: string;
}

/** 检索来源片段 */
export interface SourceChunk {
  content: string;
  source: string;
  fileName: string;
  page?: number;
  score: number;
}

/** 聊天消息 */
export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: SourceChunk[];
  timestamp: number;
}

/** API 统一响应 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

/** 文档上传结果 */
export interface UploadResult {
  documentId: string;
  filename: string;
  fileType: string;
  chunkCount: number;
}
