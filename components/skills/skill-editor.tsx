"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface SkillEditorProps {
  onSave: (skill: {
    slug: string;
    name: string;
    description: string;
    content: string;
    icon: string;
  }) => void;
  onCancel: () => void;
}

export function SkillEditor({ onSave, onCancel }: SkillEditorProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [content, setContent] = useState("");
  const [icon, setIcon] = useState("");

  const slug = name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !content.trim()) return;
    onSave({ slug, name, description, content, icon });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">名称</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="我的技能"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="icon">图标 (emoji)</Label>
          <Input
            id="icon"
            value={icon}
            onChange={(e) => setIcon(e.target.value)}
            placeholder="🔧"
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">描述</Label>
        <Input
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="这个技能是做什么的？"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="content">指令内容 (Markdown)</Label>
        <Textarea
          id="content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="给 AI 的指令..."
          className="min-h-[200px]"
          required
        />
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          取消
        </Button>
        <Button type="submit" disabled={!name.trim() || !content.trim()}>
          创建技能
        </Button>
      </div>
    </form>
  );
}
