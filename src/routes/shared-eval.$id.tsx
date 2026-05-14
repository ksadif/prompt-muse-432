import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Bot, ImageIcon, StickyNote, Sparkles, ArrowLeft } from "lucide-react";
import type { EvalRow } from "@/components/console/mockData";

type Snapshot = {
  createdAt: string;
  testSetName: string;
  versions: { id: string; name: string }[];
  extraKeys: string[];
  rows: EvalRow[];
};

export const Route = createFileRoute("/shared-eval/$id")({
  component: SharedEvalPage,
});

function SharedEvalPage() {
  const { id } = Route.useParams();
  const [snap, setSnap] = useState<Snapshot | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(`shared-eval:${id}`);
      if (raw) setSnap(JSON.parse(raw));
    } catch {
      /* ignore */
    }
    setLoaded(true);
  }, [id]);

  if (!loaded) return null;

  if (!snap) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 text-center px-6">
        <h1 className="text-xl font-semibold">分享链接无效</h1>
        <p className="text-sm text-muted-foreground">
          该分享数据不存在或已被清除（数据保存在生成时所用的浏览器里）。
        </p>
        <Link to="/" className="text-sm text-[var(--console-orange)] hover:underline">
          ← 返回工作台
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b border-border bg-background/90 backdrop-blur px-6 py-3 flex items-center gap-3">
        <Link
          to="/"
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3 w-3" /> 返回工作台
        </Link>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold truncate">
            评估结果分享 · {snap.testSetName}
          </div>
          <div className="text-[11px] text-muted-foreground">
            生成于 {new Date(snap.createdAt).toLocaleString()} · 共 {snap.rows.length} 个样本 · {snap.versions.length} 个版本
          </div>
        </div>
      </header>

      <div className="p-6 space-y-6">
        {snap.rows.map((r) => (
          <div key={r.id} className="rounded-lg border border-border bg-background overflow-hidden">
            <div className="px-4 py-2.5 border-b border-border bg-muted/30 flex items-center gap-2">
              <span className="text-[11px] font-medium text-muted-foreground">#{r.id}</span>
              <div className="text-sm flex-1 min-w-0 truncate">{r.input || "（空输入）"}</div>
            </div>

            <div className="px-4 py-3 space-y-1.5 border-b border-border">
              <div className="flex justify-end">
                <div className="max-w-[80%] rounded-2xl rounded-tr-sm bg-[var(--console-cta)] text-[var(--console-cta-foreground)] px-3 py-2 text-xs whitespace-pre-wrap break-words">
                  {r.input || "（无输入文本）"}
                </div>
              </div>
              {r.extras["输入图片"] && r.extras["输入图片"] !== "-" && (
                <div className="flex justify-end">
                  <div className="max-w-[80%] rounded-2xl rounded-tr-sm bg-[var(--console-cta)] text-[var(--console-cta-foreground)] px-3 py-2 text-xs flex items-start gap-1.5">
                    <ImageIcon className="h-3 w-3 mt-0.5 opacity-80" />
                    <span className="break-words">{r.extras["输入图片"]}</span>
                  </div>
                </div>
              )}
              {r.extras["输入笔记"] && r.extras["输入笔记"] !== "-" && (
                <div className="flex justify-end">
                  <div className="max-w-[80%] rounded-2xl rounded-tr-sm bg-[var(--console-cta)] text-[var(--console-cta-foreground)] px-3 py-2 text-xs flex items-start gap-1.5">
                    <StickyNote className="h-3 w-3 mt-0.5 opacity-80" />
                    <span className="break-words">{r.extras["输入笔记"]}</span>
                  </div>
                </div>
              )}
            </div>

            <div
              className="grid gap-3 p-3"
              style={{ gridTemplateColumns: `repeat(${snap.versions.length}, minmax(280px, 1fr))` }}
            >
              {snap.versions.map((p, vi) => {
                const v = r.versions[vi];
                return (
                  <div key={p.id + vi} className="flex flex-col rounded-md border border-border overflow-hidden">
                    <div className="px-2.5 py-1.5 border-b border-border bg-muted/20 flex items-center gap-1.5">
                      <span className="inline-flex items-center rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                        v{vi + 1}
                      </span>
                      <span className="text-xs font-medium truncate">{p.name}</span>
                    </div>
                    <div className="p-3 flex-1">
                      {v?.output ? (
                        <div className="flex gap-2">
                          <div className="shrink-0 h-6 w-6 rounded-full bg-[var(--console-orange)]/15 flex items-center justify-center">
                            <Bot className="h-3.5 w-3.5 text-[var(--console-orange)]" />
                          </div>
                          <div className="rounded-2xl rounded-tl-sm border border-[var(--console-orange)]/40 bg-[var(--console-orange)]/5 px-3 py-2 text-xs whitespace-pre-wrap break-words">
                            {v.output}
                          </div>
                        </div>
                      ) : (
                        <div className="text-xs text-muted-foreground italic">未运行</div>
                      )}
                    </div>
                    {v && (
                      <div className="border-t border-border bg-[var(--console-orange)]/[0.04] px-2.5 py-2 text-[11px] flex items-center gap-2">
                        <Sparkles className="h-3 w-3 text-[var(--console-orange)]" />
                        <span className="font-medium">分数</span>
                        <span>{v.score ?? "—"}</span>
                        <span className="text-muted-foreground">·</span>
                        <span>{v.issueType ?? "无"}</span>
                        {v.note && (
                          <span className="text-muted-foreground truncate">· {v.note}</span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
