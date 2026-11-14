import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { CalendarDays, Settings, Timer, Trophy, Heart } from "lucide-react";
import { useLiveSync, useProfiles } from "@/hooks/use-yks";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/bugun", label: "Bugün", icon: Timer },
  { to: "/takvim", label: "Takvim", icon: CalendarDays },
  { to: "/denemeler", label: "Denemeler", icon: Trophy },
  { to: "/ayarlar", label: "Ayarlar", icon: Settings },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  useLiveSync();
  const { me, partner } = useProfiles();

  return (
    <div className="min-h-screen pb-28 md:pb-12">
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/75 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
          <Link to="/bugun" className="flex items-center gap-2">
            <span className="grid size-9 place-items-center rounded-xl bg-gradient-primary text-primary-foreground shadow-glow">
              <Heart className="size-4" fill="currentColor" />
            </span>
            <span className="font-display text-xl font-semibold">YKS İkilisi</span>
          </Link>

          <nav className="hidden items-center gap-1 rounded-full border border-border bg-card/70 p-1 md:flex">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                activeProps={{ className: "bg-primary text-primary-foreground hover:text-primary-foreground" }}
              >
                <item.icon className="size-4" />
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2 text-sm">
            {me && <Avatar name={me.display_name} tone="me" />}
            {partner ? (
              <Avatar name={partner.display_name} tone="partner" />
            ) : (
              <Link to="/ayarlar" className="rounded-full border border-dashed border-border px-3 py-1 text-xs text-muted-foreground hover:text-foreground">
                + Partner ekle
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 md:py-10">{children}</main>

      <nav className="fixed inset-x-3 bottom-3 z-30 grid grid-cols-4 rounded-2xl border border-border bg-card/90 p-1.5 shadow-soft backdrop-blur-md md:hidden">
        {NAV.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className="flex flex-col items-center gap-0.5 rounded-xl py-2 text-[11px] font-medium text-muted-foreground"
            activeProps={{ className: "bg-primary text-primary-foreground" }}
          >
            <item.icon className="size-5" />
            {item.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}

export function Avatar({ name, tone, className }: { name: string; tone: "me" | "partner"; className?: string }) {
  return (
    <span
      title={name}
      className={cn(
        "grid size-8 place-items-center rounded-full text-xs font-bold ring-2 ring-background",
        tone === "me" ? "bg-primary text-primary-foreground" : "bg-partner text-partner-foreground",
        className,
      )}
    >
      {name.slice(0, 1).toLocaleUpperCase("tr")}
    </span>
  );
}
