"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { ChatPanel } from "@/components/chat-panel";
import { UploadPanel } from "@/components/upload-panel";
import { DocList } from "@/components/doc-list";
import { SourceCard } from "@/components/source-card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { generateMessageId } from "@/lib/utils";
import { checkHealth, getDocuments, queryStream, uploadDocument, deleteDocument, scanKnowledgeBase, getKnowledgeBasePath } from "@/lib/rag-service";
import type { ChatMessage, DocumentRecord, SourceChunk } from "@/lib/types";
import { Brain, FileText, Activity } from "lucide-react";

export default function Home() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sources, setSources] = useState<SourceChunk[]>([]);
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [docsLoading, setDocsLoading] = useState(true);
  const [chromaStatus, setChromaStatus] = useState<boolean | null>(null);
  const [ollamaStatus, setOllamaStatus] = useState<boolean | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [knowledgeBasePath, setKnowledgeBasePath] = useState<string>("");
  const assistantMessageRef = useRef<string>("");
  const currentSourcesRef = useRef<SourceChunk[]>([]);
  const autoScanDoneRef = useRef(false);

  // 健康检查 + 获取知识库路径
  useEffect(() => {
    checkHealth()
      .then((data) => {
        if (data?.data) {
          setChromaStatus(data.data.chroma === "connected");
          setOllamaStatus(data.data.ollama === "connected");
        }
      })
      .catch(() => {
        setChromaStatus(false);
        setOllamaStatus(false);
      });

    getKnowledgeBasePath()
      .then((data) => {
        if (data?.data?.path) {
          setKnowledgeBasePath(data.data.path);
        }
      })
      .catch(() => {});
  }, []);

  // 加载文档列表
  const loadDocuments = useCallback(async () => {
    setDocsLoading(true);
    try {
      const data = await getDocuments();
      if (data?.success && data?.data) {
        setDocuments(data.data);
      }
    } catch (error) {
      console.error("加载文档列表失败:", error);
    } finally {
      setDocsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  // 首次启动自动扫描知识库
  useEffect(() => {
    if (
      chromaStatus === true &&
      ollamaStatus === true &&
      !autoScanDoneRef.current
    ) {
      autoScanDoneRef.current = true;
      setIsScanning(true);
      scanKnowledgeBase()
        .then((data) => {
          if (data?.data) {
            console.log(
              `[AutoScan] 完成: 扫描 ${data.data.scanned}, 新增 ${data.data.ingested}, 跳过 ${data.data.skipped}`
            );
          }
          loadDocuments();
        })
        .catch((err) => {
          console.error("[AutoScan] 扫描失败:", err);
        })
        .finally(() => {
          setIsScanning(false);
        });
    }
  }, [chromaStatus, ollamaStatus, loadDocuments]);

  // 发送消息
  const handleSend = useCallback(
    async (question: string) => {
      if (!question.trim() || isLoading) return;

      // 添加用户消息
      const userMessage: ChatMessage = {
        id: generateMessageId(),
        role: "user",
        content: question,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);

      // 收集对话历史
      const history = messages
        .filter((m) => m.role === "user")
        .map((m) => m.content);

      try {
        const stream = await queryStream(question, history);
        const reader = stream.getReader();
        if (!reader) throw new Error("无法读取响应流");

        const decoder = new TextDecoder();
        assistantMessageRef.current = "";

        // 创建助手消息占位
        const assistantMsg: ChatMessage = {
          id: generateMessageId(),
          role: "assistant",
          content: "",
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, assistantMsg]);

        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            const eventMatch = line.match(/^event: (\w+)/);
            const dataMatch = line.match(/^data: (.+)/);

            if (eventMatch && dataMatch) {
              const event = eventMatch[1];
              try {
                const data = JSON.parse(dataMatch[1]);

                if (event === "sources" && data.sources) {
                  currentSourcesRef.current = data.sources;
                  setSources(data.sources);
                } else if (event === "token") {
                  assistantMessageRef.current += data.content || "";
                  // 更新助手消息
                  setMessages((prev) => {
                    const updated = [...prev];
                    const last = updated[updated.length - 1];
                    if (last.role === "assistant") {
                      last.content = assistantMessageRef.current;
                    }
                    return [...updated];
                  });
                } else if (event === "done") {
                  // 最终更新消息（附加来源信息）
                  setMessages((prev) => {
                    const updated = [...prev];
                    const last = updated[updated.length - 1];
                    if (last.role === "assistant") {
                      last.sources = currentSourcesRef.current;
                    }
                    return [...updated];
                  });
                }
              } catch {
                // 跳过解析失败的数据
              }
            }
          }
        }
      } catch (error) {
        console.error("查询失败:", error);
        // 更新错误信息
        setMessages((prev) => {
          const updated = [...prev];
          const last = updated[updated.length - 1];
          if (last.role === "assistant") {
            last.content = "抱歉，查询过程中出现了错误。请确认 Ollama 和 Chroma 服务是否正常运行。";
          }
          return [...updated];
        });
      } finally {
        setIsLoading(false);
      }
    },
    [messages, isLoading]
  );

  // 清空对话
  const handleClear = useCallback(() => {
    setMessages([]);
    setSources([]);
    currentSourcesRef.current = [];
  }, []);

  // 上传文档
  const handleUpload = useCallback(
    async (file: File) => {
      const data = await uploadDocument(file);

      if (!data?.success) {
        throw new Error(data?.error || "上传失败");
      }

      // 重新加载文档列表
      await loadDocuments();
    },
    [loadDocuments]
  );

  // 删除文档
  const handleDelete = useCallback(
    async (filename: string) => {
      try {
        const data = await deleteDocument(filename);

        if (data?.success) {
          await loadDocuments();
        }
      } catch (error) {
        console.error("删除文档失败:", error);
      }
    },
    [loadDocuments]
  );

  // 手动扫描知识库
  const handleScan = useCallback(async () => {
    setIsScanning(true);
    try {
      const data = await scanKnowledgeBase();
      if (data?.data) {
        console.log(
          `[Scan] 完成: 扫描 ${data.data.scanned}, 新增 ${data.data.ingested}, 跳过 ${data.data.skipped}`
        );
      }
      await loadDocuments();
    } catch (err) {
      console.error("[Scan] 扫描失败:", err);
    } finally {
      setIsScanning(false);
    }
  }, [loadDocuments]);

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* 顶部导航栏 */}
      <header className="shrink-0 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-b border-slate-700/50 px-6 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/25">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white tracking-tight">
              企业知识库
            </h1>
            <p className="text-[11px] text-slate-400 -mt-0.5">
              RAG 智能问答系统
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* 服务状态指示器 */}
          <div className="flex items-center gap-2">
            <StatusBadge
              label="Ollama"
              status={ollamaStatus}
            />
            <StatusBadge
              label="Chroma"
              status={chromaStatus}
            />
          </div>

          <Separator orientation="vertical" className="h-5 bg-slate-700" />

          {/* 文档统计 */}
          <div className="flex items-center gap-2 text-slate-400 text-xs">
            <FileText className="w-3.5 h-3.5" />
            <span>{documents.length} 篇文档</span>
          </div>
        </div>
      </header>

      {/* 主内容区 */}
      <main className="flex-1 flex overflow-hidden p-4 gap-4">
        {/* 左侧：对话面板 (60%) */}
        <div className="flex-[3] min-w-0">
          <ChatPanel
            messages={messages}
            isLoading={isLoading}
            sources={sources}
            onSend={handleSend}
            onClear={handleClear}
          />
        </div>

        {/* 右侧：文档管理区 (40%) */}
        <div className="flex-[2] min-w-0 flex flex-col gap-4 overflow-y-auto">
          <UploadPanel
            onUpload={handleUpload}
            onScan={handleScan}
            isScanning={isScanning}
            knowledgeBasePath={knowledgeBasePath}
          />
          <DocList
            documents={documents}
            isLoading={docsLoading}
            onDelete={handleDelete}
          />

          {/* 检索来源展示 */}
          {sources.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200/60 p-5">
              <h3 className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2">
                <Activity className="w-4 h-4 text-blue-500" />
                检索来源
              </h3>
              <div className="space-y-2">
                {sources.map((source, i) => (
                  <SourceCard key={i} source={source} index={i} />
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

/** 服务状态指示器 */
function StatusBadge({
  label,
  status,
}: {
  label: string;
  status: boolean | null;
}) {
  const color =
    status === true
      ? "bg-green-500"
      : status === false
        ? "bg-red-500"
        : "bg-yellow-500";

  const textColor =
    status === true
      ? "text-green-400"
      : status === false
        ? "text-red-400"
        : "text-yellow-400";

  return (
    <div className="flex items-center gap-1.5">
      <span className={`w-2 h-2 rounded-full ${color} shadow-sm ${color}`} />
      <span className={`text-xs ${textColor} font-medium`}>
        {label}
      </span>
    </div>
  );
}
