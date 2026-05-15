import { useEffect, useRef, useState } from "react";
import {
  Image as ImageIcon,
  FileText,
  X,
  ArrowUp,
  UserRound,
  Activity,
  Upload,
  Share2,
  StickyNote,
  MessageSquare,
  Highlighter,
  ShoppingBag,
  User as UserIcon,
  MapPin,
  History,
} from "lucide-react";
import { TrajectoryView, buildDemoTrajectory, type TrajectoryStep } from "./TrajectoryView";

type AttachKind = "image" | "share" | "bulk-note" | "bulk-image";
type Attachment = { name: string; url?: string; kind: AttachKind };
type DialogKind = null | "image" | "note" | "share" | "bulk" | "user";

type ShareKind = "note" | "comment" | "highlight" | "goods" | "user" | "poi";
const SHARE_OPTIONS: { k: ShareKind; label: string; icon: typeof StickyNote }[] = [
  { k: "note", label: "笔记", icon: StickyNote },
  { k: "comment", label: "评论", icon: MessageSquare },
  { k: "highlight", label: "划词", icon: Highlighter },
  { k: "goods", label: "商品", icon: ShoppingBag },
  { k: "user", label: "用户", icon: UserIcon },
  { k: "poi", label: "POI", icon: MapPin },
];

export function AgentPreview() {
  const [query, setQuery] = useState("");
  const [note, setNote] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [steps, setSteps] = useState<TrajectoryStep[]>([]);
  const [dialog, setDialog] = useState<DialogKind>(null);
  const [userId, setUserId] = useState("");
  const [randomUid, setRandomUid] = useState(false);

  // share form
  const [shareKind, setShareKind] = useState<ShareKind>("note");
  const [shareFields, setShareFields] = useState<Record<string, string>>({});

  // bulk form
  const [bulkTab, setBulkTab] = useState<"note" | "image">("note");
  const [bulkNoteIds, setBulkNoteIds] = useState("");
  const [bulkImageUrls, setBulkImageUrls] = useState("");

  const imgRef = useRef<HTMLInputElement>(null);
  const [historyHash, setHistoryHash] = useState("");
  const [historyOpen, setHistoryOpen] = useState(false);

  function loadHistory() {
    const h = historyHash.trim();
    if (!h) return;
    setSteps([
      { kind: "user-text", content: `[历史轨迹 ${h}]` },
      ...buildDemoTrajectory(`hash:${h}`, "点点"),
    ]);
  }

  function onLocalImage(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    const next: Attachment[] = files.map((f) => ({
      name: f.name,
      kind: "image",
      url: URL.createObjectURL(f),
    }));
    setAttachments((a) => [...a, ...next]);
    e.target.value = "";
  }

  function splitIds(s: string) {
    return s
      .split(/[\n,，]+/)
      .map((x) => x.trim())
      .filter(Boolean);
  }

  function addShare() {
    const labelObj = SHARE_OPTIONS.find((o) => o.k === shareKind)!;
    const summary = Object.entries(shareFields)
      .filter(([, v]) => v?.trim())
      .map(([k, v]) => `${k}=${v}`)
      .join(" / ");
    if (!summary) return;
    setAttachments((a) => [
      ...a,
      { name: `${labelObj.label} · ${summary}`, kind: "share" },
    ]);
    setShareFields({});
    setDialog(null);
  }

  function addBulk() {
    if (bulkTab === "note") {
      const ids = splitIds(bulkNoteIds);
      if (!ids.length) return;
      setAttachments((a) => [
        ...a,
        ...ids.map<Attachment>((id) => ({ name: `笔记 ${id}`, kind: "bulk-note" })),
      ]);
      setBulkNoteIds("");
    } else {
      const urls = splitIds(bulkImageUrls);
      if (!urls.length) return;
      setAttachments((a) => [
        ...a,
        ...urls.map<Attachment>((u) => ({ name: u, url: u, kind: "bulk-image" })),
      ]);
      setBulkImageUrls("");
    }
    setDialog(null);
  }

  const images = attachments.filter((a) => a.kind === "image");
  const shares = attachments.filter((a) => a.kind === "share");
  const bulks = attachments.filter((a) => a.kind === "bulk-note" || a.kind === "bulk-image");

  function run() {
    if (!query.trim() && !note.trim() && !attachments.length) return;
    const trajectory: TrajectoryStep[] = [{ kind: "user-text", content: query }];
    if (images.length) {
      trajectory.push({
        kind: "user-attachment",
        icon: "image",
        content: `[图片] ${images.map((a) => a.name).join("、")}`,
      });
    }
    if (shares.length) {
      trajectory.push({
        kind: "user-attachment",
        icon: "note",
        content: `[分享] ${shares.map((a) => a.name).join("；")}`,
      });
    }
    if (bulks.length) {
      trajectory.push({
        kind: "user-attachment",
        icon: "note",
        content: `[上传内容] ${bulks.map((a) => a.name).join("、")}`,
      });
    }
    if (note.trim()) {
      trajectory.push({ kind: "user-attachment", icon: "note", content: `备注：${note}` });
    }
    trajectory.push(...buildDemoTrajectory(query, "点点"));
    setSteps(trajectory);
  }

  useEffect(() => {
    const onRun = (e: Event) => {
      const detail = (e as CustomEvent).detail as { tab?: string } | undefined;
      if (!detail || detail.tab === "edit") run();
    };
    window.addEventListener("console:run", onRun);
    return () => window.removeEventListener("console:run", onRun);
  });

  const userBadge = randomUid || userId.trim() ? 1 : 0;
  const triggers: { k: Exclude<DialogKind, null>; icon: typeof ImageIcon; title: string; badge: number }[] = [
    { k: "image", icon: ImageIcon, title: "上传图片（本地）", badge: images.length },
    { k: "share", icon: Share2, title: "拖拽 / 分享内容", badge: shares.length },
    { k: "bulk", icon: Upload, title: "上传内容（笔记 ID / 图片 URL）", badge: bulks.length },
  ];

  function onPasteImage(e: React.ClipboardEvent<HTMLTextAreaElement>) {
    const items = Array.from(e.clipboardData?.items ?? []);
    const files = items
      .filter((it) => it.kind === "file" && it.type.startsWith("image/"))
      .map((it) => it.getAsFile())
      .filter((f): f is File => !!f);
    if (!files.length) return;
    e.preventDefault();
    setAttachments((a) => [
      ...a,
      ...files.map<Attachment>((f) => ({
        name: f.name || `截图-${Date.now()}.png`,
        kind: "image",
        url: URL.createObjectURL(f),
      })),
    ]);
  }

  // share field schemas
  const shareSchema: Record<ShareKind, { key: string; label: string; placeholder?: string }[]> = {
    note: [{ key: "笔记ID", label: "笔记 ID" }],
    comment: [
      { key: "评论ID", label: "评论 ID" },
      { key: "笔记ID", label: "所属笔记 ID" },
    ],
    highlight: [
      { key: "笔记ID", label: "笔记 ID" },
      { key: "选中内容", label: "划词选中内容" },
      { key: "开始位置", label: "开始位置（字符索引）" },
    ],
    goods: [{ key: "商品ID", label: "商品 ID" }],
    user: [{ key: "用户ID", label: "用户 ID" }],
    poi: [{ key: "POI", label: "POI ID" }],
  };

  function attachIcon(kind: AttachKind) {
    if (kind === "image" || kind === "bulk-image") return ImageIcon;
    if (kind === "share") return Share2;
    return FileText;
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-2.5 border-b border-border flex items-center justify-between gap-3">
        <div className="text-sm font-semibold">Agent 效果预览</div>
        <div className="flex items-center gap-1">
          {steps.length > 0 && (
            <button
              onClick={() => setSteps([])}
              className="h-7 w-7 inline-flex items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition"
              title="清空预览"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
          <button
            onClick={() => setDialog("user")}
            className={`relative h-7 px-2 inline-flex items-center gap-1 rounded-md text-xs hover:bg-accent transition ${userBadge ? "text-[var(--console-orange)]" : "text-muted-foreground"}`}
            title="用户记忆 ID"
          >
            <UserRound className="h-3.5 w-3.5" />
            <span>用户 ID</span>
            {userBadge > 0 && (
              <span className="ml-0.5 h-1.5 w-1.5 rounded-full bg-[var(--console-orange)]" />
            )}
          </button>
          <div className="relative">
            <button
              onClick={() => setHistoryOpen((v) => !v)}
              className={`relative h-7 px-2 inline-flex items-center gap-1 rounded-md text-xs hover:bg-accent transition ${historyHash.trim() ? "text-[var(--console-orange)]" : "text-muted-foreground"}`}
              title="加载历史轨迹 hash-id"
            >
              <History className="h-3.5 w-3.5" />
              <span>hash-id</span>
            </button>
            {historyOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setHistoryOpen(false)} />
                <div className="absolute top-full right-0 mt-2 z-50 w-[280px] rounded-lg border border-border bg-background shadow-lg p-2 flex items-center gap-1.5">
                  <input
                    autoFocus
                    value={historyHash}
                    onChange={(e) => setHistoryHash(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        loadHistory();
                        setHistoryOpen(false);
                      }
                    }}
                    placeholder="输入 hash_id"
                    className="flex-1 h-7 rounded-md border border-border bg-background px-2 text-xs outline-none focus:border-[var(--console-orange)] placeholder:text-muted-foreground/70"
                  />
                  <button
                    onClick={() => {
                      loadHistory();
                      setHistoryOpen(false);
                    }}
                    disabled={!historyHash.trim()}
                    className="shrink-0 h-7 px-3 rounded-md bg-foreground text-background text-xs hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed transition"
                  >
                    加载
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4">
        <TrajectoryView steps={steps} emptyHint="将在此展示运行的 Agent 历史轨迹" />
      </div>

      <div className="px-4 pt-2 pb-4 bg-background">
        <div className="mx-auto max-w-3xl">
          {attachments.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2">
              {attachments.map((a, i) => {
                const Ico = attachIcon(a.kind);
                return (
                  <div
                    key={i}
                    className="group flex items-center gap-1.5 rounded-full bg-muted/60 pl-2 pr-1 py-1 text-[11px]"
                  >
                    <Ico className="h-3 w-3 text-[var(--console-orange)]" />
                    <span className="max-w-[180px] truncate">{a.name}</span>
                    <button
                      onClick={() => setAttachments((arr) => arr.filter((x) => x !== a))}
                      className="h-4 w-4 rounded-full hover:bg-background inline-flex items-center justify-center"
                    >
                      <X className="h-2.5 w-2.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          <div className="rounded-2xl border border-border bg-background shadow-[0_2px_12px_-4px_rgba(0,0,0,0.08)] focus-within:border-[var(--console-orange)]/60 focus-within:shadow-[0_4px_20px_-6px_rgba(0,0,0,0.12)] transition">
            <textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                  e.preventDefault();
                  run();
                }
              }}
              onPaste={onPasteImage}
              placeholder="输入消息与 Agent 对话... (Enter 发送, Shift+Enter 换行, Ctrl+V 可粘贴截图)"
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
                      onClick={() => {
                        if (t.k === "image") {
                          imgRef.current?.click();
                        } else {
                          setDialog(t.k);
                        }
                      }}
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
        onChange={onLocalImage}
      />

      {dialog && (
        <div
          className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center"
          onClick={() => setDialog(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-[520px] max-w-[92vw] rounded-lg bg-background border border-border shadow-xl"
          >
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <div className="text-sm font-semibold">
                {dialog === "note" && "附加笔记"}
                {dialog === "share" && "拖拽 / 分享内容"}
                {dialog === "bulk" && "上传内容"}
                {dialog === "user" && "用户记忆 ID"}
                {dialog === "image" && "上传图片"}
              </div>
              <button onClick={() => setDialog(null)} className="p-1 rounded hover:bg-accent">
                <X className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            </div>

            <div className="p-4 space-y-3">
              {dialog === "note" && (
                <textarea
                  autoFocus
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="输入笔记/补充说明……"
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-[var(--console-orange)] resize-none min-h-[140px]"
                />
              )}

              {dialog === "share" && (
                <>
                  <div>
                    <label className="text-[11px] text-muted-foreground mb-1.5 block">
                      内容类型
                    </label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {SHARE_OPTIONS.map((o) => {
                        const Icon = o.icon;
                        const active = shareKind === o.k;
                        return (
                          <button
                            key={o.k}
                            onClick={() => {
                              setShareKind(o.k);
                              setShareFields({});
                            }}
                            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border text-xs transition ${
                              active
                                ? "border-[var(--console-orange)] bg-[var(--console-orange)]/10 text-foreground"
                                : "border-border hover:bg-accent"
                            }`}
                          >
                            <Icon className="h-3.5 w-3.5" />
                            {o.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-2 pt-1">
                    {shareSchema[shareKind].map((f) => (
                      <div key={f.key}>
                        <label className="text-[11px] text-muted-foreground mb-1 block">
                          {f.label}
                        </label>
                        {f.key === "选中内容" ? (
                          <textarea
                            value={shareFields[f.key] ?? ""}
                            onChange={(e) =>
                              setShareFields((s) => ({ ...s, [f.key]: e.target.value }))
                            }
                            placeholder={f.placeholder}
                            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-[var(--console-orange)] resize-none min-h-[60px]"
                          />
                        ) : (
                          <input
                            value={shareFields[f.key] ?? ""}
                            onChange={(e) =>
                              setShareFields((s) => ({ ...s, [f.key]: e.target.value }))
                            }
                            placeholder={f.placeholder}
                            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-[var(--console-orange)]"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </>
              )}

              {dialog === "bulk" && (
                <>
                  <div className="flex border-b border-border">
                    {(["note", "image"] as const).map((t) => (
                      <button
                        key={t}
                        onClick={() => setBulkTab(t)}
                        className={`px-3 py-1.5 text-xs -mb-px border-b-2 transition ${
                          bulkTab === t
                            ? "border-[var(--console-orange)] text-foreground"
                            : "border-transparent text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {t === "note" ? "笔记" : "图片"}
                      </button>
                    ))}
                  </div>
                  {bulkTab === "note" ? (
                    <div>
                      <label className="text-[11px] text-muted-foreground mb-1 block">
                        笔记 ID（多个用换行或逗号隔开）
                      </label>
                      <textarea
                        autoFocus
                        value={bulkNoteIds}
                        onChange={(e) => setBulkNoteIds(e.target.value)}
                        placeholder={"例如：\n6512abc...\n6512def...,6512ghi..."}
                        className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-[var(--console-orange)] resize-none min-h-[140px] font-mono"
                      />
                    </div>
                  ) : (
                    <div>
                      <label className="text-[11px] text-muted-foreground mb-1 block">
                        图片 URL（多个用换行或逗号隔开）
                      </label>
                      <textarea
                        autoFocus
                        value={bulkImageUrls}
                        onChange={(e) => setBulkImageUrls(e.target.value)}
                        placeholder={"例如：\nhttps://.../a.jpg\nhttps://.../b.jpg"}
                        className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-[var(--console-orange)] resize-none min-h-[140px] font-mono"
                      />
                    </div>
                  )}
                </>
              )}

              {dialog === "user" && (
                <div className="space-y-3">
                  <div>
                    <label className="text-[11px] text-muted-foreground mb-1 block">用户 ID</label>
                    <input
                      autoFocus
                      value={randomUid ? "" : userId}
                      onChange={(e) => setUserId(e.target.value)}
                      disabled={randomUid}
                      placeholder={randomUid ? "已启用随机 userid" : "用于记忆检索"}
                      className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-[var(--console-orange)] disabled:opacity-50"
                    />
                  </div>
                  <label className="inline-flex items-center gap-2 cursor-pointer select-none text-xs">
                    <input
                      type="checkbox"
                      checked={randomUid}
                      onChange={(e) => setRandomUid(e.target.checked)}
                      className="h-3.5 w-3.5 accent-[var(--console-orange)]"
                    />
                    <span>使用随机 userid（每次运行生成新 ID）</span>
                  </label>
                </div>
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
                onClick={() => {
                  if (dialog === "share") addShare();
                  else if (dialog === "bulk") addBulk();
                  else setDialog(null);
                }}
                className="px-3 py-1.5 text-xs rounded-md bg-[var(--console-cta)] text-[var(--console-cta-foreground)] hover:opacity-90"
              >
                {dialog === "share" || dialog === "bulk" ? "添加" : "确定"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
