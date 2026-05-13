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

function useCopy() {
  const [copied, setCopied] = useState(false);
  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  };
  return { copied, copy };
}

function VarRow({ name, desc }: { name: string; desc: string }) {
  const { copied, copy } = useCopy();
  return (
    <div className="group flex items-center justify-between gap-3 px-3 py-2 border-t border-border first:border-t-0 hover:bg-muted/40">
      <div className="flex items-center gap-2 min-w-0">
        <code className="font-mono text-[12px] text-[var(--console-orange)] truncate">{name}</code>
        <span className="text-xs text-muted-foreground truncate">{desc}</span>
      </div>
      <button
        onClick={() => copy(name)}
        className="shrink-0 inline-flex items-center gap-1 rounded-md border border-border bg-background px-2 py-1 text-[11px] text-muted-foreground hover:text-foreground hover:border-[var(--console-orange)] hover:text-[var(--console-orange)] transition"
        title="复制"
      >
        {copied ? (
          <>
            <Check className="h-3 w-3" /> 已复制
          </>
        ) : (
          <>
            <Copy className="h-3 w-3" /> 复制
          </>
        )}
      </button>
    </div>
  );
}

function FieldChip({ text }: { text: string }) {
  const { copied, copy } = useCopy();
  return (
    <button
      onClick={() => copy(text)}
      className="inline-flex items-center gap-1 rounded-md border border-border bg-muted/40 hover:bg-[var(--console-orange)]/10 hover:border-[var(--console-orange)]/40 px-2 py-1 font-mono text-[11px] text-foreground transition"
      title="点击复制"
    >
      {copied ? (
        <Check className="h-3 w-3 text-[var(--console-orange)]" />
      ) : (
        <Copy className="h-3 w-3 text-muted-foreground" />
      )}
      {text}
    </button>
  );
}

function SnippetBlock({ title, code }: { title: string; code: string }) {
  const { copied, copy } = useCopy();
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-muted-foreground">{title}</span>
        <button
          onClick={() => copy(code)}
          className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2 py-0.5 text-[11px] text-muted-foreground hover:text-[var(--console-orange)] hover:border-[var(--console-orange)] transition"
        >
          {copied ? (
            <>
              <Check className="h-3 w-3" /> 已复制
            </>
          ) : (
            <>
              <Copy className="h-3 w-3" /> 复制全部
            </>
          )}
        </button>
      </div>
      <pre
        onClick={() => copy(code)}
        className="cursor-pointer rounded-md border border-border bg-muted/40 hover:bg-muted/60 p-2.5 font-mono text-[11px] leading-relaxed whitespace-pre overflow-x-auto"
        title="点击复制全部"
      >
        {code}
      </pre>
    </div>
  );
}

export function JinjaReference() {
  return (
    <div className="space-y-5 text-sm">
      <section>
        <h4 className="text-[13px] font-semibold mb-2">主模板变量</h4>
        <div className="rounded-md border border-border overflow-hidden">
          {MAIN_VARS.map((v) => (
            <VarRow key={v.name} name={v.name} desc={v.desc} />
          ))}
        </div>
      </section>

      <section>
        <h4 className="text-[13px] font-semibold mb-2">后处理模板变量</h4>
        <div className="rounded-md border border-border overflow-hidden">
          {POST_VARS.map((v) => (
            <VarRow key={v.name} name={v.name} desc={v.desc} />
          ))}
        </div>
      </section>

      <section>
        <h4 className="text-[13px] font-semibold mb-2">reference 笔记字段</h4>
        <p className="text-[11px] text-muted-foreground mb-2">点击任意字段即可复制</p>
        <div className="flex flex-wrap gap-1.5">
          {NOTE_FIELDS.map((f) => (
            <FieldChip key={f} text={f} />
          ))}
        </div>
      </section>

      <section>
        <h4 className="text-[13px] font-semibold mb-2">代码片段</h4>
        <div className="space-y-3">
          {SNIPPETS.map((s) => (
            <SnippetBlock key={s.title} title={s.title} code={s.code} />
          ))}
        </div>
      </section>
    </div>
  );
}
