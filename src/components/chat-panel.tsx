"use client";

import { ChatMessage } from "./chat-message";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Trash2, Loader2 } from "lucide-react";
import { useRef, useEffect, KeyboardEvent } from "react";
import type { ChatMessage as ChatMessageType, SourceChunk } from "@/lib/types";

interface ChatPanelProps {
  messages: ChatMessageType[];
  isLoading: boolean;
  sources: SourceChunk[];
  onSend: (question: string) => void;
  onClear: () => void;
}

export function ChatPanel({ messages, isLoading, sources, onSend, onClear }: ChatPanelProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    const text = textareaRef.current?.value.trim();
    if (!text || isLoading) return;
    onSend(text);
    if (textareaRef.current) {
      textareaRef.current.value = "";
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = () => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-xl shadow-sm border border-slate-200/60 overflow-hidden">
      {/* 标题栏 */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 bg-gradient-to-r from-blue-50 to-white">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-800">智能问答</h2>
            <p className="text-xs text-slate-400">基于知识库文档回答</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClear}
          className="text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
        >
          <Trash2 className="w-4 h-4 mr-1" />
          清空
        </Button>
      </div>

      {/* 消息列表 */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center mb-4">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="1.5">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <p className="text-sm font-medium">开始提问吧</p>
            <p className="text-xs mt-1">上传文档后，即可基于知识库内容进行问答</p>
          </div>
        ) : (
          messages.map((msg) => (
            <ChatMessage key={msg.id} message={msg} />
          ))
        )}

        {isLoading && (
          <div className="flex items-center gap-2 text-blue-500 animate-pulse px-1">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">思考中...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 检索来源提示 */}
      {sources.length > 0 && (
        <div className="px-4 py-2 border-t border-slate-100 bg-slate-50/50">
          <p className="text-xs text-slate-500">
            📚 参考来源: {sources.map((s) => s.fileName).filter((v, i, a) => a.indexOf(v) === i).join("、")}
          </p>
        </div>
      )}

      {/* 输入区 */}
      <div className="px-4 py-3 border-t border-slate-100 bg-white">
        <div className="flex gap-2 items-end">
          <Textarea
            ref={textareaRef}
            placeholder="输入问题，按 Enter 发送..."
            className="min-h-[44px] max-h-[120px] resize-none bg-slate-50 border-slate-200 focus:border-blue-400 focus:ring-blue-400/20 rounded-xl text-sm"
            rows={1}
            onKeyDown={handleKeyDown}
            onInput={handleInput}
            disabled={isLoading}
          />
          <Button
            onClick={handleSend}
            disabled={isLoading}
            size="icon"
            className="h-[44px] w-[44px] rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-sm hover:shadow-md transition-all shrink-0"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
