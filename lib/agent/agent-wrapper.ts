import Anthropic from "@anthropic-ai/sdk";
import type { Tool, MessageParam, ToolResultBlockParam } from "@anthropic-ai/sdk/resources/messages";
import type { AgentEvent, TokenUsage } from "./event-types";
import type { LoadedSkill } from "../skills/types";
import { DEFAULT_BASE_URL } from "../constants";

export { DEFAULT_BASE_URL };

export interface HistoryMessage {
  role: "user" | "assistant";
  content: string;
}

export interface FileContent {
  name: string;
  content: string;
}

export interface AgentConfig {
  apiKey: string;
  baseURL?: string;
  model?: string;
  systemPrompt?: string;
  skills?: LoadedSkill[];
  history?: HistoryMessage[];
  files?: FileContent[];
}

export interface SendMessageOptions {
  onEvent: (event: AgentEvent) => void;
  signal?: AbortSignal;
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

// 定义可用的工具
const AVAILABLE_TOOLS: Tool[] = [
  {
    name: "search",
    description: "Search for information on a topic. Use this when you need to find information about something.",
    input_schema: {
      type: "object" as const,
      properties: {
        query: {
          type: "string",
          description: "The search query",
        },
      },
      required: ["query"],
    },
  },
  {
    name: "calculator",
    description: "Perform mathematical calculations. Use this for any math operations.",
    input_schema: {
      type: "object" as const,
      properties: {
        expression: {
          type: "string",
          description: "The mathematical expression to evaluate",
        },
      },
      required: ["expression"],
    },
  },
  {
    name: "get_current_time",
    description: "Get the current date and time.",
    input_schema: {
      type: "object" as const,
      properties: {},
      required: [],
    },
  },
];

// 工具执行函数
async function executeTool(
  toolName: string,
  toolInput: Record<string, unknown>
): Promise<{ result: string; isError: boolean }> {
  try {
    switch (toolName) {
      case "search": {
        const query = toolInput.query as string;
        return {
          result: `Search results for "${query}":\n\n1. Result 1: Information about ${query}\n2. Result 2: More details about ${query}\n3. Result 3: Related topics for ${query}`,
          isError: false,
        };
      }
      case "calculator": {
        const expression = toolInput.expression as string;
        try {
          const result = Function(`"use strict"; return (${expression})`)();
          return { result: `Result: ${result}`, isError: false };
        } catch {
          return { result: "Error: Invalid expression", isError: true };
        }
      }
      case "get_current_time": {
        const now = new Date();
        return {
          result: `Current time: ${now.toISOString()}\nLocal: ${now.toLocaleString()}`,
          isError: false,
        };
      }
      default:
        return { result: `Unknown tool: ${toolName}`, isError: true };
    }
  } catch (error) {
    return {
      result: `Tool execution error: ${error instanceof Error ? error.message : "Unknown error"}`,
      isError: true,
    };
  }
}

export class AgentWrapper {
  private client: Anthropic;
  private model: string;
  private systemPrompt: string;
  private skills: LoadedSkill[];
  private files: FileContent[];
  private conversationHistory: MessageParam[] = [];

  constructor(config: AgentConfig) {
    this.client = new Anthropic({
      apiKey: config.apiKey,
      baseURL: config.baseURL || DEFAULT_BASE_URL,
    });
    this.model = config.model ?? "claude-sonnet-4-20250514";
    this.skills = config.skills ?? [];
    this.files = config.files ?? [];
    this.systemPrompt = this.buildSystemPrompt(config.systemPrompt);

    // 初始化对话历史
    if (config.history?.length) {
      this.conversationHistory = config.history.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));
    }
  }

  private buildSystemPrompt(basePrompt?: string): string {
    let prompt = basePrompt ?? "You are a helpful AI assistant. You can use tools to assist the user.";

    if (this.skills.length > 0) {
      prompt += "\n\n# Active Skills\n";
      for (const skill of this.skills) {
        prompt += `\n## ${skill.metadata.name}\n`;
        if (skill.metadata.description) {
          prompt += `${skill.metadata.description}\n`;
        }
        prompt += `\n${skill.content}\n`;
      }
    }

    // 添加文件内容到 system prompt
    if (this.files.length > 0) {
      prompt += "\n\n# User Files\n";
      prompt += "The user has provided the following files for you to work with:\n";
      for (const file of this.files) {
        prompt += `\n## File: ${file.name}\n`;
        prompt += "```\n";
        prompt += file.content;
        prompt += "\n```\n";
      }
    }

    return prompt;
  }

  // 动态更新 Skills
  updateSkills(skills: LoadedSkill[]): void {
    this.skills = skills;
    this.systemPrompt = this.buildSystemPrompt();
  }

  async sendMessage(
    message: string,
    options: SendMessageOptions
  ): Promise<void> {
    const turnId = generateId();
    const { onEvent, signal } = options;

    this.conversationHistory.push({
      role: "user",
      content: message,
    });

    try {
      let continueLoop = true;

      while (continueLoop) {
        if (signal?.aborted) break;

        const stream = this.client.messages.stream({
          model: this.model,
          max_tokens: 4096,
          system: this.systemPrompt,
          messages: this.conversationHistory,
          tools: AVAILABLE_TOOLS,
        });

        let fullResponse = "";
        const toolUses: Array<{ id: string; name: string; input: Record<string, unknown> }> = [];

        stream.on("text", (text) => {
          if (signal?.aborted) return;
          fullResponse += text;
          onEvent({
            type: "text_delta",
            delta: text,
            turnId,
            timestamp: Date.now(),
          });
        });

        const finalMessage = await stream.finalMessage();

        // 收集工具调用
        for (const block of finalMessage.content) {
          if (block.type === "tool_use") {
            toolUses.push({
              id: block.id,
              name: block.name,
              input: block.input as Record<string, unknown>,
            });
          }
        }

        // 如果有工具调用，执行它们
        if (toolUses.length > 0) {
          // 添加助手消息到历史
          this.conversationHistory.push({
            role: "assistant",
            content: finalMessage.content,
          });

          // 执行每个工具并收集结果
          const toolResults: ToolResultBlockParam[] = [];
          for (const toolUse of toolUses) {
            onEvent({
              type: "tool_start",
              toolUseId: toolUse.id,
              toolName: toolUse.name,
              toolInput: toolUse.input,
              timestamp: Date.now(),
            });

            const { result, isError } = await executeTool(toolUse.name, toolUse.input);

            onEvent({
              type: "tool_result",
              toolUseId: toolUse.id,
              result,
              isError,
              timestamp: Date.now(),
            });

            toolResults.push({
              type: "tool_result",
              tool_use_id: toolUse.id,
              content: result,
              is_error: isError,
            });
          }

          // 添加工具结果到历史
          this.conversationHistory.push({
            role: "user",
            content: toolResults,
          });

          // 继续循环以获取模型对工具结果的响应
          continueLoop = true;
        } else {
          // 没有工具调用，结束循环
          this.conversationHistory.push({
            role: "assistant",
            content: fullResponse,
          });
          continueLoop = false;
        }

        // 更新 token 使用量
        if (!continueLoop) {
          const usage: TokenUsage = {
            inputTokens: finalMessage.usage.input_tokens,
            outputTokens: finalMessage.usage.output_tokens,
            totalTokens: finalMessage.usage.input_tokens + finalMessage.usage.output_tokens,
          };

          onEvent({
            type: "text_complete",
            turnId,
            timestamp: Date.now(),
          });

          onEvent({
            type: "complete",
            usage,
            timestamp: Date.now(),
          });
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      onEvent({
        type: "error",
        error: errorMessage,
        timestamp: Date.now(),
      });
    }
  }
}
