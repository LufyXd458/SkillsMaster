import { AgentWrapper } from "@/lib/agent/agent-wrapper";
import { createSSEStream } from "@/lib/agent/stream-encoder";
import { loadSkill } from "@/lib/skills/storage";
import type { LoadedSkill } from "@/lib/skills/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface HistoryMessage {
  role: "user" | "assistant";
  content: string;
}

interface FileContent {
  name: string;
  content: string;
}

interface ChatRequest {
  message: string;
  history?: HistoryMessage[];
  files?: FileContent[];
  apiKey: string;
  baseURL?: string;
  model?: string;
  skillSlugs?: string[];
}

export async function POST(request: Request) {
  const body = (await request.json()) as ChatRequest;

  if (!body.message || !body.apiKey) {
    return new Response(
      JSON.stringify({ error: "Missing message or apiKey" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const skills: LoadedSkill[] = [];
  if (body.skillSlugs?.length) {
    for (const slug of body.skillSlugs) {
      const skill = loadSkill(slug);
      if (skill) skills.push(skill);
    }
  }

  const { stream, writer } = createSSEStream();

  const agent = new AgentWrapper({
    apiKey: body.apiKey,
    baseURL: body.baseURL,
    model: body.model,
    skills,
    history: body.history,
    files: body.files,
  });

  agent.sendMessage(body.message, {
    onEvent: (event) => writer.write(event),
  }).then(() => {
    writer.close();
  }).catch((err) => {
    writer.error(err);
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
