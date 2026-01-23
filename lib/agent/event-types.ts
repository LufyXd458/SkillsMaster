// Agent SDK 事件类型定义
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

export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
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
