"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signIn, signOut } from "next-auth/react";
import {
  LayoutDashboard,
  Timer,
  Dumbbell,
  Home,
  BarChart3,
  LogIn,
  LogOut,
} from "lucide-react";

const navItems = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Work Blocks", href: "/work-blocks", icon: Timer },
  { label: "Contest Prep", href: "/contest-prep", icon: Dumbbell },
  { label: "Household", href: "/household", icon: Home },
  { label: "Weekly Retro", href: "/weekly-retro", icon: BarChart3 },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session, status } = useSession();

  return (
    <aside className="hidden md:flex md:flex-col md:w-56 md:fixed md:inset-y-0 bg-surface border-r border-border">
      <div className="flex items-center gap-2 px-5 py-5 border-b border-border">
        <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center">
          <LayoutDashboard className="w-4 h-4 text-accent" />
        </div>
        <span className="font-semibold text-sm tracking-tight">Command Center</span>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                isActive
                  ? "bg-accent/10 text-accent"
                  : "text-muted hover:text-foreground hover:bg-surface-hover"
              }`}
            >
              <Icon className="w-4 h-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Auth section */}
      <div className="px-3 py-4 border-t border-border">
        {status === "loading" ? (
          <div className="px-3 py-2 text-xs text-muted">Loading...</div>
        ) : session?.user ? (
          <div className="space-y-2">
            <div className="px-3">
              <div className="text-sm font-medium truncate">{session.user.name}</div>
              <div className="text-xs text-muted truncate">{session.user.email}</div>
            </div>
            <button
              onClick={() => signOut()}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted hover:text-foreground hover:bg-surface-hover transition-colors w-full"
            >
              <LogOut className="w-4 h-4" />
              Sign out
            </button>
          </div>
        ) : (
          <button
            onClick={() => signIn("google")}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-accent hover:bg-accent/10 transition-colors w-full"
          >
            <LogIn className="w-4 h-4" />
            Sign in with Google
          </button>
        )}
      </div>
    </aside>
  );
}
