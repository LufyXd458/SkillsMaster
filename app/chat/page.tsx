"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ChatContainer } from "@/components/chat/chat-container";
import { FileList, type UploadedFile } from "@/components/chat/file-list";
import { useAgentStream } from "@/hooks/use-agent-stream";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { DEFAULT_BASE_URL } from "@/lib/constants";
import type { LoadedSkill, SkillDisplayItem } from "@/lib/skills/types";

export default function ChatPage() {
  const router = useRouter();
  const [apiKey, setApiKey] = useState("");
  const [baseURL, setBaseURL] = useState(DEFAULT_BASE_URL);
  const [skills, setSkills] = useState<LoadedSkill[]>([]);
  const [selectedSlugs, setSelectedSlugs] = useState<string[]>([]);
  const [registryOpen, setRegistryOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SkillDisplayItem[]>([]);
  const [searching, setSearching] = useState(false);
  const [installCommand, setInstallCommand] = useState<string | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);

  // 从 localStorage 读取保存的配置
  useEffect(() => {
    const savedApiKey = localStorage.getItem("skills-master-api-key");
    const savedBaseURL = localStorage.getItem("skills-master-base-url");
    if (savedApiKey) setApiKey(savedApiKey);
    if (savedBaseURL) setBaseURL(savedBaseURL);
  }, []);

  const { messages, isStreaming, error, sendMessage, clearMessages } = useAgentStream({
    apiKey,
    baseURL,
    skillSlugs: selectedSlugs,
    files: uploadedFiles,
  });

  const fetchSkills = async () => {
    try {
      const res = await fetch("/api/skills");
      const data = await res.json();
      setSkills(data.skills || []);
    } catch (err) {
      console.error("Failed to fetch skills:", err);
    }
  };

  useEffect(() => {
    fetchSkills();
  }, []);

  // 当对话框打开时，自动加载默认列表
  useEffect(() => {
    if (registryOpen && searchResults.length === 0) {
      loadDefaultSkills();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [registryOpen]);

  const loadDefaultSkills = async () => {
    setSearching(true);
    try {
      const res = await fetch(`/api/registry`);
      const data = await res.json();
      // 转换默认列表数据格式为统一的显示格式
      const displayItems: SkillDisplayItem[] = (data.skills || []).map((skill: { id: string; name: string; installs: number; topSource: string }) => ({
        id: skill.id,
        name: skill.name,
        installs: skill.installs,
        source: skill.topSource,
      }));
      setSearchResults(displayItems);
    } catch (err) {
      console.error("Failed to load default skills:", err);
      toast.error("加载失败");
    } finally {
      setSearching(false);
    }
  };

  const searchRegistry = async (query: string) => {
    if (!query.trim()) {
      loadDefaultSkills();
      return;
    }
    setSearching(true);
    try {
      const res = await fetch(`/api/registry?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      // 转换搜索结果数据格式为统一的显示格式
      const displayItems: SkillDisplayItem[] = (data.results || []).map((skill: { source: string; skillId: string; name: string; installs: number; score: number }) => ({
        id: skill.skillId,
        name: skill.name,
        installs: skill.installs,
        source: skill.source,
      }));
      setSearchResults(displayItems);
    } catch (err) {
      console.error("Failed to search registry:", err);
      toast.error("搜索失败");
    } finally {
      setSearching(false);
    }
  };

  const installSkill = (skillId: string, source: string) => {
    // 生成安装命令
    const [owner, repo] = source.split('/');
    const githubUrl = `https://github.com/${owner}/${repo}`;
    const command = `npx skills add ${githubUrl} --skill ${skillId}`;

    setInstallCommand(command);
  };

  const toggleSkill = (slug: string) => {
    setSelectedSlugs((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
    );
  };

  const handleApiKeyChange = (value: string) => {
    setApiKey(value);
    localStorage.setItem("skills-master-api-key", value);
    toast.success("API Key 保存成功");
  };

  const handleBaseURLChange = (value: string) => {
    setBaseURL(value);
    localStorage.setItem("skills-master-base-url", value);
    toast.success("Base URL 保存成功");
  };

  return (
    <div className="flex h-screen flex-col">
      {/* Install Command Dialog */}
      <Dialog open={!!installCommand} onOpenChange={(open) => !open && setInstallCommand(null)}>
        <DialogContent className="max-w-lg w-[90vw]">
          <DialogHeader>
            <DialogTitle>安装 Skill</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 overflow-x-hidden">
            <p className="text-sm text-muted-foreground">
              请在终端中运行以下命令来安装此 Skill：
            </p>
            <div className="relative w-full min-w-0">
              <pre className="bg-muted p-4 pr-24 rounded-lg overflow-hidden">
                <code className="text-sm block truncate">{installCommand}</code>
              </pre>
              <Button
                size="sm"
                variant="outline"
                className="absolute top-2 right-2"
                onClick={() => {
                  if (installCommand) {
                    navigator.clipboard.writeText(installCommand);
                    toast.success("命令已复制到剪贴板");
                  }
                }}
              >
                复制
              </Button>
            </div>
            <div className="text-sm text-muted-foreground space-y-2">
              <p>安装完成后，刷新页面即可在左侧看到新安装的 Skill。</p>
            </div>
            <div className="flex justify-end">
              <Button onClick={() => setInstallCommand(null)}>
                关闭
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Top Promotion Banner */}
      <div className="bg-black px-4 py-2 text-white">
        <div className="flex items-center justify-between">
          <span className="text-sm">
            获取 MiniMax 编程包，低成本体验 Skills 以及通用 Agents 能力
          </span>
          <a
            href="https://platform.minimaxi.com/subscribe/coding-plan"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button size="sm" variant="secondary">
              去购买
            </Button>
          </a>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
      {/* Sidebar */}
      <div className="w-64 border-r p-4 flex flex-col gap-4">
        <div className="space-y-2">
          <Label htmlFor="apiKey">API Key</Label>
          <Input
            id="apiKey"
            type="password"
            value={apiKey}
            onChange={(e) => handleApiKeyChange(e.target.value)}
            placeholder="sk-ant-..."
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="baseURL">Base URL</Label>
          <Input
            id="baseURL"
            value={baseURL}
            onChange={(e) => handleBaseURLChange(e.target.value)}
            placeholder="https://api.minimaxi.com/anthropic"
          />
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={clearMessages}
          disabled={messages.length === 0 || isStreaming}
        >
          清空对话
        </Button>

        {/* File List */}
        <FileList files={uploadedFiles} onFilesChange={setUploadedFiles} />

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Skills</Label>
            <Dialog open={registryOpen} onOpenChange={setRegistryOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm">
                  + 添加
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>从 Registry 安装 Skill</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <Input
                    placeholder="搜索 Skill..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      searchRegistry(e.target.value);
                    }}
                  />
                  <div className="max-h-64 overflow-y-auto space-y-2">
                    {searching && <div className="text-sm text-muted-foreground">搜索中...</div>}
                    {!searching && searchResults.length === 0 && searchQuery && (
                      <div className="text-sm text-muted-foreground">未找到结果</div>
                    )}
                    {searchResults.map((skill) => {
                      const fullPath = `${skill.source}/${skill.id}`;
                      return (
                        <div
                          key={fullPath}
                          className="flex items-center justify-between p-2 border rounded"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm">
                              {skill.name}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              来源: {skill.source}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              安装次数: {skill.installs}
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => installSkill(skill.id, skill.source)}
                          >
                            安装
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <div className="space-y-1">
            {skills.map((skill) => (
              <Button
                key={skill.slug}
                variant={selectedSlugs.includes(skill.slug) ? "default" : "outline"}
                size="sm"
                className="w-full justify-start"
                onClick={() => toggleSkill(skill.slug)}
              >
                {skill.metadata.icon && <span className="mr-2">{skill.metadata.icon}</span>}
                {skill.metadata.name}
              </Button>
            ))}
          </div>
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => router.push('/skills')}
          >
            管理 Skills
          </Button>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {error && (
          <div className="bg-destructive/10 text-destructive p-2 text-sm">
            {error}
          </div>
        )}
        <ChatContainer
          messages={messages}
          isStreaming={isStreaming}
          onSend={sendMessage}
        />
      </div>
      </div>
    </div>
  );
}
