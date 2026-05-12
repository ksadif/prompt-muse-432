import { useState } from "react";
import { X, FileText, PenLine, Code2, MoreHorizontal } from "lucide-react";

export function GeneratePromptDialog({
  open,
  onClose,
  onGenerated,
}: {
  open: boolean;
  onClose: () => void;
  onGenerated: (prompt: string) => void;
}) {
  const [stage, setStage] = useState<"describe" | "result">("describe");
  const [task, setTask] = useState("");
  const [thinking, setThinking] = useState(false);
  const [result, setResult] = useState("");

  if (!open) return null;

  const presets = [
    { icon: FileText, label: "Summarize a document" },
    { icon: PenLine, label: "Write me an email" },
    { icon: Code2, label: "Translate code" },
  ];

  const handleGenerate = () => {
    const t = task.trim() || "Summarize a document";
    const generated =
      t.toLowerCase().includes("summar")
        ? `You will be summarizing a document into bullet points. Here is the document:\n\n<document>\n{{DOCUMENT}}\n</document>\n\nPlease summarize the key points from the document above into a concise bulleted list.`
        : `You will be helping with the following task: ${t}.\n\n<input>\n{{INPUT}}\n</input>\n\nProvide a clear, well-structured response.`;
    setResult(generated);
    setStage("result");
  };

  const handleClose = () => {
    setStage("describe");
    setTask("");
    setThinking(false);
    setResult("");
    onClose();
  };

  const handleContinue = () => {
    onGenerated(result);
    handleClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-[560px] rounded-2xl bg-[#F6F3EE] shadow-2xl p-8 relative">
        <button
          onClick={handleClose}
          className="absolute right-5 top-5 text-muted-foreground hover:text-foreground"
        >
          <X className="h-5 w-5" />
        </button>

        {stage === "describe" ? (
          <>
            <div className="text-center mb-6">
              <h2 className="text-[22px] font-semibold tracking-tight">Generate a prompt</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                You can generate a prompt template by sharing basic
                <br />
                details about your task.
              </p>
            </div>

            <div className="rounded-xl border border-border bg-background p-4 mb-4">
              <textarea
                value={task}
                onChange={(e) => setTask(e.target.value)}
                placeholder="Describe your task…"
                className="w-full min-h-[160px] bg-transparent text-sm outline-none resize-none placeholder:text-muted-foreground"
              />
            </div>

            <div className="flex items-center gap-2 mb-5">
              {presets.map(({ icon: Icon, label }) => (
                <button
                  key={label}
                  onClick={() => setTask(label)}
                  className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 text-xs hover:bg-accent"
                >
                  <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                  {label}
                </button>
              ))}
              <button className="inline-flex items-center justify-center rounded-md border border-border bg-background px-2 py-1.5 hover:bg-accent">
                <MoreHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            </div>

            <label className="flex items-center gap-2 text-sm text-foreground/90 mb-6 cursor-pointer">
              <input
                type="checkbox"
                checked={thinking}
                onChange={(e) => setThinking(e.target.checked)}
                className="h-4 w-4 rounded border-border"
              />
              This prompt will be used with models that have{" "}
              <span className="font-semibold">thinking</span> enabled
            </label>

            <div className="flex justify-center gap-3">
              <button
                onClick={handleClose}
                className="rounded-md border border-border bg-background px-5 py-2 text-sm hover:bg-accent"
              >
                Cancel
              </button>
              <button
                onClick={handleGenerate}
                className="rounded-md bg-foreground/70 text-background px-5 py-2 text-sm font-medium hover:bg-foreground"
              >
                Generate
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="text-center mb-6">
              <h2 className="text-[22px] font-semibold tracking-tight">Your prompt</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                You'll be able to make further changes and improvements later too.
              </p>
            </div>

            <div className="rounded-xl border border-border bg-background p-4 mb-6 max-h-[420px] overflow-auto">
              <pre className="whitespace-pre-wrap text-sm font-sans leading-relaxed">
                {result}
              </pre>
            </div>

            <div className="flex justify-center gap-3">
              <button
                onClick={() => setStage("describe")}
                className="rounded-md border border-border bg-background px-5 py-2 text-sm hover:bg-accent"
              >
                Cancel
              </button>
              <button
                onClick={handleContinue}
                className="rounded-md bg-foreground/70 text-background px-5 py-2 text-sm font-medium hover:bg-foreground"
              >
                Continue
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
