import matter from "gray-matter";
import { SkillMetadataSchema, type SkillMetadata } from "./types";

export function parseSkillMd(content: string): {
  metadata: SkillMetadata;
  content: string;
} | null {
  try {
    const { data, content: body } = matter(content);
    const parsed = SkillMetadataSchema.safeParse(data);

    if (!parsed.success) {
      console.error("Invalid skill metadata:", parsed.error);
      return null;
    }

    return {
      metadata: parsed.data,
      content: body.trim(),
    };
  } catch (error) {
    console.error("Failed to parse SKILL.md:", error);
    return null;
  }
}

export function serializeSkillMd(
  metadata: SkillMetadata,
  content: string
): string {
  const frontmatter: Record<string, unknown> = {
    name: metadata.name,
  };

  if (metadata.description) {
    frontmatter.description = metadata.description;
  }
  if (metadata.globs?.length) {
    frontmatter.globs = metadata.globs;
  }
  if (metadata.alwaysAllow?.length) {
    frontmatter.alwaysAllow = metadata.alwaysAllow;
  }
  if (metadata.icon) {
    frontmatter.icon = metadata.icon;
  }

  return matter.stringify(content, frontmatter);
}
