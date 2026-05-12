export type PromptItem = {
  id: string;
  name: string;
  updatedAt: string;
  owner: string;
};

export type Folder = {
  id: string;
  name: string;
  prompts: PromptItem[];
};

export type EditorBlock = {
  id: string;
  title: string;
  linkedPromptId: string | null; // null = 不关联
  model: string;
  maxTurns: number;
  tools: string[];
  memories: string[];
  systemPrompt: string;
  userPrompt: string;
};

export const ALL_MODELS = [
  "claude-opus-4-7",
  "claude-sonnet-4-5",
  "claude-haiku-4-2",
  "gpt-4o",
  "gpt-4o-mini",
  "deepseek-v3",
  "qwen-max",
];

export const ALL_TOOLS = [
  "网页搜索",
  "代码解释器",
  "知识库检索",
  "天气查询",
  "地图定位",
  "图片生成",
];

export const ALL_MEMORIES = [
  "时间",
  "地理位置",
  "用户UID",
  "设备平台信息",
  "短期记忆",
  "长期记忆",
];
