import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ConsoleShell } from "@/components/console/ConsoleShell";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Plus,
  Play,
  Shuffle,
  Layers,
  Target,
  Filter,
  Sparkles,
  Ruler,
  Users,
  GitCompare,
  TrendingUp,
  TrendingDown,
  ChevronRight,
  Eye,
} from "lucide-react";

export const Route = createFileRoute("/evaluation")({
  head: () => ({ meta: [{ title: "效果评估 · Claude Console" }] }),
  component: EvaluationPage,
});

// ---------- mock data ----------
type SampleTask = {
  id: string;
  name: string;
  createdAt: string;
  strategies: string[];
  count: number;
  status: "已完成" | "运行中" | "已调度";
};

const initialTasks: SampleTask[] = [
  { id: "T20260514-01", name: "5月第二周·随机抽样", createdAt: "2026-05-14 10:22", strategies: ["随机抽样"], count: 200, status: "已完成" },
  { id: "T20260513-02", name: "未命中工具定向抽样", createdAt: "2026-05-13 18:05", strategies: ["问题定向", "关键词过滤"], count: 80, status: "已完成" },
  { id: "T20260512-03", name: "周一定时分层抽样", createdAt: "2026-05-12 09:00", strategies: ["分层抽样"], count: 500, status: "已调度" },
];

type Skill = {
  id: string;
  name: string;
  type: "大模型自动评估" | "规则评估" | "人工评估" | "对比评估";
  desc: string;
  model?: string;
  updatedAt: string;
};

const initialSkills: Skill[] = [
  { id: "sk1", name: "满意度评分", type: "大模型自动评估", desc: "0-3 分打分 + 问题类型分类", model: "claude-sonnet-4-5", updatedAt: "2026-05-12 14:20" },
  { id: "sk2", name: "敏感词检测", type: "规则评估", desc: "正则匹配回答中的敏感词", updatedAt: "2026-05-10 11:30" },
  { id: "sk3", name: "人工复核", type: "人工评估", desc: "低分 case 分配给标注同学复核", updatedAt: "2026-05-09 16:00" },
  { id: "sk4", name: "Prompt AB 对比", type: "对比评估", desc: "新旧 Prompt 同 query 的回答两两对比", model: "claude-opus-4-7", updatedAt: "2026-05-08 09:45" },
];

const issueTypes = [
  { name: "回答不准确", v: 32 },
  { name: "工具未命中", v: 21 },
  { name: "对话断链", v: 14 },
  { name: "回答冗长", v: 12 },
  { name: "格式问题", v: 8 },
  { name: "其他", v: 13 },
];

const trend = [3.1, 3.0, 3.2, 3.3, 3.2, 3.4, 3.5, 3.4, 3.6, 3.5, 3.7, 3.6, 3.8, 3.7];

// ---------- main ----------
function EvaluationPage() {
  return (
    <ConsoleShell>
      <div className="flex flex-col h-screen">
        <header className="border-b border-border px-6 py-4">
          <h1 className="text-[17px] font-semibold">效果评估</h1>
          <p className="text-xs text-muted-foreground mt-1">
            从 Agent 日志自动抽样，配置评估 Skill，跟踪整体质量水位与问题分布
          </p>
        </header>

        <Tabs defaultValue="sample" className="flex-1 flex flex-col min-h-0">
          <div className="px-6 pt-3 border-b border-border">
            <TabsList className="bg-transparent p-0 h-auto gap-1">
              <TabPill value="sample">自动抽样</TabPill>
              <TabPill value="skill">评估 Skill</TabPill>
              <TabPill value="dashboard">结果看板</TabPill>
            </TabsList>
          </div>

          <div className="flex-1 overflow-auto">
            <TabsContent value="sample" className="m-0 p-6">
              <SamplePanel />
            </TabsContent>
            <TabsContent value="skill" className="m-0 p-6">
              <SkillPanel />
            </TabsContent>
            <TabsContent value="dashboard" className="m-0 p-6">
              <DashboardPanel />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </ConsoleShell>
  );
}

function TabPill({ value, children }: { value: string; children: React.ReactNode }) {
  return (
    <TabsTrigger
      value={value}
      className="text-[13px] px-3 py-2 rounded-none border-b-2 border-transparent data-[state=active]:border-[var(--console-orange)] data-[state=active]:text-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none text-muted-foreground"
    >
      {children}
    </TabsTrigger>
  );
}

// ---------- 1. 自动抽样 ----------
function SamplePanel() {
  const [tasks, setTasks] = useState<SampleTask[]>(initialTasks);
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-4 max-w-[1200px]">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold">抽样任务</h2>
          <p className="text-xs text-muted-foreground mt-0.5">从点点 Agent 日志按策略抽取语料，生成评估任务</p>
        </div>
        <Button size="sm" className="gap-1.5 bg-[var(--console-cta)] text-[var(--console-cta-foreground)] hover:bg-[var(--console-cta)]/90" onClick={() => setOpen(true)}>
          <Plus className="h-3.5 w-3.5" /> 新建抽样任务
        </Button>
      </div>

      <div className="grid grid-cols-4 gap-3">
        <StrategyCard icon={<Shuffle className="h-4 w-4" />} title="随机抽样" desc="按比例/数量随机采集" />
        <StrategyCard icon={<Layers className="h-4 w-4" />} title="分层抽样" desc="按 query 类型/用户/时段分层" />
        <StrategyCard icon={<Target className="h-4 w-4" />} title="问题定向" desc="未命中工具、对话断链等" />
        <StrategyCard icon={<Filter className="h-4 w-4" />} title="关键词过滤" desc="按 query/answer 关键词" />
      </div>

      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="grid grid-cols-[1.6fr_1fr_1.4fr_0.8fr_0.8fr_80px] text-[12px] font-medium text-muted-foreground bg-muted/40 px-4 py-2.5 border-b border-border">
          <div>任务名称</div>
          <div>任务 ID</div>
          <div>策略</div>
          <div className="text-right">语料数</div>
          <div>状态</div>
          <div></div>
        </div>
        {tasks.map((t) => (
          <div key={t.id} className="grid grid-cols-[1.6fr_1fr_1.4fr_0.8fr_0.8fr_80px] items-center text-[13px] px-4 py-3 border-b border-border last:border-b-0 hover:bg-accent/30">
            <div>
              <div className="font-medium">{t.name}</div>
              <div className="text-[11px] text-muted-foreground">{t.createdAt}</div>
            </div>
            <div className="font-mono text-[11px] text-muted-foreground">{t.id}</div>
            <div className="flex flex-wrap gap-1">
              {t.strategies.map((s) => (
                <Badge key={s} variant="secondary" className="text-[10px] font-normal">{s}</Badge>
              ))}
            </div>
            <div className="text-right tabular-nums">{t.count}</div>
            <div>
              <span className={`text-[11px] px-2 py-0.5 rounded-full ${
                t.status === "已完成" ? "bg-emerald-100 text-emerald-700" :
                t.status === "运行中" ? "bg-amber-100 text-amber-700" :
                "bg-sky-100 text-sky-700"
              }`}>{t.status}</span>
            </div>
            <div className="text-right">
              <Button size="sm" variant="ghost" className="h-7 px-2 text-[12px]"><Eye className="h-3.5 w-3.5" /></Button>
            </div>
          </div>
        ))}
      </div>

      <NewSampleDialog
        open={open}
        onOpenChange={setOpen}
        onCreate={(t) => setTasks((prev) => [t, ...prev])}
      />
    </div>
  );
}

function StrategyCard({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <div className="flex items-center gap-2 text-[13px] font-medium">
        <span className="text-[var(--console-orange)]">{icon}</span>
        {title}
      </div>
      <p className="text-[11px] text-muted-foreground mt-1.5 leading-relaxed">{desc}</p>
    </div>
  );
}

function NewSampleDialog({
  open, onOpenChange, onCreate,
}: { open: boolean; onOpenChange: (v: boolean) => void; onCreate: (t: SampleTask) => void }) {
  const [name, setName] = useState("");
  const [strategies, setStrategies] = useState<string[]>(["随机抽样"]);
  const [count, setCount] = useState(100);
  const [dedupe, setDedupe] = useState("query");
  const [schedule, setSchedule] = useState("once");
  const [keyword, setKeyword] = useState("");

  const toggle = (s: string) =>
    setStrategies((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));

  const submit = () => {
    if (!name.trim()) return;
    const id = `T${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${String(Math.floor(Math.random() * 90) + 10)}`;
    onCreate({
      id,
      name: name.trim(),
      createdAt: new Date().toISOString().slice(0, 16).replace("T", " "),
      strategies,
      count,
      status: schedule === "cron" ? "已调度" : "已完成",
    });
    onOpenChange(false);
    setName(""); setStrategies(["随机抽样"]); setCount(100);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[560px]">
        <DialogHeader><DialogTitle>新建抽样任务</DialogTitle></DialogHeader>
        <div className="space-y-4 py-2">
          <Field label="任务名称">
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="例如：5月第二周·随机抽样" />
          </Field>
          <Field label="数据源">
            <Select defaultValue="agent-log">
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="agent-log">点点 Agent 日志（最近 7 天）</SelectItem>
                <SelectItem value="agent-log-30">点点 Agent 日志（最近 30 天）</SelectItem>
                <SelectItem value="custom">自定义时间范围…</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="抽样策略（可叠加）">
            <div className="grid grid-cols-2 gap-2">
              {["随机抽样", "分层抽样", "问题定向", "关键词过滤"].map((s) => (
                <label key={s} className="flex items-center gap-2 text-[13px] cursor-pointer">
                  <Checkbox checked={strategies.includes(s)} onCheckedChange={() => toggle(s)} /> {s}
                </label>
              ))}
            </div>
          </Field>
          {strategies.includes("关键词过滤") && (
            <Field label="关键词 / 正则">
              <Input value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="如：垃圾分类|物业|/^投诉/" />
            </Field>
          )}
          <div className="grid grid-cols-2 gap-3">
            <Field label="抽样数量">
              <Input type="number" value={count} onChange={(e) => setCount(parseInt(e.target.value) || 0)} />
            </Field>
            <Field label="去重规则">
              <Select value={dedupe} onValueChange={setDedupe}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="query">同 query 去重</SelectItem>
                  <SelectItem value="session">同 session 去重</SelectItem>
                  <SelectItem value="none">不去重</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>
          <Field label="调度方式">
            <Select value={schedule} onValueChange={setSchedule}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="once">单次触发</SelectItem>
                <SelectItem value="cron">定时自动抽样（cron）</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          {schedule === "cron" && (
            <Field label="cron 表达式">
              <Input placeholder="0 9 * * 1 （每周一 9 点）" />
            </Field>
          )}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>取消</Button>
          <Button onClick={submit} className="bg-[var(--console-cta)] text-[var(--console-cta-foreground)] hover:bg-[var(--console-cta)]/90">创建</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[12px] text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

// ---------- 2. 评估 Skill ----------
function SkillPanel() {
  const [skills, setSkills] = useState<Skill[]>(initialSkills);
  const [editing, setEditing] = useState<Skill | null>(null);
  const [running, setRunning] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  const newSkill = () => {
    setEditing({ id: `sk${Date.now()}`, name: "", type: "大模型自动评估", desc: "", model: "claude-sonnet-4-5", updatedAt: "" });
  };

  const runSkill = (id: string) => {
    setRunning(id); setProgress(0);
    const t = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) { clearInterval(t); setTimeout(() => setRunning(null), 600); return 100; }
        return p + 7;
      });
    }, 200);
  };

  const typeIcon = (t: Skill["type"]) =>
    t === "大模型自动评估" ? <Sparkles className="h-3.5 w-3.5" /> :
    t === "规则评估" ? <Ruler className="h-3.5 w-3.5" /> :
    t === "人工评估" ? <Users className="h-3.5 w-3.5" /> :
    <GitCompare className="h-3.5 w-3.5" />;

  return (
    <div className="space-y-4 max-w-[1200px]">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold">评估 Skill</h2>
          <p className="text-xs text-muted-foreground mt-0.5">配置多种评估能力，对语料批量执行</p>
        </div>
        <Button size="sm" className="gap-1.5 bg-[var(--console-cta)] text-[var(--console-cta-foreground)] hover:bg-[var(--console-cta)]/90" onClick={newSkill}>
          <Plus className="h-3.5 w-3.5" /> 新建 Skill
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {skills.map((sk) => (
          <div key={sk.id} className="rounded-lg border border-border bg-card p-4 hover:border-[var(--console-orange)]/40 transition-colors">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[var(--console-orange)]">{typeIcon(sk.type)}</span>
                  <h3 className="text-[14px] font-medium">{sk.name}</h3>
                  <Badge variant="secondary" className="text-[10px] font-normal">{sk.type}</Badge>
                </div>
                <p className="text-[12px] text-muted-foreground mt-1.5 leading-relaxed">{sk.desc}</p>
                {sk.model && (
                  <div className="mt-2 text-[11px] text-muted-foreground font-mono">模型：{sk.model}</div>
                )}
              </div>
            </div>
            {running === sk.id ? (
              <div className="mt-3">
                <Progress value={progress} className="h-1.5" />
                <div className="text-[11px] text-muted-foreground mt-1">运行中… {progress}%</div>
              </div>
            ) : (
              <div className="flex items-center gap-2 mt-3">
                <Button size="sm" variant="ghost" className="h-7 px-2 text-[12px] gap-1" onClick={() => runSkill(sk.id)}>
                  <Play className="h-3 w-3" /> 运行
                </Button>
                <Button size="sm" variant="ghost" className="h-7 px-2 text-[12px]" onClick={() => setEditing(sk)}>编辑</Button>
                <span className="ml-auto text-[11px] text-muted-foreground">{sk.updatedAt}</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {editing && (
        <SkillEditor
          skill={editing}
          onClose={() => setEditing(null)}
          onSave={(s) => {
            setSkills((prev) => {
              const exists = prev.find((x) => x.id === s.id);
              const next = { ...s, updatedAt: new Date().toISOString().slice(0, 16).replace("T", " ") };
              return exists ? prev.map((x) => (x.id === s.id ? next : x)) : [next, ...prev];
            });
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}

function SkillEditor({ skill, onClose, onSave }: { skill: Skill; onClose: () => void; onSave: (s: Skill) => void }) {
  const [s, setS] = useState<Skill>(skill);
  const [tpl, setTpl] = useState(
    `请基于用户问题和回答，给出 0-3 分的满意度评分。\n\n用户问题：{query}\n回答：{answer}\n上下文：{context}\n\n输出 JSON：{ "score": number, "issue_type": string, "note": string }`
  );

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-[640px]">
        <DialogHeader><DialogTitle>{skill.name ? "编辑 Skill" : "新建 Skill"}</DialogTitle></DialogHeader>
        <div className="space-y-4 py-2 max-h-[60vh] overflow-auto">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Skill 名称">
              <Input value={s.name} onChange={(e) => setS({ ...s, name: e.target.value })} />
            </Field>
            <Field label="类型">
              <Select value={s.type} onValueChange={(v) => setS({ ...s, type: v as Skill["type"] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="大模型自动评估">大模型自动评估</SelectItem>
                  <SelectItem value="规则评估">规则评估</SelectItem>
                  <SelectItem value="人工评估">人工评估</SelectItem>
                  <SelectItem value="对比评估">对比评估</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>
          <Field label="描述">
            <Input value={s.desc} onChange={(e) => setS({ ...s, desc: e.target.value })} />
          </Field>
          {(s.type === "大模型自动评估" || s.type === "对比评估") && (
            <>
              <Field label="模型">
                <Select value={s.model || "claude-sonnet-4-5"} onValueChange={(v) => setS({ ...s, model: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="claude-opus-4-7">claude-opus-4-7</SelectItem>
                    <SelectItem value="claude-sonnet-4-5">claude-sonnet-4-5</SelectItem>
                    <SelectItem value="gpt-4o">gpt-4o</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Prompt 模板（支持 {query} {answer} {context}）">
                <Textarea value={tpl} onChange={(e) => setTpl(e.target.value)} className="min-h-[140px] font-mono text-[12px]" />
              </Field>
            </>
          )}
          {s.type === "规则评估" && (
            <Field label="规则（每行一条，正则或关键词）">
              <Textarea defaultValue={"敏感词1\n敏感词2\n/^投诉/"} className="min-h-[100px] font-mono text-[12px]" />
            </Field>
          )}
          <div className="grid grid-cols-3 gap-3">
            <Field label="分数字段"><Input defaultValue="score" /></Field>
            <Field label="问题类型字段"><Input defaultValue="issue_type" /></Field>
            <Field label="备注字段"><Input defaultValue="note" /></Field>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>取消</Button>
          <Button onClick={() => onSave(s)} className="bg-[var(--console-cta)] text-[var(--console-cta-foreground)] hover:bg-[var(--console-cta)]/90">保存</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------- 3. 看板 ----------
function DashboardPanel() {
  const [taskA, setTaskA] = useState("T20260514-01");
  const [taskB, setTaskB] = useState("T20260513-02");
  const total = useMemo(() => issueTypes.reduce((a, b) => a + b.v, 0), []);
  const dist = [
    { score: "0 分", count: 18, color: "bg-rose-400" },
    { score: "1 分", count: 42, color: "bg-amber-400" },
    { score: "2 分", count: 76, color: "bg-sky-400" },
    { score: "3 分", count: 64, color: "bg-emerald-400" },
  ];
  const distTotal = dist.reduce((a, b) => a + b.count, 0);

  return (
    <div className="space-y-4 max-w-[1280px]">
      <div className="flex items-center gap-3">
        <Select defaultValue="T20260514-01">
          <SelectTrigger className="w-[260px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            {initialTasks.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select defaultValue="sk1">
          <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            {initialSkills.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="ml-auto flex items-center gap-2 text-[12px]">
          <KpiPill label="平均分" value="3.42" trend="+0.18" up />
          <KpiPill label="样本数" value="200" />
          <KpiPill label="低分占比" value="14%" trend="-3%" up />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card title="① 满意度分布">
          <div className="space-y-2.5 mt-2">
            {dist.map((d) => (
              <div key={d.score} className="flex items-center gap-3 text-[12px]">
                <div className="w-10 text-muted-foreground">{d.score}</div>
                <div className="flex-1 h-5 bg-muted rounded overflow-hidden">
                  <div className={`h-full ${d.color}`} style={{ width: `${(d.count / distTotal) * 100}%` }} />
                </div>
                <div className="w-14 text-right tabular-nums">{d.count}</div>
              </div>
            ))}
          </div>
        </Card>

        <Card title="② 平均分趋势（近 14 天）">
          <Sparkline values={trend} />
        </Card>

        <Card title="③ 问题类型占比">
          <div className="space-y-1.5 mt-2">
            {issueTypes.map((it, i) => (
              <div key={it.name} className="flex items-center gap-2 text-[12px]">
                <div className="w-2 h-2 rounded-sm" style={{ background: `oklch(0.7 0.15 ${i * 50})` }} />
                <div className="flex-1 truncate">{it.name}</div>
                <div className="w-24 h-1.5 bg-muted rounded overflow-hidden">
                  <div className="h-full bg-[var(--console-orange)]" style={{ width: `${(it.v / total) * 100}%` }} />
                </div>
                <div className="w-10 text-right tabular-nums text-muted-foreground">{Math.round((it.v / total) * 100)}%</div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card title="问题下钻 · Top Cases">
          <div className="space-y-2 mt-2">
            {[
              { type: "回答不准确 / 事实错误", q: "明天上海会下雨吗", a: "明天上海多云转晴。（实际：有雨）", score: 1 },
              { type: "工具未命中 / 未调用地图", q: "附近的菜市场怎么走", a: "你可以打开地图 App 搜索。", score: 1 },
              { type: "对话断链 / 忽略上下文", q: "刚才那家呢？", a: "请问您指的是哪家店？", score: 0 },
              { type: "回答冗长 / 啰嗦", q: "你是谁", a: "我是你的智能助手，我可以帮你……（200 字）", score: 2 },
            ].map((c, i) => (
              <div key={i} className="rounded-md border border-border p-3 hover:bg-accent/30 cursor-pointer">
                <div className="flex items-center gap-2 text-[11px]">
                  <Badge variant="secondary" className="font-normal">{c.type}</Badge>
                  <span className={`ml-auto px-1.5 py-0.5 rounded text-white text-[10px] ${c.score === 0 ? "bg-rose-500" : c.score === 1 ? "bg-amber-500" : "bg-sky-500"}`}>{c.score} 分</span>
                </div>
                <div className="text-[12px] mt-1.5"><span className="text-muted-foreground">Q:</span> {c.q}</div>
                <div className="text-[12px] mt-0.5 line-clamp-1"><span className="text-muted-foreground">A:</span> {c.a}</div>
              </div>
            ))}
          </div>
        </Card>

        <Card title="版本对比">
          <div className="flex items-center gap-2 mb-3">
            <Select value={taskA} onValueChange={setTaskA}>
              <SelectTrigger className="h-8 text-[12px]"><SelectValue /></SelectTrigger>
              <SelectContent>{initialTasks.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
            </Select>
            <span className="text-muted-foreground text-[12px]">vs</span>
            <Select value={taskB} onValueChange={setTaskB}>
              <SelectTrigger className="h-8 text-[12px]"><SelectValue /></SelectTrigger>
              <SelectContent>{initialTasks.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <DeltaCard label="新增改善" value={42} color="text-emerald-600" icon={<TrendingUp className="h-3.5 w-3.5" />} />
            <DeltaCard label="持平" value={128} color="text-muted-foreground" icon={<ChevronRight className="h-3.5 w-3.5" />} />
            <DeltaCard label="恶化" value={9} color="text-rose-600" icon={<TrendingDown className="h-3.5 w-3.5" />} />
          </div>
          <div className="mt-4 space-y-2">
            {["准确性", "工具命中", "上下文连贯", "简洁度", "格式规范"].map((dim, i) => {
              const a = 60 + i * 5, b = 70 + i * 4;
              return (
                <div key={dim} className="text-[12px]">
                  <div className="flex justify-between text-muted-foreground"><span>{dim}</span><span className="tabular-nums">{a} → {b}</span></div>
                  <div className="flex gap-1 mt-1 h-1.5">
                    <div className="bg-muted-foreground/40 rounded-sm" style={{ width: `${a}%` }} />
                    <div className="bg-[var(--console-orange)] rounded-sm" style={{ width: `${b - a}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      <Card title="标注任务管理">
        <div className="grid grid-cols-[1.2fr_1fr_1fr_1fr] text-[12px] font-medium text-muted-foreground bg-muted/40 px-3 py-2 rounded-t border-b border-border -mx-4 mt-2">
          <div className="pl-4">标注同学</div><div>已完成 / 总数</div><div>一致性</div><div>进度</div>
        </div>
        {[
          { name: "yz", done: 48, total: 60, agree: "92%" },
          { name: "lina", done: 30, total: 60, agree: "88%" },
          { name: "wang", done: 55, total: 60, agree: "94%" },
        ].map((u) => (
          <div key={u.name} className="grid grid-cols-[1.2fr_1fr_1fr_1fr] items-center text-[13px] px-3 py-2.5 border-b border-border last:border-b-0 -mx-4">
            <div className="pl-4 flex items-center gap-2">
              <div className="h-6 w-6 rounded-full bg-foreground text-background flex items-center justify-center text-[10px] font-semibold">{u.name.slice(0, 2)}</div>
              {u.name}
            </div>
            <div className="tabular-nums">{u.done} / {u.total}</div>
            <div className="tabular-nums">{u.agree}</div>
            <div className="pr-4"><Progress value={(u.done / u.total) * 100} className="h-1.5" /></div>
          </div>
        ))}
      </Card>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <h3 className="text-[13px] font-medium">{title}</h3>
      {children}
    </div>
  );
}

function KpiPill({ label, value, trend, up }: { label: string; value: string; trend?: string; up?: boolean }) {
  return (
    <div className="rounded-md border border-border bg-card px-3 py-1.5 flex items-center gap-2">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold tabular-nums">{value}</span>
      {trend && <span className={`text-[11px] ${up ? "text-emerald-600" : "text-rose-600"}`}>{trend}</span>}
    </div>
  );
}

function DeltaCard({ label, value, color, icon }: { label: string; value: number; color: string; icon: React.ReactNode }) {
  return (
    <div className="rounded-md border border-border p-2.5">
      <div className={`flex items-center gap-1 text-[11px] ${color}`}>{icon}{label}</div>
      <div className="text-[20px] font-semibold tabular-nums mt-1">{value}</div>
    </div>
  );
}

function Sparkline({ values }: { values: number[] }) {
  const min = Math.min(...values), max = Math.max(...values);
  const w = 240, h = 80;
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * w;
    const y = h - ((v - min) / (max - min || 1)) * h;
    return `${x},${y}`;
  }).join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-[100px] mt-2">
      <polyline fill="none" stroke="var(--console-orange)" strokeWidth="2" points={pts} />
      {values.map((v, i) => {
        const x = (i / (values.length - 1)) * w;
        const y = h - ((v - min) / (max - min || 1)) * h;
        return <circle key={i} cx={x} cy={y} r="2" fill="var(--console-orange)" />;
      })}
    </svg>
  );
}
