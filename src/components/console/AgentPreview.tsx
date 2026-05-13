import { useEffect, useRef, useState } from "react";
import { Image as ImageIcon, FileText, FileSpreadsheet, Bot, User, X, ArrowUp } from "lucide-react";

type Step = { role: "user" | "agent" | "tool"; content: string; meta?: string };
type Attachment = { name: string; url?: string; kind: "image" | "excel" };
type DialogKind = null | "image" | "note" | "excel";

export function AgentPreview() {
  const [query, setQuery] = useState("");
  const [note, setNote] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [steps, setSteps] = useState<Step[]>([]);
  const [dialog, setDialog] = useState<DialogKind>(null);
  const imgRef = useRef<HTMLInputElement>(null);
  const xlsRef = useRef<HTMLInputElement>(null);

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

  const images = attachments.filter((a) => a.kind === "image");
  const excels = attachments.filter((a) => a.kind === "excel");

  function run() {
    if (!query.trim() && !note.trim() && !attachments.length) return;
    const parts: string[] = [];
    if (query.trim()) parts.push(query);
    if (images.length) parts.push(`[图片] ${images.map((a) => a.name).join("、")}`);
    if (excels.length) parts.push(`[Excel] ${excels.map((a) => a.name).join("、")}`);
    if (note.trim()) parts.push(`备注：${note}`);
    setSteps([
      { role: "user", content: parts.join("\n") },
      { role: "tool", content: "调用工具：知识库检索", meta: "命中 3 条相关文档" },
      { role: "agent", content: "我是点点，你的社区助手。可以告诉我具体的问题吗？" },
    ]);
  }

  useEffect(() => {
    const onRun = (e: Event) => {
      const detail = (e as CustomEvent).detail as { tab?: string } | undefined;
      if (!detail || detail.tab === "edit") run();
    };
    window.addEventListener("console:run", onRun);
    return () => window.removeEventListener("console:run", onRun);
  });

  const triggers: { k: Exclude<DialogKind, null>; icon: typeof ImageIcon; title: string; badge: number }[] = [
    { k: "image", icon: ImageIcon, title: "上传图片", badge: images.length },
    { k: "note", icon: FileText, title: "附加笔记", badge: note.trim() ? 1 : 0 },
    { k: "excel", icon: FileSpreadsheet, title: "上传 Excel", badge: excels.length },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* 标题栏 */}
      <div className="px-4 py-3 border-b border-border text-sm font-semibold">
        Agent 效果预览
      </div>

      {/* 历史轨迹 */}
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

      {/* 底部输入：现代 chat 样式 */}
      <div className="px-4 pt-2 pb-4 bg-background">
        <div className="mx-auto max-w-3xl">
          {/* 附件预览条 */}
          {attachments.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2">
              {attachments.map((a, i) => (
                <div
                  key={i}
                  className="group flex items-center gap-1.5 rounded-full bg-muted/60 pl-2 pr-1 py-1 text-[11px]"
                >
                  {a.kind === "image" ? (
                    <ImageIcon className="h-3 w-3 text-[var(--console-orange)]" />
                  ) : (
                    <FileSpreadsheet className="h-3 w-3 text-[var(--console-orange)]" />
                  )}
                  <span className="max-w-[140px] truncate">{a.name}</span>
                  <button
                    onClick={() => setAttachments((arr) => arr.filter((x) => x !== a))}
                    className="h-4 w-4 rounded-full hover:bg-background inline-flex items-center justify-center"
                  >
                    <X className="h-2.5 w-2.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="rounded-2xl border border-border bg-background shadow-[0_2px_12px_-4px_rgba(0,0,0,0.08)] focus-within:border-[var(--console-orange)]/60 focus-within:shadow-[0_4px_20px_-6px_rgba(0,0,0,0.12)] transition">
            <textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault();
                  run();
                }
              }}
              placeholder="请输入要测试的内容…"
              rows={1}
              className="w-full bg-transparent outline-none text-sm resize-none px-4 pt-3 pb-1 min-h-[52px] max-h-[200px] placeholder:text-muted-foreground/70"
            />
            <div className="flex items-center justify-between px-2 pb-2">
              <div className="flex items-center gap-0.5 text-muted-foreground">
                {triggers.map((t) => {
                  const Icon = t.icon;
                  return (
                    <button
                      key={t.k}
                      onClick={() => setDialog(t.k)}
                      className="relative h-8 w-8 inline-flex items-center justify-center rounded-lg hover:bg-accent hover:text-foreground transition"
                      title={t.title}
                    >
                      <Icon className="h-4 w-4" />
                      {t.badge > 0 && (
                        <span className="absolute top-1 right-1 h-3.5 min-w-3.5 px-1 rounded-full bg-[var(--console-orange)] text-white text-[9px] font-medium inline-flex items-center justify-center">
                          {t.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10.5px] text-muted-foreground/70 hidden sm:block">
                  ⌘ / Ctrl + Enter
                </span>
                <button
                  onClick={run}
                  disabled={!query.trim() && !attachments.length && !note.trim()}
                  className="shrink-0 inline-flex items-center justify-center h-8 w-8 rounded-full bg-foreground text-background hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed transition"
                  title="运行"
                >
                  <ArrowUp className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

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

      {dialog && (
        <div
          className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center"
          onClick={() => setDialog(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-[480px] max-w-[92vw] rounded-lg bg-background border border-border shadow-xl"
          >
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <div className="text-sm font-semibold">
                {dialog === "image" && "上传图片"}
                {dialog === "note" && "附加笔记"}
                {dialog === "excel" && "上传 Excel"}
              </div>
              <button onClick={() => setDialog(null)} className="p-1 rounded hover:bg-accent">
                <X className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            </div>

            <div className="p-4 space-y-3">
              {dialog === "image" && (
                <>
                  <button
                    onClick={() => imgRef.current?.click()}
                    className="w-full rounded-md border border-dashed border-border py-8 text-xs text-muted-foreground hover:bg-accent"
                  >
                    点击选择图片，或拖拽到此处（支持多张）
                  </button>
                  {images.length > 0 && (
                    <div className="grid grid-cols-3 gap-2">
                      {images.map((a, i) => (
                        <div key={i} className="relative rounded-md border border-border overflow-hidden">
                          <img src={a.url} alt={a.name} className="w-full h-20 object-cover" />
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
                </>
              )}

              {dialog === "note" && (
                <textarea
                  autoFocus
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="输入笔记/补充说明……"
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-[var(--console-orange)] resize-none min-h-[140px]"
                />
              )}

              {dialog === "excel" && (
                <>
                  <button
                    onClick={() => xlsRef.current?.click()}
                    className="w-full rounded-md border border-dashed border-border py-8 text-xs text-muted-foreground hover:bg-accent"
                  >
                    点击选择 Excel / CSV（用于带记忆批量测试）
                  </button>
                  {excels.length > 0 && (
                    <div className="space-y-1">
                      {excels.map((a, i) => (
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
                </>
              )}
            </div>

            <div className="px-4 py-3 border-t border-border flex justify-end gap-2">
              <button
                onClick={() => setDialog(null)}
                className="px-3 py-1.5 text-xs rounded-md border border-border hover:bg-accent"
              >
                取消
              </button>
              <button
                onClick={() => setDialog(null)}
                className="px-3 py-1.5 text-xs rounded-md bg-[var(--console-cta)] text-[var(--console-cta-foreground)] hover:opacity-90"
              >
                确定
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
