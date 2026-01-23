import { NextResponse } from "next/server";

const SKILLS_SH_API = "https://skills.sh/api";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") || "";
  const page = searchParams.get("page") || "1";

  try {
    const url = query
      ? `${SKILLS_SH_API}/skills/search?q=${encodeURIComponent(query)}&page=${page}`
      : `${SKILLS_SH_API}/skills?page=${page}`;

    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      next: { revalidate: 60 },
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch from skills.sh: ${res.status}`);
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
