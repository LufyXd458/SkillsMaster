import { exec } from "child_process";
import { promisify } from "util";
import path from "path";
import os from "os";
import fs from "fs";

const execAsync = promisify(exec);

export const runtime = "nodejs";

const SKILLS_BASE_DIR = path.join(os.homedir(), ".agents", "skills");

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const skillDir = path.join(SKILLS_BASE_DIR, slug);

  if (!fs.existsSync(skillDir)) {
    return new Response(JSON.stringify({ error: "Skill not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    // 根据操作系统选择打开命令
    const platform = process.platform;
    let command: string;

    if (platform === "darwin") {
      command = `open "${skillDir}"`;
    } else if (platform === "win32") {
      command = `explorer "${skillDir}"`;
    } else {
      command = `xdg-open "${skillDir}"`;
    }

    await execAsync(command);

    return new Response(JSON.stringify({ success: true, path: skillDir }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: "Failed to open folder",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
