"use client";

import { useState, useCallback, useRef } from "react";
import type { AgentEvent } from "@/lib/agent/event-types";

interface ToolCall {
  id: string;
  name: string;
  input: Record<string, unknown>;
  status: "running" | "completed" | "error";
  result?: string;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  toolCalls?: ToolCall[];
}

interface UseAgentStreamReturn {
  messages: Message[];
  isStreaming: boolean;
  error: string | null;
  sendMessage: (message: string) => Promise<void>;
  clearMessages: () => void;
}

interface FileInfo {
  id: string;
  name: string;
  size: number;
  type: string;
  content: string;
}

interface UseAgentStreamOptions {
  apiKey: string;
  baseURL?: string;
  model?: string;
  skillSlugs?: string[];
  files?: FileInfo[];
}

export function useAgentStream(
  options: UseAgentStreamOptions
): UseAgentStreamReturn {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const streamingContentRef = useRef("");
  const toolCallsRef = useRef<Map<string, ToolCall>>(new Map());

  const processStream = useCallback(
    async (
      reader: ReadableStreamDefaultReader<Uint8Array>,
      decoder: TextDecoder,
      assistantId: string
    ) => {
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6);
          try {
            const event = JSON.parse(jsonStr) as AgentEvent;

            if (event.type === "text_delta") {
              streamingContentRef.current += event.delta;
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId
                    ? { ...m, content: streamingContentRef.current }
                    : m
                )
              );
            } else if (event.type === "tool_start") {
              const toolCall: ToolCall = {
                id: event.toolUseId,
                name: event.toolName,
                input: event.toolInput,
                status: "running",
              };
              toolCallsRef.current.set(event.toolUseId, toolCall);
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId
                    ? { ...m, toolCalls: Array.from(toolCallsRef.current.values()) }
                    : m
                )
              );
            } else if (event.type === "tool_result") {
              const toolCall = toolCallsRef.current.get(event.toolUseId);
              if (toolCall) {
                toolCall.status = event.isError ? "error" : "completed";
                toolCall.result = event.result;
                toolCallsRef.current.set(event.toolUseId, toolCall);
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantId
                      ? { ...m, toolCalls: Array.from(toolCallsRef.current.values()) }
                      : m
                  )
                );
              }
            } else if (event.type === "error") {
              setError(event.error);
            }
          } catch {
            // ignore parse errors
          }
        }
      }
    },
    []
  );

  const sendMessage = useCallback(
    async (message: string) => {
      if (!options.apiKey) {
        setError("API Key is required");
        return;
      }

      setError(null);
      setIsStreaming(true);
      streamingContentRef.current = "";
      toolCallsRef.current = new Map();

      const userMessage: Message = {
        id: crypto.randomUUID(),
        role: "user",
        content: message,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, userMessage]);

      const assistantId = crypto.randomUUID();
      setMessages((prev) => [
        ...prev,
        { id: assistantId, role: "assistant", content: "", timestamp: Date.now() },
      ]);

      try {
        // 构建对话历史（只包含 user 和 assistant 的消息内容）
        const history = messages
          .filter((m) => m.role === "user" || m.role === "assistant")
          .map((m) => ({
            role: m.role as "user" | "assistant",
            content: m.content,
          }));

        // 构建文件信息（只发送名称和内容）
        const files = options.files?.map((f) => ({
          name: f.name,
          content: f.content,
        }));

        const response = await fetch("/api/agent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message,
            history,
            files,
            apiKey: options.apiKey,
            baseURL: options.baseURL,
            model: options.model,
            skillSlugs: options.skillSlugs,
          }),
        });

        if (!response.ok || !response.body) {
          throw new Error("Failed to connect to agent");
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        await processStream(reader, decoder, assistantId);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setIsStreaming(false);
      }
    },
    [options.apiKey, options.baseURL, options.model, options.skillSlugs, options.files, messages]
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return { messages, isStreaming, error, sendMessage, clearMessages };
}
