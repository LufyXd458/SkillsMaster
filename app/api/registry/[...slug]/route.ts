import { NextResponse } from "next/server";
import { createSkill, skillExists } from "@/lib/skills/storage";
import { exec } from "child_process";
import { promisify } from "util";
import { readFile } from "fs/promises";
import { join } from "path";
import { homedir } from "os";

const execAsync = promisify(exec);

interface RouteParams {
  params: Promise<{ slug: string[] }>;
}

export async function POST(_request: Request, { params }: RouteParams) {
  const { slug } = await params;

  // slug 是数组，例如 ["obra", "superpowers", "using-superpowers"]
  // 提取最后一部分作为 skill 的本地 slug
  const skillSlug = slug[slug.length - 1];
  const fullPath = slug.join('/');

  if (skillExists(skillSlug)) {
    return NextResponse.json(
      { error: `Skill "${skillSlug}" already exists` },
      { status: 409 }
    );
  }

  try {
    // 正确的 CLI 格式：npx skills add <github-url> --skill <skill-name>
    // 例如：npx skills add https://github.com/obra/superpowers --skill brainstorming
    const parts = slug;

    if (parts.length !== 3) {
      throw new Error("Invalid skill path format. Expected: owner/repo/skill-name");
    }

    const [owner, repo, skillName] = parts;
    const githubUrl = `https://github.com/${owner}/${repo}`;
    const command = `npx skills add ${githubUrl} --skill ${skillName}`;

    console.log(`Installing skill with command: ${command}`);

    const { stdout, stderr } = await execAsync(command, {
      cwd: process.cwd(),
    });

    console.log(`Install output: ${stdout}`);
    if (stderr) {
      console.error(`Install stderr: ${stderr}`);
    }

    // 尝试从 ~/.skills 目录读取安装的 skill
    const skillsDir = join(homedir(), '.skills', owner, repo, skillName);
    const skillFile = join(skillsDir, 'SKILL.md');

    console.log(`Reading skill from: ${skillFile}`);
    const content = await readFile(skillFile, 'utf-8');

    // 创建 skill
    const skill = createSkill({
      slug: skillSlug,
      name: skillName,
      description: `Installed from ${owner}/${repo}`,
      content,
      icon: undefined,
    });

    return NextResponse.json({ skill, source: "registry" }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`Installation error:`, error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
