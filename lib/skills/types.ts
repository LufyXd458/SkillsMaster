import { z } from "zod";

// Skill 元数据 Schema
export const SkillMetadataSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  globs: z.array(z.string()).optional(),
  alwaysAllow: z.array(z.string()).optional(),
  icon: z.string().optional(),
});

export type SkillMetadata = z.infer<typeof SkillMetadataSchema>;

// 本地加载的 Skill
export interface LoadedSkill {
  slug: string;
  metadata: SkillMetadata;
  content: string;
  path: string;
  iconPath?: string;
  source: "local" | "registry";
}

// Skills.sh Registry 相关类型
export interface RegistrySkill {
  name: string;
  slug: string;
  description: string;
  author: string;
  version: string;
  downloads: number;
  icon?: string;
  tags?: string[];
}

export interface RegistrySearchResult {
  skills: RegistrySkill[];
  total: number;
  page: number;
  pageSize: number;
}

// Skills.sh API 实际返回的搜索结果类型
export interface SkillsShSearchResultItem {
  source: string;
  skillId: string;
  name: string;
  installs: number;
  score: number;
}

export interface SkillsShSearchResponse {
  results: SkillsShSearchResultItem[];
  total: number;
}

// Skills.sh API 默认列表返回的数据类型
export interface SkillsShListItem {
  id: string;
  name: string;
  installs: number;
  topSource: string;
}

export interface SkillsShListResponse {
  skills: SkillsShListItem[];
}

// 统一的显示用接口
export interface SkillDisplayItem {
  id: string;
  name: string;
  installs: number;
  source: string;
}

// Skill 创建/更新请求
export interface CreateSkillRequest {
  slug: string;
  name: string;
  description?: string;
  content: string;
  globs?: string[];
  alwaysAllow?: string[];
  icon?: string;
}

export interface UpdateSkillRequest {
  name?: string;
  description?: string;
  content?: string;
  globs?: string[];
  alwaysAllow?: string[];
  icon?: string;
}

// API 响应类型
export interface SkillsListResponse {
  skills: LoadedSkill[];
}

export interface SkillResponse {
  skill: LoadedSkill;
}

export interface SkillDeleteResponse {
  success: boolean;
  slug: string;
}
