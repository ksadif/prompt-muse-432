import { createFileRoute, Outlet } from "@tanstack/react-router";
import { Sidebar } from "@/components/console/Sidebar";

export const Route = createFileRoute("/_console")({
  component: ConsoleLayout,
});

function ConsoleLayout() {
  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar />
      <main className="flex-1 min-w-0">
        <Outlet />
      </main>
    </div>
  );
}
