"use client";

import type { ChatMessage as ChatMessageType } from "@/lib/types";
import { User, Bot } from "lucide-react";

interface ChatMessageProps {
  message: ChatMessageType;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user";

  return (
    <div className={`flex gap-3 message-enter ${isUser ? "flex-row-reverse" : ""}`}>
      {/* 头像 */}
      <div
        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
          isUser
            ? "bg-gradient-to-br from-blue-500 to-blue-600"
            : "bg-gradient-to-br from-emerald-400 to-emerald-500"
        }`}
      >
        {isUser ? (
          <User className="w-4 h-4 text-white" />
        ) : (
          <Bot className="w-4 h-4 text-white" />
        )}
      </div>

      {/* 消息气泡 */}
      <div className={`max-w-[80%] ${isUser ? "items-end" : "items-start"}`}>
        <div
          className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
            isUser
              ? "bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-tr-md"
              : "bg-slate-100 text-slate-800 rounded-tl-md"
          }`}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap">{message.content}</p>
          ) : (
            <div
              className="markdown-body text-sm"
              dangerouslySetInnerHTML={{ __html: simpleMarkdown(message.content) }}
            />
          )}
        </div>

        {/* 引用来源标签 */}
        {message.sources && message.sources.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {message.sources.map((src, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 border border-blue-100 text-xs text-blue-600"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                </svg>
                {src.fileName}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/** 简易 Markdown 转 HTML（处理加粗、列表、代码等基础格式） */
function simpleMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/```(\w*)\n([\s\S]*?)```/g, "<pre><code>$2</code></pre>")
    .replace(/`(.+?)`/g, "<code>$1</code>")
    .replace(/^### (.+)$/gm, "<h3>$1</h3>")
    .replace(/^## (.+)$/gm, "<h2>$1</h2>")
    .replace(/^# (.+)$/gm, "<h1>$1</h1>")
    .replace(/^- (.+)$/gm, "<li>$1</li>")
    .replace(/^(\d+)\. (.+)$/gm, "<li>$2</li>")
    .replace(/\n\n/g, "<br/><br/>")
    .replace(/\n/g, "<br/>");
}
