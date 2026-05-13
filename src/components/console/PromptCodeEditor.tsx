import { useMemo, useRef, useState, useEffect } from "react";

type Token = { text: string; cls: string };

// 高亮规则：变量、标题、加粗、行内代码、列表标记、引用、链接
function tokenize(line: string): Token[] {
  const patterns: { re: RegExp; cls: string }[] = [
    { re: /\{\{[^}]+\}\}/g, cls: "text-[var(--console-orange)] font-medium" },
    { re: /`[^`]+`/g, cls: "bg-[var(--console-active)] text-foreground rounded px-1" },
    { re: /\*\*[^*]+\*\*/g, cls: "font-bold text-foreground" },
    { re: /\[[^\]]+\]\([^)]+\)/g, cls: "text-sky-600 underline" },
    { re: /@[A-Za-z0-9_-]+/g, cls: "text-violet-600" },
  ];

  type Mark = { start: number; end: number; cls: string };
  const marks: Mark[] = [];
  for (const { re, cls } of patterns) {
    let m: RegExpExecArray | null;
    const r = new RegExp(re.source, re.flags);
    while ((m = r.exec(line))) {
      marks.push({ start: m.index, end: m.index + m[0].length, cls });
    }
  }
  marks.sort((a, b) => a.start - b.start);

  // 处理行首：标题 / 列表 / 引用
  let prefixCls = "";
  let prefixLen = 0;
  const heading = /^(#{1,6})\s/.exec(line);
  const list = /^(\s*)([-*]|\d+\.)\s/.exec(line);
  const quote = /^>\s?/.exec(line);
  if (heading) {
    prefixLen = line.length;
    prefixCls = "font-semibold text-foreground";
    const level = heading[1].length;
    if (level <= 2) prefixCls += " text-[15px]";
  } else if (quote) {
    prefixLen = line.length;
    prefixCls = "text-muted-foreground italic";
  } else if (list) {
    prefixLen = list[0].length;
    prefixCls = "text-[var(--console-orange)]";
  }

  const tokens: Token[] = [];
  let i = 0;
  if (prefixCls && prefixLen > 0) {
    if (heading || quote) {
      tokens.push({ text: line, cls: prefixCls });
      return tokens;
    }
    tokens.push({ text: line.slice(0, prefixLen), cls: prefixCls });
    i = prefixLen;
  }

  for (const mk of marks) {
    if (mk.start < i) continue;
    if (mk.start > i) tokens.push({ text: line.slice(i, mk.start), cls: "" });
    tokens.push({ text: line.slice(mk.start, mk.end), cls: mk.cls });
    i = mk.end;
  }
  if (i < line.length) tokens.push({ text: line.slice(i), cls: "" });
  if (tokens.length === 0) tokens.push({ text: "", cls: "" });
  return tokens;
}

export function PromptCodeEditor({
  value,
  onChange,
  placeholder,
  minRows = 12,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  minRows?: number;
}) {
  const taRef = useRef<HTMLTextAreaElement>(null);
  const preRef = useRef<HTMLDivElement>(null);
  const gutterRef = useRef<HTMLDivElement>(null);
  const [activeLine, setActiveLine] = useState(0);

  const lines = useMemo(() => value.split("\n"), [value]);

  const updateActiveLine = () => {
    const ta = taRef.current;
    if (!ta) return;
    const before = ta.value.slice(0, ta.selectionStart);
    setActiveLine(before.split("\n").length - 1);
  };

  useEffect(() => {
    const ta = taRef.current;
    if (!ta) return;
    const onSel = () => updateActiveLine();
    ta.addEventListener("keyup", onSel);
    ta.addEventListener("click", onSel);
    return () => {
      ta.removeEventListener("keyup", onSel);
      ta.removeEventListener("click", onSel);
    };
  }, []);

  const onScroll = () => {
    if (!taRef.current) return;
    const t = taRef.current.scrollTop;
    if (preRef.current) preRef.current.scrollTop = t;
    if (gutterRef.current) gutterRef.current.scrollTop = t;
  };

  const setSelection = (ta: HTMLTextAreaElement, start: number, end = start) => {
    requestAnimationFrame(() => {
      ta.selectionStart = start;
      ta.selectionEnd = end;
      updateActiveLine();
    });
  };

  // 取得选区覆盖的整行范围
  const getLineRange = (val: string, s: number, e: number) => {
    const start = val.lastIndexOf("\n", s - 1) + 1;
    const endIdx = val.indexOf("\n", e);
    const end = endIdx === -1 ? val.length : endIdx;
    return { start, end };
  };

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const ta = e.currentTarget;
    const s = ta.selectionStart;
    const en = ta.selectionEnd;
    const isMod = e.metaKey || e.ctrlKey;

    // Cmd/Ctrl + ] / [  → 行级缩进 / 反缩进
    if (isMod && (e.key === "]" || e.key === "[")) {
      e.preventDefault();
      const { start, end } = getLineRange(value, s, en);
      const block = value.slice(start, end);
      const lines = block.split("\n");
      let delta = 0;
      const newLines = lines.map((ln) => {
        if (e.key === "]") {
          delta += 2;
          return "  " + ln;
        }
        const m = /^( {1,2}|\t)/.exec(ln);
        if (m) {
          delta -= m[0].length;
          return ln.slice(m[0].length);
        }
        return ln;
      });
      const next = value.slice(0, start) + newLines.join("\n") + value.slice(end);
      onChange(next);
      setSelection(ta, s + (lines.length ? (e.key === "]" ? 2 : -Math.min(2, lines[0].length - newLines[0].length === 0 ? 0 : 2)) : 0), en + delta);
      return;
    }

    if (e.key === "Tab") {
      e.preventDefault();
      // 多行选区 → 整块缩进 / Shift+Tab 反缩进
      if (s !== en && value.slice(s, en).includes("\n")) {
        const { start, end } = getLineRange(value, s, en);
        const lines = value.slice(start, end).split("\n");
        let head = 0;
        let total = 0;
        const newLines = lines.map((ln, i) => {
          if (e.shiftKey) {
            const m = /^( {1,2}|\t)/.exec(ln);
            if (m) {
              if (i === 0) head -= m[0].length;
              total -= m[0].length;
              return ln.slice(m[0].length);
            }
            return ln;
          }
          if (i === 0) head += 2;
          total += 2;
          return "  " + ln;
        });
        const next = value.slice(0, start) + newLines.join("\n") + value.slice(end);
        onChange(next);
        setSelection(ta, s + head, en + total);
        return;
      }
      if (e.shiftKey) {
        // 单行 Shift+Tab：去掉行首两空格
        const lineStart = value.lastIndexOf("\n", s - 1) + 1;
        const head = value.slice(lineStart, lineStart + 2);
        if (head === "  ") {
          const next = value.slice(0, lineStart) + value.slice(lineStart + 2);
          onChange(next);
          setSelection(ta, Math.max(lineStart, s - 2));
        }
        return;
      }
      const next = value.slice(0, s) + "  " + value.slice(en);
      onChange(next);
      setSelection(ta, s + 2);
      return;
    }

    // Enter：自动延续缩进 / 列表 / 引用 / 标题降级
    if (e.key === "Enter" && !e.shiftKey && !isMod) {
      const lineStart = value.lastIndexOf("\n", s - 1) + 1;
      const lineEnd = value.indexOf("\n", s);
      const curLine = value.slice(lineStart, lineEnd === -1 ? value.length : lineEnd);
      const indentMatch = /^(\s*)/.exec(curLine);
      const indent = indentMatch ? indentMatch[1] : "";

      // 列表：- / * / 1.
      const bullet = /^(\s*)([-*])\s(\[[ xX]\]\s)?(.*)$/.exec(curLine);
      const ordered = /^(\s*)(\d+)\.\s(.*)$/.exec(curLine);

      if (bullet) {
        const [, ind, mark, task, body] = bullet;
        // 空项 → 退出列表
        if (!body.trim()) {
          e.preventDefault();
          const next = value.slice(0, lineStart) + value.slice(s);
          onChange(next);
          setSelection(ta, lineStart);
          return;
        }
        e.preventDefault();
        const insert = "\n" + ind + mark + " " + (task ? "[ ] " : "");
        const next = value.slice(0, s) + insert + value.slice(en);
        onChange(next);
        setSelection(ta, s + insert.length);
        return;
      }
      if (ordered) {
        const [, ind, num, body] = ordered;
        if (!body.trim()) {
          e.preventDefault();
          const next = value.slice(0, lineStart) + value.slice(s);
          onChange(next);
          setSelection(ta, lineStart);
          return;
        }
        e.preventDefault();
        const insert = "\n" + ind + (parseInt(num, 10) + 1) + ". ";
        const next = value.slice(0, s) + insert + value.slice(en);
        onChange(next);
        setSelection(ta, s + insert.length);
        return;
      }
      // 引用 >
      if (/^>\s?/.test(curLine)) {
        if (!curLine.replace(/^>\s?/, "").trim()) {
          e.preventDefault();
          const next = value.slice(0, lineStart) + value.slice(s);
          onChange(next);
          setSelection(ta, lineStart);
          return;
        }
        e.preventDefault();
        const insert = "\n" + (curLine.startsWith("> ") ? "> " : ">");
        const next = value.slice(0, s) + insert + value.slice(en);
        onChange(next);
        setSelection(ta, s + insert.length);
        return;
      }
      // 标题：回车后回到正文
      if (/^#{1,6}\s/.test(curLine)) {
        e.preventDefault();
        const insert = "\n" + indent;
        const next = value.slice(0, s) + insert + value.slice(en);
        onChange(next);
        setSelection(ta, s + insert.length);
        return;
      }
      // 普通行：保留缩进
      if (indent) {
        e.preventDefault();
        const insert = "\n" + indent;
        const next = value.slice(0, s) + insert + value.slice(en);
        onChange(next);
        setSelection(ta, s + insert.length);
        return;
      }
    }
  };

  const minHeight = `${minRows * 1.6}em`;

  return (
    <div className="flex font-mono text-[13px] leading-[1.6] bg-background">
      {/* 行号 */}
      <div
        ref={gutterRef}
        className="select-none overflow-hidden py-3 pl-3 pr-2 text-right text-muted-foreground/60 border-r border-border bg-muted/30"
        style={{ minWidth: 44 }}
      >
        {lines.map((_, i) => (
          <div
            key={i}
            className={
              i === activeLine ? "text-[var(--console-orange)] font-medium" : ""
            }
          >
            {i + 1}
          </div>
        ))}
      </div>

      {/* 编辑区 */}
      <div className="relative flex-1 min-w-0" style={{ minHeight }}>
        {/* 当前行高亮背景 */}
        <div
          aria-hidden
          className="absolute left-0 right-0 bg-[var(--console-active)]/40 pointer-events-none"
          style={{
            top: `calc(0.75rem + ${activeLine} * 1.6em)`,
            height: "1.6em",
            transform: `translateY(${-((preRef.current?.scrollTop) ?? 0)}px)`,
          }}
        />
        {/* 高亮层 */}
        <div
          ref={preRef}
          aria-hidden
          className="absolute inset-0 overflow-auto whitespace-pre-wrap break-words py-3 px-4 pointer-events-none"
        >
          {lines.map((ln, i) => {
            const toks = tokenize(ln);
            return (
              <div key={i}>
                {toks.map((t, j) => (
                  <span key={j} className={t.cls}>
                    {t.text || "\u200b"}
                  </span>
                ))}
              </div>
            );
          })}
          <div>{"\u200b"}</div>
        </div>
        {/* 输入层 */}
        <textarea
          ref={taRef}
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            requestAnimationFrame(updateActiveLine);
          }}
          onScroll={onScroll}
          onKeyDown={handleKey}
          spellCheck={false}
          placeholder={placeholder}
          className="absolute inset-0 w-full h-full bg-transparent outline-none resize-none whitespace-pre-wrap break-words py-3 px-4 caret-[var(--console-orange)] text-transparent placeholder:text-muted-foreground/70"
          style={{ WebkitTextFillColor: "transparent" }}
        />
      </div>
    </div>
  );
}
