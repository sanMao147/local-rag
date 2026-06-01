"use client";

import { useState, useRef, DragEvent, ChangeEvent } from "react";
import { Upload, Loader2, FileText, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface UploadPanelProps {
  onUpload: (file: File) => Promise<void>;
}

export function UploadPanel({ onUpload }: UploadPanelProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      setSelectedFile(file);
      setError(null);
    }
  };

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    const allowedExtensions = ["pdf", "txt", "md", "markdown", "docx"];
    const ext = selectedFile.name.split(".").pop()?.toLowerCase();
    if (!ext || !allowedExtensions.includes(ext)) {
      setError("不支持的文件格式，支持: PDF, TXT, MD, DOCX");
      return;
    }

    if (selectedFile.size > 20 * 1024 * 1024) {
      setError("文件大小超过 20MB 限制");
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      await onUpload(selectedFile);
      setSelectedFile(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "上传失败");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200/60 p-5">
      <h3 className="text-sm font-semibold text-slate-800 mb-4 flex items-center gap-2">
        <Upload className="w-4 h-4 text-blue-500" />
        上传文档
      </h3>

      {/* 拖拽区域 */}
      <div
        className={`relative border-2 border-dashed rounded-xl p-6 text-center transition-all duration-200 cursor-pointer ${
          isDragging
            ? "border-blue-400 bg-blue-50/50 upload-active"
            : "border-slate-200 bg-slate-50 hover:border-blue-300 hover:bg-blue-50/30"
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept=".pdf,.txt,.md,.markdown,.docx"
          onChange={handleFileSelect}
        />

        {selectedFile ? (
          <div className="flex items-center gap-3 justify-center">
            <FileText className="w-8 h-8 text-blue-500" />
            <div className="text-left">
              <p className="text-sm font-medium text-slate-700 truncate max-w-[200px]">
                {selectedFile.name}
              </p>
              <p className="text-xs text-slate-400">
                {(selectedFile.size / 1024).toFixed(1)} KB
              </p>
            </div>
            <button
              className="ml-2 p-1 rounded-full hover:bg-slate-200 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedFile(null);
              }}
            >
              <X className="w-4 h-4 text-slate-400" />
            </button>
          </div>
        ) : (
          <div>
            <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-blue-50 flex items-center justify-center">
              <Upload className="w-5 h-5 text-blue-500" />
            </div>
            <p className="text-sm text-slate-600 font-medium">拖拽文件到此处</p>
            <p className="text-xs text-slate-400 mt-1">或点击选择文件</p>
            <p className="text-xs text-slate-300 mt-2">
              支持 PDF、Markdown、TXT、Word (.docx)
            </p>
          </div>
        )}
      </div>

      {/* 错误提示 */}
      {error && (
        <p className="mt-3 text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg">
          {error}
        </p>
      )}

      {/* 上传按钮 */}
      <Button
        className="w-full mt-3 bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-sm hover:shadow-md transition-all rounded-xl"
        disabled={!selectedFile || isUploading}
        onClick={handleUpload}
      >
        {isUploading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            解析中...
          </>
        ) : (
          <>
            <Upload className="w-4 h-4 mr-2" />
            上传并入库
          </>
        )}
      </Button>
    </div>
  );
}
