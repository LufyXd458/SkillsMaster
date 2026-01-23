import fs from "fs";
import path from "path";
import os from "os";
import type { LoadedSkill, CreateSkillRequest, UpdateSkillRequest } from "./types";
import { parseSkillMd, serializeSkillMd } from "./parser";

// 存储路径: ~/.agents/skills/ (与 npx skills add 安装路径一致)
const SKILLS_BASE_DIR = path.join(os.homedir(), ".agents", "skills");

function ensureSkillsDir(): void {
  if (!fs.existsSync(SKILLS_BASE_DIR)) {
    fs.mkdirSync(SKILLS_BASE_DIR, { recursive: true });
  }
}

function getSkillDir(slug: string): string {
  return path.join(SKILLS_BASE_DIR, slug);
}

function getSkillMdPath(slug: string): string {
  return path.join(getSkillDir(slug), "SKILL.md");
}

export function skillExists(slug: string): boolean {
  return fs.existsSync(getSkillMdPath(slug));
}

export function listSkillSlugs(): string[] {
  ensureSkillsDir();
  try {
    const entries = fs.readdirSync(SKILLS_BASE_DIR, { withFileTypes: true });
    return entries
      .filter((entry) => entry.isDirectory())
      .filter((entry) => fs.existsSync(path.join(SKILLS_BASE_DIR, entry.name, "SKILL.md")))
      .map((entry) => entry.name);
  } catch {
    return [];
  }
}

export function loadSkill(slug: string): LoadedSkill | null {
  const skillMdPath = getSkillMdPath(slug);
  if (!fs.existsSync(skillMdPath)) {
    return null;
  }

  try {
    const content = fs.readFileSync(skillMdPath, "utf-8");
    const parsed = parseSkillMd(content);
    if (!parsed) {
      return null;
    }

    const skillDir = getSkillDir(slug);
    let iconPath: string | undefined;

    // 查找图标文件
    const iconExtensions = [".png", ".jpg", ".jpeg", ".svg", ".webp"];
    for (const ext of iconExtensions) {
      const iconFile = path.join(skillDir, `icon${ext}`);
      if (fs.existsSync(iconFile)) {
        iconPath = iconFile;
        break;
      }
    }

    return {
      slug,
      metadata: parsed.metadata,
      content: parsed.content,
      path: skillDir,
      iconPath,
      source: "local",
    };
  } catch (error) {
    console.error(`Failed to load skill ${slug}:`, error);
    return null;
  }
}

export function loadAllSkills(): LoadedSkill[] {
  const slugs = listSkillSlugs();
  const skills: LoadedSkill[] = [];

  for (const slug of slugs) {
    const skill = loadSkill(slug);
    if (skill) {
      skills.push(skill);
    }
  }

  return skills;
}

export function createSkill(request: CreateSkillRequest): LoadedSkill {
  ensureSkillsDir();

  const skillDir = getSkillDir(request.slug);
  if (fs.existsSync(skillDir)) {
    throw new Error(`Skill "${request.slug}" already exists`);
  }

  fs.mkdirSync(skillDir, { recursive: true });

  const metadata = {
    name: request.name,
    description: request.description,
    globs: request.globs,
    alwaysAllow: request.alwaysAllow,
    icon: request.icon,
  };

  const skillMdContent = serializeSkillMd(metadata, request.content);
  fs.writeFileSync(getSkillMdPath(request.slug), skillMdContent, "utf-8");

  return {
    slug: request.slug,
    metadata,
    content: request.content,
    path: skillDir,
    source: "local",
  };
}

export function updateSkill(slug: string, request: UpdateSkillRequest): LoadedSkill {
  const existing = loadSkill(slug);
  if (!existing) {
    throw new Error(`Skill "${slug}" not found`);
  }

  const metadata = {
    name: request.name ?? existing.metadata.name,
    description: request.description ?? existing.metadata.description,
    globs: request.globs ?? existing.metadata.globs,
    alwaysAllow: request.alwaysAllow ?? existing.metadata.alwaysAllow,
    icon: request.icon ?? existing.metadata.icon,
  };

  const content = request.content ?? existing.content;
  const skillMdContent = serializeSkillMd(metadata, content);
  fs.writeFileSync(getSkillMdPath(slug), skillMdContent, "utf-8");

  return {
    slug,
    metadata,
    content,
    path: existing.path,
    iconPath: existing.iconPath,
    source: "local",
  };
}

export function deleteSkill(slug: string): boolean {
  const skillDir = getSkillDir(slug);
  if (!fs.existsSync(skillDir)) {
    return false;
  }

  fs.rmSync(skillDir, { recursive: true, force: true });
  return true;
}
