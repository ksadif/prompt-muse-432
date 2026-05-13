import { X } from "lucide-react";

export function LeftDrawer({
  open,
  title,
  onClose,
  children,
  width = 340,
  headerExtra,
}: {
  open: boolean;
  title: React.ReactNode;
  onClose: () => void;
  children: React.ReactNode;
  width?: number;
  headerExtra?: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30" onClick={onClose} />
      <aside
        className="fixed left-0 top-0 z-50 h-screen bg-background border-r border-border shadow-xl flex flex-col"
        style={{ width }}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h3 className="text-sm font-semibold flex items-center gap-2">{title}</h3>
          <div className="flex items-center gap-2">
            {headerExtra}
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-3">{children}</div>
      </aside>
    </>
  );
}
