import type { Folder } from "./types";

export const initialFolders: Folder[] = [
  {
    id: "f1",
    name: "社区助手",
    prompts: [
      { id: "p1", name: "点点3.0-主对话", updatedAt: "2026-05-11 14:56", owner: "yz" },
      { id: "p2", name: "点点3.0-意图识别", updatedAt: "2026-05-10 09:12", owner: "yz" },
      { id: "p3", name: "点点3.0-改写润色", updatedAt: "2026-05-08 18:30", owner: "lina" },
    ],
  },
  {
    id: "f2",
    name: "客服机器人",
    prompts: [
      { id: "p4", name: "客服-FAQ召回", updatedAt: "2026-05-09 11:20", owner: "wang" },
      { id: "p5", name: "客服-情绪安抚", updatedAt: "2026-05-07 16:48", owner: "wang" },
    ],
  },
  {
    id: "f3",
    name: "通用",
    prompts: [
      { id: "p6", name: "通用-翻译", updatedAt: "2026-05-06 10:00", owner: "yz" },
    ],
  },
];

export const versionHistory = [
  { version: "v8", name: "点点3.0-主对话", time: "2026-05-11 14:56", operator: "yz" },
  { version: "v7", name: "点点3.0-主对话", time: "2026-05-10 17:22", operator: "yz" },
  { version: "v6", name: "点点3.0-主对话", time: "2026-05-09 11:08", operator: "lina" },
  { version: "v5", name: "点点3.0-主对话", time: "2026-05-08 09:30", operator: "yz" },
];

export const testSets = [
  { id: "ts1", name: "社区助手-基础测试集（30 条）" },
  { id: "ts2", name: "客服机器人-情绪测试集（50 条）" },
  { id: "ts3", name: "通用-翻译评测集（100 条）" },
];

export type EvalRow = {
  id: number;
  input: string;
  extras: Record<string, string>;
  versions: {
    promptId: string;
    output: string;
    score: number | null;
    issueType: string;
    note: string;
  }[];
};

const sharedExtras = (i: number) => ({
  输入图片: i % 2 === 0 ? "img_2026051" + i + ".jpg" : "-",
  输入笔记: i === 1 ? "邻居家漏水，墙面发霉" : "-",
  输入时间: `2026-05-1${i} 1${i}:2${i}`,
  地理位置: ["上海·徐汇·田林街道", "北京·朝阳·望京", "杭州·西湖·文三路", "深圳·南山·科技园"][i - 1] ?? "-",
  用户UID: `U10086${1000 + i}`,
  设备平台信息: i % 2 === 0 ? "iOS 18.2 · iPhone 15 Pro" : "HarmonyOS 5.0 · Mate 70",
  短期记忆: i === 2 ? "上一轮：用户询问垃圾分类时间" : "-",
  长期记忆: ["独居老人，关注社区活动", "宝妈，关注亲子和教育", "新搬入住户，常问周边设施", "上班族，关注通勤与外卖"][i - 1] ?? "-",
});

export const initialEvalRows: EvalRow[] = [
  {
    id: 1,
    input: "你是谁",
    extras: sharedExtras(1),
    versions: [
      { promptId: "p1", output: "我是点点，社区助手。", score: 4, issueType: "无", note: "回答准确" },
    ],
  },
  {
    id: 2,
    input: "你擅长什么",
    extras: sharedExtras(2),
    versions: [
      { promptId: "p1", output: "我擅长回答社区问题、提供生活建议和解决邻里事务。", score: 3, issueType: "略冗长", note: "可更精炼" },
    ],
  },
  {
    id: 3,
    input: "怎么使用你",
    extras: sharedExtras(3),
    versions: [
      { promptId: "p1", output: "直接对我说出你的问题即可。", score: 5, issueType: "无", note: "" },
    ],
  },
  {
    id: 4,
    input: "你能帮我什么",
    extras: sharedExtras(4),
    versions: [
      { promptId: "p1", output: "我能帮你解答问题、提供建议、聊天陪伴。", score: 4, issueType: "无", note: "" },
    ],
  },
];
