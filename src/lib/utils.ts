import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { config, type SupportedFileType } from "./config";

/** shadcn/ui 工具函数：合并 CSS 类名 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** 从文件名获取扩展名（小写） */
export function getFileExtension(filename: string): string {
  const parts = filename.split(".");
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : "";
}

/** 判断文件类型是否被支持 */
export function isSupportedFileType(filename: string): filename is `${string}.${SupportedFileType}` {
  const ext = getFileExtension(filename);
  return (config.supportedTypes as readonly string[]).includes(ext);
}

/** 将扩展名映射为统一的文件类型标识 */
export function normalizeFileType(ext: string): SupportedFileType {
  const mapping: Record<string, SupportedFileType> = {
    pdf: "pdf",
    txt: "txt",
    md: "markdown",
    markdown: "markdown",
    docx: "docx",
  };
  return mapping[ext] || "txt";
}

/** 格式化文件大小 (bytes → human readable) */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${units[i]}`;
}

/** 生成唯一 ID */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/** 生成聊天消息 ID */
export function generateMessageId(): string {
  return `msg-${generateId()}`;
}
