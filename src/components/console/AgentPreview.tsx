import { useRef, useState } from "react";
import { Image as ImageIcon, FileText, FileSpreadsheet, Play, Bot, User, X } from "lucide-react";

type Step = { role: "user" | "agent" | "tool"; content: string; meta?: string };
type InputMode = "text" | "image" | "excel";
type Attachment = { name: string; url?: string; kind: "image" | "excel" };

export function AgentPreview() {
  const [mode, setMode] = useState<InputMode>("text");
  const [query, setQuery] = useState("");
  const [note, setNote] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [steps, setSteps] = useState<Step[]>([]);
  const imgRef = useRef<HTMLInputElement>(null);
  const xlsRef = useRef<HTMLInputElement>(null);

  function pick(kind: "image" | "excel") {
    setMode(kind);
    (kind === "image" ? imgRef : xlsRef).current?.click();
  }

  function onFiles(e: React.ChangeEvent<HTMLInputElement>, kind: "image" | "excel") {
    const files = Array.from(e.target.files ?? []);
    const next: Attachment[] = files.map((f) => ({
      name: f.name,
      kind,
      url: kind === "image" ? URL.createObjectURL(f) : undefined,
    }));
    setAttachments((a) => [...a, ...next]);
    e.target.value = "";
  }

  function run() {
    const hasContent = query.trim() || note.trim() || attachments.length;
    if (!hasContent) return;
    const userText =
      mode === "text"
        ? query
        : mode === "image"
          ? `[图片输入] ${attachments.map((a) => a.name).join("、")}${note ? "\n备注：" + note : ""}`
          : `[Excel 输入] ${attachments.map((a) => a.name).join("、")}${note ? "\n备注：" + note : ""}`;
    setSteps([
      { role: "user", content: userText },
      { role: "tool", content: "调用工具：知识库检索", meta: "命中 3 条相关文档" },
      { role: "agent", content: "我是点点，你的社区助手。可以告诉我具体的问题吗？" },
    ]);
  }

  const tabs: { k: InputMode; label: string; icon: typeof ImageIcon }[] = [
    { k: "image", label: "图片", icon: ImageIcon },
    { k: "text", label: "文本", icon: FileText },
    { k: "excel", label: "Excel", icon: FileSpreadsheet },
  ];

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-border">
        <div className="text-sm font-semibold mb-2">Agent 效果预览</div>

        <div className="flex items-center gap-1 mb-2">
          {tabs.map((t) => {
            const Icon = t.icon;
            const active = mode === t.k;
            return (
              <button
                key={t.k}
                onClick={() => {
                  if (t.k === "text") setMode("text");
                  else pick(t.k);
                }}
                className={`h-8 inline-flex items-center gap-1.5 px-2.5 rounded-md text-xs border transition ${
                  active
                    ? "border-[var(--console-orange)] text-[var(--console-orange)] bg-[var(--console-active)]"
                    : "border-border text-muted-foreground hover:bg-accent"
                }`}
                title={t.label}
              >
                <Icon className="h-3.5 w-3.5" />
                {t.label}
              </button>
            );
          })}
          <input
            ref={imgRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => onFiles(e, "image")}
          />
          <input
            ref={xlsRef}
            type="file"
            accept=".xls,.xlsx,.csv"
            multiple
            className="hidden"
            onChange={(e) => onFiles(e, "excel")}
          />
        </div>

        {mode === "text" && (
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="输入查询内容（支持 {{变量}}）"
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-[var(--console-orange)] resize-none min-h-[88px]"
          />
        )}

        {mode === "image" && (
          <div className="space-y-2">
            <button
              onClick={() => imgRef.current?.click()}
              className="w-full rounded-md border border-dashed border-border py-6 text-xs text-muted-foreground hover:bg-accent"
            >
              点击上传图片，或拖拽到此处
            </button>
            {attachments.filter((a) => a.kind === "image").length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {attachments
                  .filter((a) => a.kind === "image")
                  .map((a, i) => (
                    <div key={i} className="relative rounded-md border border-border overflow-hidden">
                      <img src={a.url} alt={a.name} className="w-full h-16 object-cover" />
                      <button
                        onClick={() => setAttachments((arr) => arr.filter((x) => x !== a))}
                        className="absolute top-0.5 right-0.5 h-4 w-4 rounded-full bg-background/90 inline-flex items-center justify-center"
                      >
                        <X className="h-2.5 w-2.5" />
                      </button>
                    </div>
                  ))}
              </div>
            )}
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="可选：附加文字说明"
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-[var(--console-orange)] resize-none min-h-[56px]"
            />
          </div>
        )}

        {mode === "excel" && (
          <div className="space-y-2">
            <button
              onClick={() => xlsRef.current?.click()}
              className="w-full rounded-md border border-dashed border-border py-6 text-xs text-muted-foreground hover:bg-accent"
            >
              上传 Excel / CSV（用于带记忆批量测试）
            </button>
            {attachments.filter((a) => a.kind === "excel").length > 0 && (
              <div className="space-y-1">
                {attachments
                  .filter((a) => a.kind === "excel")
                  .map((a, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 rounded-md border border-border px-2 py-1.5 text-xs"
                    >
                      <FileSpreadsheet className="h-3.5 w-3.5 text-[var(--console-orange)]" />
                      <span className="flex-1 truncate">{a.name}</span>
                      <button onClick={() => setAttachments((arr) => arr.filter((x) => x !== a))}>
                        <X className="h-3 w-3 text-muted-foreground" />
                      </button>
                    </div>
                  ))}
              </div>
            )}
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="可选：附加文字说明"
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-[var(--console-orange)] resize-none min-h-[56px]"
            />
          </div>
        )}

        <div className="flex items-center justify-end mt-2">
          <button
            onClick={run}
            className="inline-flex items-center gap-1.5 rounded-md bg-[var(--console-orange)] text-white px-3 py-1.5 text-xs hover:opacity-90"
          >
            <Play className="h-3 w-3 fill-current" />
            运行测试
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
        {steps.length === 0 ? (
          <div className="text-xs text-muted-foreground py-10 text-center">
            点击"运行测试"，将在此展示 Agent 历史轨迹
          </div>
        ) : (
          steps.map((s, i) => (
            <div key={i} className="rounded-md border border-border bg-background p-3">
              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mb-1">
                {s.role === "user" && <><User className="h-3 w-3" /> 用户</>}
                {s.role === "agent" && <><Bot className="h-3 w-3 text-[var(--console-orange)]" /> Agent</>}
                {s.role === "tool" && <>🔧 工具调用</>}
                {s.meta && <span className="ml-auto">{s.meta}</span>}
              </div>
              <div className="text-sm leading-relaxed whitespace-pre-wrap">{s.content}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
