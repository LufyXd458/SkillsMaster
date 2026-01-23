"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { SkillList } from "@/components/skills/skill-list";
import { SkillEditor } from "@/components/skills/skill-editor";
import { RegistryBrowser } from "@/components/skills/registry-browser";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { LoadedSkill } from "@/lib/skills/types";

export default function SkillsPage() {
  const router = useRouter();
  const [skills, setSkills] = useState<LoadedSkill[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchSkills = async () => {
    try {
      const res = await fetch("/api/skills");
      const data = await res.json();
      setSkills(data.skills || []);
    } catch (err) {
      console.error("Failed to fetch skills:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSkills();
  }, []);

  const handleCreate = async (skill: {
    slug: string;
    name: string;
    description: string;
    content: string;
    icon: string;
  }) => {
    try {
      await fetch("/api/skills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(skill),
      });
      setIsCreating(false);
      fetchSkills();
    } catch (err) {
      console.error("Failed to create skill:", err);
    }
  };

  const handleDelete = async (slug: string) => {
    try {
      await fetch(`/api/skills/${slug}`, { method: "DELETE" });
      fetchSkills();
    } catch (err) {
      console.error("Failed to delete skill:", err);
    }
  };

  if (loading) {
    return <div className="p-8">加载中...</div>;
  }

  return (
    <div className="container mx-auto p-8 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">技能管理</h1>
        <Button variant="outline" onClick={() => router.push('/chat')}>
          返回 Chat
        </Button>
      </div>

      <Tabs defaultValue="local" className="space-y-4">
        <TabsList>
          <TabsTrigger value="local">我的技能</TabsTrigger>
          <TabsTrigger value="registry">浏览注册表</TabsTrigger>
        </TabsList>

        <TabsContent value="local" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setIsCreating(true)} disabled={isCreating}>
              创建技能
            </Button>
          </div>

          {isCreating && (
            <SkillEditor
              onSave={handleCreate}
              onCancel={() => setIsCreating(false)}
            />
          )}

          <SkillList skills={skills} onDelete={handleDelete} />
        </TabsContent>

        <TabsContent value="registry">
          <RegistryBrowser />
        </TabsContent>
      </Tabs>
    </div>
  );
}