import type { SourceChunk } from "./types";

/**
 * 构建 RAG System Prompt
 * 将检索到的文档片段拼接为上下文，注入到提示词中
 */
export function buildSystemPrompt(sources: SourceChunk[]): string {
  const contextText = sources
    .map(
      (s, i) =>
        `[文档片段 ${i + 1}] 来源: ${s.fileName}${s.page ? ` (第${s.page}页)` : ""}\n${s.content}`
    )
    .join("\n\n---\n\n");

  return `你是一个企业内部知识库助手，专门帮助用户解答基于企业文档的问题。

## 工作规则
1. 仅根据下方「参考文档」中的内容回答问题。
2. 如果参考文档中找不到相关信息，请明确告知用户「当前知识库中没有相关信息」，不要编造答案。
3. 回答时请引用具体的文档来源（文件名、页码等）。
4. 保持回答简洁、专业、结构清晰。
5. 使用中文回答。

## 参考文档
${contextText}

请根据以上参考文档回答用户的问题。`;
}

/**
 * 构建简洁的引用来源文本（用于前端展示）
 */
export function formatSources(sources: SourceChunk[]): string {
  if (sources.length === 0) return "";
  const uniqueFiles = [...new Set(sources.map((s) => s.fileName))];
  return `\n\n---\n📚 **参考来源**: ${uniqueFiles.join("、")}`;
}
