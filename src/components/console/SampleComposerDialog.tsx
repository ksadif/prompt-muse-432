import { useEffect, useRef, useState } from "react";
import {
  Image as ImageIcon,
  FileText,
  X,
  ArrowUp,
  Upload,
  Share2,
  StickyNote,
  MessageSquare,
  Highlighter,
  ShoppingBag,
  User as UserIcon,
  MapPin,
} from "lucide-react";

type AttachKind = "image" | "share" | "bulk-note" | "bulk-image";
export type ComposerAttachment = { name: string; url?: string; kind: AttachKind };
type DialogKind = null | "note" | "share" | "bulk";

export type ComposerResult = {
  query: string;
  note: string;
  attachments: ComposerAttachment[];
};

type ShareKind = "note" | "comment" | "highlight" | "goods" | "user" | "poi";
const SHARE_OPTIONS: { k: ShareKind; label: string; icon: typeof StickyNote }[] = [
  { k: "note", label: "笔记", icon: StickyNote },
  { k: "comment", label: "评论", icon: MessageSquare },
  { k: "highlight", label: "划词", icon: Highlighter },
  { k: "goods", label: "商品", icon: ShoppingBag },
  { k: "user", label: "用户", icon: UserIcon },
  { k: "poi", label: "POI", icon: MapPin },
];

function attachIcon(kind: AttachKind) {
  if (kind === "image" || kind === "bulk-image") return ImageIcon;
  if (kind === "share") return Share2;
  return FileText;
}

export function SampleComposerDialog({
  open,
  onClose,
  onConfirm,
  title = "新增测试样本",
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: (r: ComposerResult) => void;
  title?: string;
}) {
  const [query, setQuery] = useState("");
  const [note, setNote] = useState("");
  const [attachments, setAttachments] = useState<ComposerAttachment[]>([]);
  const [sub, setSub] = useState<DialogKind>(null);
  const [shareKind, setShareKind] = useState<ShareKind>("note");
  const [shareFields, setShareFields] = useState<Record<string, string>>({});
  const [bulkTab, setBulkTab] = useState<"note" | "image">("note");
  const [bulkNoteIds, setBulkNoteIds] = useState("");
  const [bulkImageUrls, setBulkImageUrls] = useState("");
  const imgRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setQuery("");
      setNote("");
      setAttachments([]);
      setSub(null);
      setShareFields({});
      setBulkNoteIds("");
      setBulkImageUrls("");
    }
  }, [open]);

  if (!open) return null;

  const images = attachments.filter((a) => a.kind === "image");
  const shares = attachments.filter((a) => a.kind === "share");
  const bulks = attachments.filter((a) => a.kind === "bulk-note" || a.kind === "bulk-image");

  function onLocalImage(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    setAttachments((a) => [
      ...a,
      ...files.map<ComposerAttachment>((f) => ({
        name: f.name,
        kind: "image",
        url: URL.createObjectURL(f),
      })),
    ]);
    e.target.value = "";
  }
  function onPasteImage(e: React.ClipboardEvent<HTMLTextAreaElement>) {
    const files = Array.from(e.clipboardData?.items ?? [])
      .filter((it) => it.kind === "file" && it.type.startsWith("image/"))
      .map((it) => it.getAsFile())
      .filter((f): f is File => !!f);
    if (!files.length) return;
    e.preventDefault();
    setAttachments((a) => [
      ...a,
      ...files.map<ComposerAttachment>((f) => ({
        name: f.name || `截图-${Date.now()}.png`,
        kind: "image",
        url: URL.createObjectURL(f),
      })),
    ]);
  }
  function splitIds(s: string) {
    return s.split(/[\n,，]+/).map((x) => x.trim()).filter(Boolean);
  }
  function addShare() {
    const labelObj = SHARE_OPTIONS.find((o) => o.k === shareKind)!;
    const summary = Object.entries(shareFields)
      .filter(([, v]) => v?.trim())
      .map(([k, v]) => `${k}=${v}`)
      .join(" / ");
    if (!summary) return;
    setAttachments((a) => [...a, { name: `${labelObj.label} · ${summary}`, kind: "share" }]);
    setShareFields({});
    setSub(null);
  }
  function addBulk() {
    if (bulkTab === "note") {
      const ids = splitIds(bulkNoteIds);
      if (!ids.length) return;
      setAttachments((a) => [
        ...a,
        ...ids.map<ComposerAttachment>((id) => ({ name: `笔记 ${id}`, kind: "bulk-note" })),
      ]);
      setBulkNoteIds("");
    } else {
      const urls = splitIds(bulkImageUrls);
      if (!urls.length) return;
      setAttachments((a) => [
        ...a,
        ...urls.map<ComposerAttachment>((u) => ({ name: u, url: u, kind: "bulk-image" })),
      ]);
      setBulkImageUrls("");
    }
    setSub(null);
  }

  const triggers = [
    { k: "image" as const, icon: ImageIcon, title: "上传图片", badge: images.length },
    { k: "share" as const, icon: Share2, title: "分享内容", badge: shares.length },
    { k: "bulk" as const, icon: Upload, title: "批量上传", badge: bulks.length },
    { k: "note" as const, icon: StickyNote, title: "附加笔记", badge: note.trim() ? 1 : 0 },
  ];

  const shareSchema: Record<ShareKind, { key: string; label: string }[]> = {
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

  function confirm() {
    if (!query.trim() && !attachments.length && !note.trim()) return;
    onConfirm({ query, note, attachments });
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-[640px] max-w-[94vw] rounded-xl bg-background border border-border shadow-2xl"
      >
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <div className="text-sm font-semibold">{title}</div>
          <button onClick={onClose} className="p-1 rounded hover:bg-accent">
            <X className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        </div>

        <div className="p-4">
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

          <div className="rounded-2xl border border-border bg-background focus-within:border-[var(--console-orange)]/60 transition">
            <textarea
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault();
                  confirm();
                }
              }}
              onPaste={onPasteImage}
              placeholder="输入 Query... (Ctrl/⌘+Enter 确认, 可粘贴截图)"
              rows={3}
              className="w-full bg-transparent outline-none text-sm resize-none px-4 pt-3 pb-1 min-h-[88px] max-h-[240px] placeholder:text-muted-foreground/70"
            />
            <div className="flex items-center justify-between px-2 pb-2">
              <div className="flex items-center gap-0.5 text-muted-foreground">
                {triggers.map((t) => {
                  const Icon = t.icon;
                  return (
                    <button
                      key={t.k}
                      onClick={() => {
                        if (t.k === "image") imgRef.current?.click();
                        else setSub(t.k);
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
                  onClick={onClose}
                  className="h-8 px-3 rounded-md text-xs text-muted-foreground hover:bg-accent"
                >
                  取消
                </button>
                <button
                  onClick={confirm}
                  disabled={!query.trim() && !attachments.length && !note.trim()}
                  className="shrink-0 inline-flex items-center justify-center h-8 px-3 gap-1 rounded-md bg-foreground text-background text-xs hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed transition"
                  title="确认新增"
                >
                  <ArrowUp className="h-3.5 w-3.5" />
                  添加样本
                </button>
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

        {sub && (
          <div
            className="fixed inset-0 z-[60] bg-black/30 flex items-center justify-center"
            onClick={() => setSub(null)}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="w-[520px] max-w-[92vw] rounded-lg bg-background border border-border shadow-xl"
            >
              <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                <div className="text-sm font-semibold">
                  {sub === "note" && "附加笔记"}
                  {sub === "share" && "分享内容"}
                  {sub === "bulk" && "批量上传"}
                </div>
                <button onClick={() => setSub(null)} className="p-1 rounded hover:bg-accent">
                  <X className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              </div>
              <div className="p-4 space-y-3">
                {sub === "note" && (
                  <>
                    <textarea
                      autoFocus
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="输入笔记/补充说明……"
                      className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-[var(--console-orange)] resize-none min-h-[140px]"
                    />
                    <div className="flex justify-end">
                      <button
                        onClick={() => setSub(null)}
                        className="h-8 px-3 rounded-md bg-foreground text-background text-xs"
                      >
                        完成
                      </button>
                    </div>
                  </>
                )}
                {sub === "share" && (
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
                          <input
                            value={shareFields[f.key] ?? ""}
                            onChange={(e) =>
                              setShareFields((s) => ({ ...s, [f.key]: e.target.value }))
                            }
                            className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-xs outline-none focus:border-[var(--console-orange)]"
                          />
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-end pt-1">
                      <button
                        onClick={addShare}
                        className="h-8 px-3 rounded-md bg-foreground text-background text-xs"
                      >
                        添加
                      </button>
                    </div>
                  </>
                )}
                {sub === "bulk" && (
                  <>
                    <div className="flex items-center gap-1 border-b border-border">
                      {(["note", "image"] as const).map((t) => (
                        <button
                          key={t}
                          onClick={() => setBulkTab(t)}
                          className={`px-3 py-1.5 text-xs border-b-2 -mb-px transition ${
                            bulkTab === t
                              ? "border-[var(--console-orange)] text-foreground"
                              : "border-transparent text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          {t === "note" ? "笔记 ID" : "图片 URL"}
                        </button>
                      ))}
                    </div>
                    {bulkTab === "note" ? (
                      <textarea
                        autoFocus
                        value={bulkNoteIds}
                        onChange={(e) => setBulkNoteIds(e.target.value)}
                        placeholder="多个用换行或逗号分隔"
                        className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs outline-none focus:border-[var(--console-orange)] resize-none min-h-[120px]"
                      />
                    ) : (
                      <textarea
                        autoFocus
                        value={bulkImageUrls}
                        onChange={(e) => setBulkImageUrls(e.target.value)}
                        placeholder="多个 URL 用换行或逗号分隔"
                        className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs outline-none focus:border-[var(--console-orange)] resize-none min-h-[120px]"
                      />
                    )}
                    <div className="flex justify-end">
                      <button
                        onClick={addBulk}
                        className="h-8 px-3 rounded-md bg-foreground text-background text-xs"
                      >
                        添加
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
