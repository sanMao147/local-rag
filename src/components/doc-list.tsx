"use client";

import { FileText, File, FileCode, Trash2, Loader2, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { DocumentRecord } from "@/lib/types";
import { formatFileSize } from "@/lib/utils";

interface DocListProps {
  documents: DocumentRecord[];
  isLoading: boolean;
  onDelete: (filename: string) => Promise<void>;
}

const fileTypeIcons: Record<string, React.ReactNode> = {
  pdf: <FileText className="w-5 h-5 text-red-500" />,
  markdown: <FileCode className="w-5 h-5 text-purple-500" />,
  txt: <File className="w-5 h-5 text-slate-500" />,
  docx: <FileText className="w-5 h-5 text-blue-500" />,
};

const fileTypeColors: Record<string, string> = {
  pdf: "bg-red-50 border-red-100",
  markdown: "bg-purple-50 border-purple-100",
  txt: "bg-slate-50 border-slate-100",
  docx: "bg-blue-50 border-blue-100",
};

export function DocList({ documents, isLoading, onDelete }: DocListProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200/60 p-5">
      <h3 className="text-sm font-semibold text-slate-800 mb-4 flex items-center gap-2">
        <BookOpen className="w-4 h-4 text-blue-500" />
        已入库文档
        {documents.length > 0 && (
          <span className="ml-auto text-xs font-normal text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
            {documents.length}
          </span>
        )}
      </h3>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
        </div>
      ) : documents.length === 0 ? (
        <div className="text-center py-8">
          <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-slate-100 flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-slate-300" />
          </div>
          <p className="text-xs text-slate-400">暂无文档</p>
          <p className="text-xs text-slate-300 mt-1">上传文档后在此查看</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-[300px] overflow-y-auto">
          {documents.map((doc) => (
            <div
              key={doc.filename}
              className={`flex items-center gap-3 p-3 rounded-lg border transition-all hover:shadow-sm group ${
                fileTypeColors[doc.fileType] || "bg-slate-50 border-slate-100"
              }`}
            >
              <div className="w-10 h-10 rounded-lg bg-white shadow-sm flex items-center justify-center">
                {fileTypeIcons[doc.fileType] || <File className="w-5 h-5 text-slate-400" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-700 truncate">
                  {doc.filename}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {formatFileSize(doc.fileSize)} · {doc.chunkCount} 块
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
                onClick={() => onDelete(doc.filename)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
