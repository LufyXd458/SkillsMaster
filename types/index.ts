// Agent SDK 相关类型
export interface Message {
  id: string;
  role: "user" | "assistant" | "tool";
  content: string;
  timestamp: number;
  toolUseId?: string;
  toolName?: string;
  toolInput?: Record<string, unknown>;
  toolResult?: string;
  toolStatus?: "pending" | "running" | "completed" | "failed";
}

export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
}

export interface Session {
  id: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
  isProcessing: boolean;
  enabledSkillSlugs: string[];
}

// Agent 事件类型
export type AgentEventType =
  | "text_delta"
  | "text_complete"
  | "tool_start"
  | "tool_result"
  | "complete"
  | "error"
  | "usage_update";

export interface BaseAgentEvent {
  type: AgentEventType;
  timestamp: number;
}

export interface TextDeltaEvent extends BaseAgentEvent {
  type: "text_delta";
  delta: string;
  turnId: string;
}

export interface TextCompleteEvent extends BaseAgentEvent {
  type: "text_complete";
  turnId: string;
}

export interface ToolStartEvent extends BaseAgentEvent {
  type: "tool_start";
  toolUseId: string;
  toolName: string;
  toolInput: Record<string, unknown>;
}

export interface ToolResultEvent extends BaseAgentEvent {
  type: "tool_result";
  toolUseId: string;
  result: string;
  isError: boolean;
}

export interface CompleteEvent extends BaseAgentEvent {
  type: "complete";
  usage?: TokenUsage;
}

export interface ErrorEvent extends BaseAgentEvent {
  type: "error";
  error: string;
  code?: string;
}

export interface UsageUpdateEvent extends BaseAgentEvent {
  type: "usage_update";
  usage: TokenUsage;
}

export type AgentEvent =
  | TextDeltaEvent
  | TextCompleteEvent
  | ToolStartEvent
  | ToolResultEvent
  | CompleteEvent
  | ErrorEvent
  | UsageUpdateEvent;
