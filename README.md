# 企业知识库 - 本地 RAG 智能问答系统

基于 **Next.js + Ollama + Chroma + LangChain.js** 搭建的本地轻量化 RAG 企业内部知识库系统。

## 技术栈

| 层级 | 技术 |
| --- | --- |
| 前端框架 | Next.js 16 (App Router) + TypeScript |
| UI 组件 | shadcn/ui + Tailwind CSS v4 |
| HTTP 客户端 | axios（统一封装，替代 fetch） |
| AI 编排 | LangChain.js |
| 向量数据库 | Chroma (Docker) |
| LLM | Ollama + qwen3.5:0.8b |
| Embedding | Ollama + bge-m3 |

## 功能特性

- 📄 **文档上传**: 支持 PDF、Markdown、TXT、Word (.docx) 拖拽上传
- 🧠 **智能分块**: RecursiveCharacterTextSplitter 智能分割文档
- 🔍 **语义检索**: bge-m3 向量化 + Chroma 相似度检索
- 💬 **流式问答**: SSE 流式输出，首 Token 延迟低
- 📚 **引用溯源**: 答案附带文档来源和相关性评分
- 🎨 **现代 UI**: 深蓝企业级设计，左右双栏布局

## 环境要求

- **Node.js** >= 18
- **Docker** (运行 Chroma)
- **Ollama** (运行本地模型)

已安装的模型：

- `qwen3.5:0.8b` — 对话生成
- `bge-m3` — 文本向量化

## 快速启动

### 1. 启动 Chroma (Docker)

```bash
docker run -d --name chroma -p 8000:8000 chromadb/chroma
```

### 2. 启动 Ollama

```bash
ollama serve
```

### 3. 安装依赖

```bash
npm install
```

### 4. 配置环境变量

```bash
cp .env.example .env.local
# 根据实际情况修改 .env.local 中的配置
```

### 5. 启动开发服务器

```bash
npm run dev
```

访问 <http://localhost:3000>

## 项目结构

```text
src/
├── app/
│   ├── api/
│   │   ├── documents/          # 文档管理 API
│   │   │   ├── upload/route.ts  # POST 上传文档
│   │   │   └── route.ts         # GET 列表 / DELETE 删除
│   │   ├── query/route.ts      # POST RAG 问答 (SSE)
│   │   └── health/route.ts     # GET 健康检查
│   ├── layout.tsx
│   ├── page.tsx                 # 主页面
│   └── globals.css
├── components/
│   ├── chat-panel.tsx           # 对话面板
│   ├── chat-message.tsx         # 消息气泡
│   ├── upload-panel.tsx         # 上传面板
│   ├── doc-list.tsx             # 文档列表
│   ├── source-card.tsx          # 引用来源卡片
│   └── ui/                      # shadcn/ui 组件
└── lib/
    ├── config.ts                # 配置
    ├── types.ts                 # 类型定义
    ├── utils.ts                 # 工具函数
    ├── api-client.ts            # 客户端 axios 实例（fetch adapter）
    ├── server-api.ts            # 服务端 axios 实例（Ollama 调用）
    ├── rag-service.ts           # 统一 API 封装层
    ├── chroma-client.ts         # Chroma 客户端
    ├── ollama-client.ts         # Ollama 客户端
    ├── ingestion.ts             # 文档摄入管道
    ├── rag-chain.ts             # RAG 问答管道
    └── prompt.ts                # 提示词模板
```

## 系统架构

```text
┌─────────────────────────────────────────────────────────────────┐
│                         浏览器 (Client)                          │
│  page.tsx  ──→  rag-service.ts  ──→  api-client.ts (axios)      │
│                    统一 API 封装           fetch adapter         │
│                    支持 SSE 流式                                 │
└───────────────────────────────────────────────────────────────────┘
                                │
                    HTTP (SSE / JSON)
                                │
┌───────────────────────────────────────────────────────────────────┐
│                    Next.js 16 App Router (Server)                 │
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ /api/health  │  │/api/documents│  │ /api/query   │          │
│  │   健康检查    │  │  文档 CRUD   │  │  RAG 问答    │          │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          │
│         │                 │                  │                    │
│         ▼                 ▼                  ▼                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ollama-client │  │ ingestion.ts │  │ rag-chain.ts │          │
│  │chroma-client │  │  文档摄入管道 │  │  RAG 管道    │          │
│  │  健康探测    │  │  Loader →    │  │  Embedding → │          │
│  │              │  │  Splitter →  │  │  检索 → LLM  │          │
│  │              │  │  Embedding → │  │              │          │
│  │              │  │  Chroma 写入 │  │              │          │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          │
│         │                 │                  │                    │
│  server-api.ts (axios)    │                  │                    │
│         │                 │                  │                    │
└─────────┼─────────────────┼──────────────────┼────────────────────┘
          │                 │                  │
          ▼                 ▼                  ▼
┌───────────────────────────────────────────────────────────────────┐
│                       外部服务层 (External)                        │
│                                                                   │
│  ┌─────────────────┐    ┌──────────────────────────┐            │
│  │     Ollama       │    │    Chroma (Docker)        │            │
│  │  :11434          │    │    :8000                  │            │
│  │  ┌─────────────┐ │    │  ┌────────────────────┐  │            │
│  │  │ qwen3.5:0.8b│ │    │  │ enterprise_knowledge│  │            │
│  │  │  LLM 对话    │ │    │  │ 向量存储 + 相似检索  │  │            │
│  │  └─────────────┘ │    │  └────────────────────┘  │            │
│  │  ┌─────────────┐ │    └──────────────────────────┘            │
│  │  │   bge-m3     │ │                                           │
│  │  │  Embedding   │ │                                           │
│  │  └─────────────┘ │                                           │
│  └─────────────────┘                                            │
└───────────────────────────────────────────────────────────────────┘
```

### 架构分层

| 层级 | 目录/文件 | 职责 |
| --- | --- | --- |
| **表示层** | `src/app/page.tsx` `src/components/` | 用户界面，左右双栏布局：对话区 + 文档管理区 |
| **服务层** | `src/lib/rag-service.ts` | 统一封装 5 个 API 端点，类型安全的请求方法 |
| **传输层** | `src/lib/api-client.ts` `src/lib/server-api.ts` | axios 实例：客户端 fetch adapter（支持 SSE 流）+ 服务端直接调用 |
| **路由层** | `src/app/api/` | 4 个 API Route：health / documents / upload / query |
| **业务层** | `src/lib/rag-chain.ts` `src/lib/ingestion.ts` | RAG 问答管道 + 文档摄入管道 |
| **数据层** | `src/lib/chroma-client.ts` `src/lib/ollama-client.ts` | Chroma 向量库客户端 + Ollama 模型客户端 |
| **外部服务** | Docker / Ollama | Chroma :8000 + Ollama :11434 |

### 关键数据流

**文档摄入**: `文件上传 → Loader 解析 → TextSplitter 分块 → bge-m3 向量化 → Chroma 写入`

**智能问答**: `用户提问 → bge-m3 向量化 → Chroma 语义检索 (Top-K) → 构建 System Prompt → qwen3.5 流式生成 → SSE 返回`

## 配置说明

| 环境变量 | 默认值 | 说明 |
| --- | --- | --- |
| `OLLAMA_BASE_URL` | `http://localhost:11434` | Ollama 服务地址 |
| `CHROMA_URL` | `http://localhost:8000` | Chroma 服务地址 |
| `LLM_MODEL` | `qwen3.5:0.8b` | 对话模型 |
| `EMBEDDING_MODEL` | `bge-m3` | 嵌入模型 |
| `CHUNK_SIZE` | `1000` | 分块大小 |
| `CHUNK_OVERLAP` | `200` | 分块重叠 |
| `TOP_K` | `4` | 检索数量 |
