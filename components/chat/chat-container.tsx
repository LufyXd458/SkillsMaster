"use client";

import { useRef, useEffect } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChatMessage } from "./chat-message";
import { ChatInput } from "./chat-input";

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
  toolCalls?: ToolCall[];
}

interface ChatContainerProps {
  messages: Message[];
  isStreaming: boolean;
  onSend: (message: string) => void;
}

export function ChatContainer({
  messages,
  isStreaming,
  onSend,
}: ChatContainerProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex-1 min-h-0 overflow-hidden">
        <ScrollArea className="h-full p-4" viewportRef={scrollRef}>
          <div className="space-y-4">
            {messages.map((msg, index) => (
              <ChatMessage
                key={msg.id}
                role={msg.role}
                content={msg.content}
                toolCalls={msg.toolCalls}
                isStreaming={isStreaming && index === messages.length - 1 && msg.role === "assistant"}
              />
            ))}
          </div>
        </ScrollArea>
      </div>
      <div className="border-t p-4 shrink-0">
        <ChatInput onSend={onSend} disabled={isStreaming} />
      </div>
    </div>
  );
}
