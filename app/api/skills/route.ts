import { NextResponse } from "next/server";
import { loadAllSkills, createSkill } from "@/lib/skills/storage";
import type { CreateSkillRequest } from "@/lib/skills/types";

export async function GET() {
  try {
    const skills = loadAllSkills();
    return NextResponse.json({ skills });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CreateSkillRequest;

    if (!body.slug || !body.name || !body.content) {
      return NextResponse.json(
        { error: "Missing required fields: slug, name, content" },
        { status: 400 }
      );
    }

    const skill = createSkill(body);
    return NextResponse.json({ skill }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
