import { NextResponse } from "next/server";
import { loadSkill, updateSkill, deleteSkill } from "@/lib/skills/storage";

interface RouteParams {
  params: Promise<{ slug: string }>;
}

export async function GET(_request: Request, { params }: RouteParams) {
  const { slug } = await params;
  const skill = loadSkill(slug);

  if (!skill) {
    return NextResponse.json({ error: "Skill not found" }, { status: 404 });
  }

  return NextResponse.json({ skill });
}

export async function PUT(request: Request, { params }: RouteParams) {
  const { slug } = await params;
  try {
    const body = await request.json();
    const skill = updateSkill(slug, body);
    return NextResponse.json({ skill });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 404 });
  }
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  const { slug } = await params;
  const success = deleteSkill(slug);

  if (!success) {
    return NextResponse.json({ error: "Skill not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true, slug });
}
