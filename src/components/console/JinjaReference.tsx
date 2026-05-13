import { useState } from "react";
import { Copy, Check } from "lucide-react";

const MAIN_VARS = [
  { name: "{{ query }}", desc: "用户查询文本" },
  { name: "{{ reference_str }}", desc: "预格式化 reference 字符串" },
  { name: "{{ reference }}", desc: "原始 reference 列表，可遍历" },
  { name: "{{ reference_data }}", desc: "同 reference（兼容别名）" },
  { name: "{{ user_memory }}", desc: "用户记忆（未开启为空）" },
];

const POST_VARS = [
  { name: "{{ query }}", desc: "用户查询文本" },
  { name: "{{ answer }}", desc: "待后处理的 LLM 回答" },
];

const NOTE_FIELDS = [
  "title",
  "content",
  "note_id",
  "image_list",
  "createTime",
  "create_time",
  "comments",
  "commentsText",
  "comments_rendered",
  "ocr",
  "mm_ocr_result",
  "asrResult",
  "asr_result",
];

const SNIPPETS: { title: string; code: string }[] = [
  {
    title: "条件判断 reference",
    code: `{% if reference %}
... 有 reference 时的内容 ...
{% else %}
暂无搜索结果
{% endif %}`,
  },
  {
    title: "遍历 reference（基础）",
    code: `{% for note in (reference or [])[:14] %}
第{{ loop.index }}篇：{{ note.title }}
内容：{{ note.content }}
{% endfor %}`,
  },
];

function CopyChip({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1200);
      }}
      className="inline-flex items-center gap-1 rounded bg-[var(--console-orange)]/10 text-[var(--console-orange)] px-2 py-0.5 font-mono text-[11px] hover:bg-[var(--console-orange)]/20"
      title="点击复制"
    >
      {copied ? <Check className="h-3 w-3" /> : null}
      {text}
    </button>
  );
}

export function JinjaReference() {
  return (
    <div className="space-y-5 text-sm">
      <section>
        <h4 className="text-[13px] font-semibold mb-2">主模板变量</h4>
        <div className="rounded-md border border-border overflow-hidden">
          <div className="grid grid-cols-[1fr_1fr] text-[11px] text-muted-foreground bg-muted/40 px-3 py-1.5">
            <span>变量</span>
            <span>说明</span>
          </div>
          {MAIN_VARS.map((v) => (
            <div
              key={v.name}
              className="grid grid-cols-[1fr_1fr] items-center px-3 py-1.5 border-t border-border"
            >
              <CopyChip text={v.name} />
              <span className="text-xs text-muted-foreground">{v.desc}</span>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h4 className="text-[13px] font-semibold mb-2">后处理模板变量</h4>
        <div className="rounded-md border border-border overflow-hidden">
          {POST_VARS.map((v, i) => (
            <div
              key={v.name}
              className={`grid grid-cols-[1fr_1fr] items-center px-3 py-1.5 ${
                i ? "border-t border-border" : ""
              }`}
            >
              <CopyChip text={v.name} />
              <span className="text-xs text-muted-foreground">{v.desc}</span>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h4 className="text-[13px] font-semibold mb-2">reference 笔记字段</h4>
        <div className="flex flex-wrap gap-1.5">
          {NOTE_FIELDS.map((f) => (
            <CopyChip key={f} text={f} />
          ))}
        </div>
      </section>

      <section>
        <h4 className="text-[13px] font-semibold mb-2">代码片段（点击复制）</h4>
        <div className="space-y-3">
          {SNIPPETS.map((s) => (
            <div key={s.title}>
              <div className="text-xs text-muted-foreground mb-1">{s.title}</div>
              <button
                onClick={() => navigator.clipboard.writeText(s.code)}
                className="group relative w-full text-left rounded-md border border-border bg-muted/40 hover:bg-muted/60 p-2.5 font-mono text-[11px] leading-relaxed whitespace-pre"
              >
                {s.code}
                <Copy className="absolute right-2 top-2 h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100" />
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
