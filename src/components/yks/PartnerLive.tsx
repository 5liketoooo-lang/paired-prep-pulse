import { Link } from "@tanstack/react-router";
import { useNow, type Profile } from "@/hooks/use-yks";
import { formatClock, formatDuration, timerElapsed, timerStatus } from "@/lib/yks";
import { Avatar } from "./AppShell";

export function PartnerLive({ partner, todaySeconds }: { partner: Profile | null; todaySeconds: number }) {
  const status = partner ? timerStatus(partner) : "idle";
  const now = useNow(status === "running");

  if (!partner) {
    return (
      <div className="surface flex flex-col items-start gap-3 p-6">
        <p className="font-display text-xl">Partnerini bağla 💞</p>
        <p className="text-sm text-muted-foreground">
          Ayarlar'daki eşleşme kodunu kız arkadaşınla paylaş; birbirinizin çalışmasını canlı görün.
        </p>
        <Link to="/ayarlar" className="text-sm font-semibold text-primary underline-offset-4 hover:underline">
          Eşleşme koduna git →
        </Link>
      </div>
    );
  }

  const goal = partner.daily_goal_minutes * 60;
  const pct = Math.min(100, Math.round((todaySeconds / Math.max(goal, 1)) * 100));

  return (
    <div className="surface p-6">
      <div className="flex items-center gap-3">
        <Avatar name={partner.display_name} tone="partner" className="size-10 text-sm" />
        <div className="min-w-0">
          <p className="truncate font-semibold">{partner.display_name}</p>
          <p className="text-xs text-muted-foreground">
            {status === "running" ? (
              <span className="inline-flex items-center gap-1.5">
                <span className="size-2 animate-pulse rounded-full bg-partner" /> Şu an {partner.active_subject} çalışıyor
              </span>
            ) : status === "paused" ? (
              `Mola veriyor · ${partner.active_subject}`
            ) : (
              "Şu an çalışmıyor"
            )}
          </p>
        </div>
      </div>
      {status !== "idle" && (
        <div className="mt-4 font-clock text-4xl font-semibold text-partner">{formatClock(timerElapsed(partner, now))}</div>
      )}
      <div className="mt-5">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Bugün</span>
          <span className="font-semibold">
            {formatDuration(todaySeconds)} <span className="text-muted-foreground">/ {formatDuration(goal)}</span>
          </span>
        </div>
        <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-partner transition-all" style={{ width: `${pct}%` }} />
        </div>
      </div>
    </div>
  );
}

export function GoalCard({ me, todaySeconds }: { me: Profile; todaySeconds: number }) {
  const status = timerStatus(me);
  const now = useNow(status === "running");
  const live = todaySeconds + (status !== "idle" ? timerElapsed(me, now) : 0);
  const goal = me.daily_goal_minutes * 60;
  const pct = Math.min(100, Math.round((live / Math.max(goal, 1)) * 100));
  const r = 52;
  const c = 2 * Math.PI * r;

  return (
    <div className="surface flex items-center gap-5 p-6">
      <svg viewBox="0 0 120 120" className="size-28 shrink-0 -rotate-90">
        <circle cx="60" cy="60" r={r} className="fill-none stroke-muted" strokeWidth="12" />
        <circle
          cx="60"
          cy="60"
          r={r}
          className="fill-none stroke-primary transition-all duration-700"
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c - (c * pct) / 100}
        />
      </svg>
      <div>
        <p className="text-sm text-muted-foreground">Bugünkü hedefin</p>
        <p className="font-display text-3xl font-semibold">%{pct}</p>
        <p className="text-sm">
          {formatDuration(live)} <span className="text-muted-foreground">/ {formatDuration(goal)}</span>
        </p>
      </div>
    </div>
  );
}
