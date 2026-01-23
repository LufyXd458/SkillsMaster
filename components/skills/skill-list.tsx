"use client";

import { SkillCard } from "./skill-card";
import type { LoadedSkill } from "@/lib/skills/types";

interface SkillListProps {
  skills: LoadedSkill[];
  onDelete?: (slug: string) => void;
  onSelect?: (slug: string) => void;
  selectedSlugs?: string[];
}

export function SkillList({
  skills,
  onDelete,
  onSelect,
  selectedSlugs = [],
}: SkillListProps) {
  if (skills.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        暂无技能。创建一个技能开始使用吧。
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {skills.map((skill) => (
        <SkillCard
          key={skill.slug}
          skill={skill}
          onDelete={onDelete}
          onSelect={onSelect}
          selected={selectedSlugs.includes(skill.slug)}
        />
      ))}
    </div>
  );
}
