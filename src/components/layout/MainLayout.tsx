import { useState } from "react";
import { Outlet, Navigate } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, Menu } from "lucide-react";
import { cn } from "@/lib/utils";

export function MainLayout() {
  const { isAuthenticated, isLoading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin mx-auto text-primary" />
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-[50] lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      {/* Mobile hamburger button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          setSidebarOpen(true);
        }}
        className={cn(
          "fixed top-4 left-4 z-[60] lg:hidden p-2 rounded-lg bg-sidebar text-sidebar-foreground shadow-lg hover:bg-sidebar-accent transition-all duration-200",
          sidebarOpen && "hidden"
        )}
        aria-label="Open menu"
        type="button"
      >
        <Menu className="w-6 h-6" />
      </button>
      <main className="lg:ml-64 min-h-screen transition-all duration-300 max-w-full overflow-x-hidden">
        <div className="p-4 sm:p-6 min-w-0">
          <Outlet context={{ setSidebarOpen }} />
        </div>
      </main>
    </div>
  );
}
