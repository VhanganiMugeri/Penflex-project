import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  TicketPlus,
  History,
  User,
  LogOut,
  Shield,
  Moon,
  Sun,
} from "lucide-react";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";

const workerNav = [
  { to: "/worker", label: "Dashboard", icon: LayoutDashboard },
  { to: "/worker/new", label: "New Ticket", icon: TicketPlus },
  { to: "/history", label: "History", icon: History },
  { to: "/profile", label: "Profile", icon: User },
];

const adminNav = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { to: "/history", label: "Ticket History", icon: History },
  { to: "/profile", label: "Profile", icon: User },
];

export function AppShell({ children }: { children: ReactNode }) {
  const { profile, role, signOut } = useAuth();
  const navigate = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const nav = role === "admin" ? adminNav : workerNav;

  const [dark, setDark] = useState(false);
  useEffect(() => {
    const stored = localStorage.getItem("theme") === "dark";
    setDark(stored);
    document.documentElement.classList.toggle("dark", stored);
  }, []);
  const toggleDark = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  };

  const handleSignOut = async () => {
    await signOut();
    navigate({ to: "/" });
  };

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden md:flex md:w-64 flex-col bg-sidebar text-sidebar-foreground">
        <div className="px-6 py-6 border-b border-sidebar-border">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-lg bg-sidebar-primary text-sidebar-primary-foreground grid place-items-center font-bold">P</div>
            <div>
              <div className="font-semibold tracking-tight">PENFLEX</div>
              <div className="text-xs opacity-70">Support System</div>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {nav.map((item) => {
            const active = path === item.to || (item.to !== "/worker" && item.to !== "/admin" && path.startsWith(item.to));
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  active
                    ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-soft"
                    : "hover:bg-sidebar-accent text-sidebar-foreground/90"
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t border-sidebar-border space-y-2">
          <div className="px-3 py-2 text-xs">
            <div className="flex items-center gap-2 mb-1">
              {role === "admin" && <Shield className="h-3 w-3" />}
              <span className="font-medium truncate">{profile?.full_name || "User"}</span>
            </div>
            <div className="opacity-60 capitalize">{role}</div>
          </div>
          <Button variant="ghost" size="sm" onClick={toggleDark} className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
            {dark ? <Sun className="h-4 w-4 mr-2" /> : <Moon className="h-4 w-4 mr-2" />}
            {dark ? "Light mode" : "Dark mode"}
          </Button>
          <Button variant="ghost" size="sm" onClick={handleSignOut} className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
            <LogOut className="h-4 w-4 mr-2" /> Sign out
          </Button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 inset-x-0 z-30 bg-sidebar text-sidebar-foreground px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-md bg-sidebar-primary text-sidebar-primary-foreground grid place-items-center font-bold text-sm">P</div>
          <span className="font-semibold text-sm">PENFLEX</span>
        </div>
        <div className="flex gap-1">
          <Button size="icon" variant="ghost" onClick={toggleDark} className="text-sidebar-foreground hover:bg-sidebar-accent">
            {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          <Button size="icon" variant="ghost" onClick={handleSignOut} className="text-sidebar-foreground hover:bg-sidebar-accent">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <main className="flex-1 md:p-8 p-4 pt-20 md:pt-8 overflow-x-hidden">
        <div className="max-w-7xl mx-auto">{children}</div>
        {/* Mobile bottom nav */}
        <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-sidebar text-sidebar-foreground border-t border-sidebar-border px-2 py-2 flex justify-around">
          {nav.map((item) => {
            const Icon = item.icon;
            const active = path === item.to;
            return (
              <Link key={item.to} to={item.to} className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-md text-[10px] ${active ? "bg-sidebar-primary text-sidebar-primary-foreground" : ""}`}>
                <Icon className="h-4 w-4" /> {item.label}
              </Link>
            );
          })}
        </nav>
      </main>
    </div>
  );
}
