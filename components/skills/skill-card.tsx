"use client";

import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FolderOpen } from "lucide-react";
import { toast } from "sonner";
import type { LoadedSkill } from "@/lib/skills/types";

interface SkillCardProps {
  skill: LoadedSkill;
  onDelete?: (slug: string) => void;
  onSelect?: (slug: string) => void;
  selected?: boolean;
}

export function SkillCard({ skill, onDelete, onSelect, selected }: SkillCardProps) {
  const handleOpenFolder = async () => {
    try {
      const res = await fetch(`/api/skills/${skill.slug}/open`, { method: "POST" });
      if (!res.ok) {
        throw new Error("Failed to open folder");
      }
      toast.success("已打开文件夹");
    } catch (err) {
      console.error("Failed to open folder:", err);
      toast.error("打开文件夹失败");
    }
  };

  return (
    <Card className={selected ? "border-primary" : ""}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {skill.metadata.icon && (
              <span className="text-xl">{skill.metadata.icon}</span>
            )}
            <CardTitle className="text-base">{skill.metadata.name}</CardTitle>
          </div>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={handleOpenFolder}
              title="打开文件夹"
            >
              <FolderOpen className="h-4 w-4" />
            </Button>
            {onSelect && (
              <Button
                variant={selected ? "default" : "outline"}
                size="sm"
                onClick={() => onSelect(skill.slug)}
              >
                {selected ? "已选择" : "选择"}
              </Button>
            )}
            {onDelete && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => onDelete(skill.slug)}
              >
                删除
              </Button>
            )}
          </div>
        </div>
        {skill.metadata.description && (
          <CardDescription>{skill.metadata.description}</CardDescription>
        )}
      </CardHeader>
    </Card>
  );
}
