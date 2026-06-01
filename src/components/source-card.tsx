"use client";

import type { SourceChunk } from "@/lib/types";

interface SourceCardProps {
  source: SourceChunk;
  index: number;
}

export function SourceCard({ source, index }: SourceCardProps) {
  return (
    <div className="p-3 rounded-lg border border-blue-100 bg-blue-50/50 hover:bg-blue-50 transition-colors">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs font-medium text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">
          来源 {index + 1}
        </span>
        <span className="text-xs text-slate-500 truncate">{source.fileName}</span>
        {source.page && (
          <span className="text-xs text-slate-400">第 {source.page} 页</span>
        )}
        <span className="ml-auto text-xs text-slate-400">
          {Math.round(source.score * 100)}%
        </span>
      </div>
      <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
        {source.content}
      </p>
    </div>
  );
}
