"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface RegistrySkill {
  id: string;
  name: string;
  topSource: string; // Format: "owner/repo"
  installs: number;
  description?: string;
  icon?: string;
}

interface RegistryBrowserProps {
  onInstall?: (slug: string) => Promise<void>;
}

export function RegistryBrowser({ onInstall }: RegistryBrowserProps) {
  const [query, setQuery] = useState("");
  const [skills, setSkills] = useState<RegistrySkill[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedSkill, setSelectedSkill] = useState<RegistrySkill | null>(null);
  const [copied, setCopied] = useState(false);

  const fetchSkills = async (searchQuery = "") => {
    setLoading(true);
    try {
      const url = searchQuery
        ? `/api/registry?q=${encodeURIComponent(searchQuery)}`
        : `/api/registry`;
      const res = await fetch(url);
      const data = await res.json();
      setSkills(data.skills || []);
    } catch (err) {
      console.error("Failed to fetch skills:", err);
    } finally {
      setLoading(false);
    }
  };

  const search = () => {
    fetchSkills(query);
  };

  // Load all skills on mount
  useEffect(() => {
    fetchSkills();
  }, []);

  const handleShowInstallCommand = (skill: RegistrySkill) => {
    setSelectedSkill(skill);
    setDialogOpen(true);
    setCopied(false);
  };

  const getInstallCommand = () => {
    if (!selectedSkill) return "";
    const [owner, repo] = selectedSkill.topSource.split("/");
    return `npx skills add https://github.com/${owner}/${repo} --skill ${selectedSkill.id}`;
  };

  const handleCopyCommand = async () => {
    const command = getInstallCommand();
    try {
      await navigator.clipboard.writeText(command);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="搜索 skills.sh..."
          onKeyDown={(e) => e.key === "Enter" && search()}
        />
        <Button onClick={search} disabled={loading}>
          {loading ? "搜索中..." : "搜索"}
        </Button>
        {query && (
          <Button
            variant="outline"
            onClick={() => {
              setQuery("");
              fetchSkills();
            }}
          >
            清空
          </Button>
        )}
      </div>

      {loading && (
        <div className="text-center py-8 text-muted-foreground">
          加载中...
        </div>
      )}

      {!loading && skills.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          {query ? "未找到技能，请尝试其他搜索词" : "暂无可用技能"}
        </div>
      )}

      {!loading && skills.length > 0 && (
        <div className="space-y-2">
          {skills.map((skill) => (
            <Card key={skill.id}>
              <CardHeader className="py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {skill.icon && <span>{skill.icon}</span>}
                    <div>
                      <CardTitle className="text-base">{skill.name}</CardTitle>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {skill.topSource} · {skill.installs.toLocaleString()} 次安装
                      </div>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleShowInstallCommand(skill)}
                  >
                    安装
                  </Button>
                </div>
                {skill.description && (
                  <CardDescription>{skill.description}</CardDescription>
                )}
              </CardHeader>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>安装 {selectedSkill?.name}</DialogTitle>
            <DialogDescription>
              复制并在终端中运行此命令以安装技能
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="relative">
              <pre className="bg-muted p-4 rounded-md overflow-x-auto text-sm break-all whitespace-pre-wrap">
                <code>{getInstallCommand()}</code>
              </pre>
            </div>

            {selectedSkill && (
              <div className="text-sm text-muted-foreground space-y-1">
                <p>来源: {selectedSkill.topSource}</p>
                <p>安装次数: {selectedSkill.installs.toLocaleString()}</p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              关闭
            </Button>
            <Button onClick={handleCopyCommand}>
              {copied ? "已复制！" : "复制命令"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
