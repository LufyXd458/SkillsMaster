"use client";

import { useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";

interface ToolCall {
  id: string;
  name: string;
  input: Record<string, unknown>;
  status: "running" | "completed" | "error";
  result?: string;
}

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  toolCalls?: ToolCall[];
  isStreaming?: boolean;
}

interface ToolCallBlock {
  type: "tool_call";
  tool: string;
  args: Record<string, string>;
  raw: string;
}

interface TextBlock {
  type: "text";
  content: string;
}

type ContentBlock = ToolCallBlock | TextBlock;

function parseToolCallArgs(argsStr: string): Record<string, string> {
  const args: Record<string, string> = {};
  const lines = argsStr.trim().split("\n");
  for (const line of lines) {
    const match = line.match(/^\s*--(\w+)\s+"?([^"]*)"?\s*$/);
    if (match) {
      args[match[1]] = match[2];
    } else {
      const simpleMatch = line.match(/^\s*--(\w+)\s+(.+)$/);
      if (simpleMatch) {
        args[simpleMatch[1]] = simpleMatch[2].trim();
      }
    }
  }
  return args;
}

function parseContent(content: string): ContentBlock[] {
  const blocks: ContentBlock[] = [];
  const toolCallRegex = /\[TOOL_CALL\]\s*\{tool\s*=>\s*"([^"]+)",\s*args\s*=>\s*\{([^}]*)\}\s*\}\s*\[\/TOOL_CALL\]/g;

  let lastIndex = 0;
  let match;

  while ((match = toolCallRegex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      const textBefore = content.slice(lastIndex, match.index).trim();
      if (textBefore) {
        blocks.push({ type: "text", content: textBefore });
      }
    }

    blocks.push({
      type: "tool_call",
      tool: match[1],
      args: parseToolCallArgs(match[2]),
      raw: match[0],
    });

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < content.length) {
    const remaining = content.slice(lastIndex).trim();
    if (remaining) {
      blocks.push({ type: "text", content: remaining });
    }
  }

  if (blocks.length === 0 && content.trim()) {
    blocks.push({ type: "text", content: content.trim() });
  }

  return blocks;
}

function ToolCallCard({ block }: { block: ToolCallBlock }) {
  return (
    <div className="my-2 rounded-lg border bg-muted/50 overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2 bg-muted/80 border-b">
        <Loader2 className="h-4 w-4 animate-spin text-primary" />
        <span className="text-sm font-medium">调用工具: {block.tool}</span>
      </div>
      <div className="p-3">
        <pre className="text-xs text-muted-foreground overflow-x-auto">
          {Object.entries(block.args).map(([key, value]) => (
            <div key={key}>
              <span className="text-primary">--{key}</span> {value}
            </div>
          ))}
        </pre>
      </div>
    </div>
  );
}

function RealToolCallCard({ toolCall }: { toolCall: ToolCall }) {
  const statusIcon = {
    running: <Loader2 className="h-4 w-4 animate-spin text-primary" />,
    completed: <CheckCircle2 className="h-4 w-4 text-green-500" />,
    error: <XCircle className="h-4 w-4 text-destructive" />,
  };

  const statusText = {
    running: "执行中",
    completed: "已完成",
    error: "失败",
  };

  return (
    <div className="my-2 rounded-lg border bg-muted/50 overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2 bg-muted/80 border-b">
        {statusIcon[toolCall.status]}
        <span className="text-sm font-medium">{toolCall.name}</span>
        <span className="text-xs text-muted-foreground ml-auto">
          {statusText[toolCall.status]}
        </span>
      </div>
      <div className="p-3 space-y-2">
        <div>
          <div className="text-xs text-muted-foreground mb-1">参数:</div>
          <pre className="text-xs bg-background/50 p-2 rounded overflow-x-auto">
            {JSON.stringify(toolCall.input, null, 2)}
          </pre>
        </div>
        {toolCall.result && (
          <div>
            <div className="text-xs text-muted-foreground mb-1">结果:</div>
            <pre className="text-xs bg-background/50 p-2 rounded overflow-x-auto max-h-32">
              {toolCall.result.slice(0, 500)}
              {toolCall.result.length > 500 && "..."}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}

function MarkdownContent({ content }: { content: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        code({ className, children, ...props }) {
          const match = /language-(\w+)/.exec(className || "");
          const isInline = !match && !className;

          if (isInline) {
            return (
              <code className="px-1.5 py-0.5 rounded bg-muted text-sm" {...props}>
                {children}
              </code>
            );
          }

          return (
            <pre className="my-2 p-3 rounded-lg bg-muted overflow-x-auto">
              <code className={cn("text-sm", className)} {...props}>
                {children}
              </code>
            </pre>
          );
        },
        p({ children }) {
          return <p className="mb-2 last:mb-0">{children}</p>;
        },
        ul({ children }) {
          return <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>;
        },
        ol({ children }) {
          return <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>;
        },
        a({ href, children }) {
          return (
            <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary underline">
              {children}
            </a>
          );
        },
        blockquote({ children }) {
          return (
            <blockquote className="border-l-4 border-primary/30 pl-4 my-2 text-muted-foreground">
              {children}
            </blockquote>
          );
        },
        h1({ children }) {
          return <h1 className="text-xl font-bold mb-2">{children}</h1>;
        },
        h2({ children }) {
          return <h2 className="text-lg font-bold mb-2">{children}</h2>;
        },
        h3({ children }) {
          return <h3 className="text-base font-bold mb-2">{children}</h3>;
        },
      }}
    >
      {content}
    </ReactMarkdown>
  );
}

export function ChatMessage({ role, content, toolCalls, isStreaming }: ChatMessageProps) {
  const blocks = useMemo(() => parseContent(content), [content]);

  return (
    <div
      className={cn(
        "flex w-full",
        role === "user" ? "justify-end" : "justify-start"
      )}
    >
      <div
        className={cn(
          "max-w-[80%] rounded-lg px-4 py-2",
          role === "user"
            ? "bg-primary text-primary-foreground"
            : "bg-muted"
        )}
      >
        {/* 显示来自 hook 的真实工具调用 */}
        {toolCalls && toolCalls.length > 0 && (
          <div className="space-y-2 mb-2">
            {toolCalls.map((tc) => (
              <RealToolCallCard key={tc.id} toolCall={tc} />
            ))}
          </div>
        )}
        {/* 显示文本内容和解析的工具调用 */}
        {blocks.map((block, index) => (
          <div key={index}>
            {block.type === "tool_call" ? (
              <ToolCallCard block={block} />
            ) : (
              <MarkdownContent content={block.content} />
            )}
          </div>
        ))}
        {isStreaming && (
          <span className="inline-block w-2 h-4 bg-primary/50 animate-pulse ml-1" />
        )}
      </div>
    </div>
  );
}
