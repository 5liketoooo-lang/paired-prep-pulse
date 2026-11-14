import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { tr } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDayNotes, useExams, useProfiles, useSessions, type Exam, type Profile, type StudySession } from "@/hooks/use-yks";
import { PageSkeleton } from "@/components/yks/PageSkeleton";
import { SessionList } from "@/components/yks/SessionList";
import { ManualSessionDialog } from "@/components/yks/ManualSessionDialog";
import { DayNote } from "@/components/yks/DayNote";
import { Avatar } from "@/components/yks/AppShell";
import { EXAM_LABEL, formatDuration, fromDateKey, toDateKey } from "@/lib/yks";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/takvim")({
  head: () => ({
    meta: [
      { title: "Takvim — YKS İkilisi" },
      { name: "description", content: "Aylık çalışma takvimi: seçtiğin günün tüm detaylarını gör." },
      { property: "og:title", content: "Takvim — YKS İkilisi" },
      { property: "og:description", content: "Aylık çalışma takvimi: seçtiğin günün tüm detaylarını gör." },
    ],
  }),
  component: CalendarPage,
});

const WEEKDAYS = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];

function CalendarPage() {
  const { me, partner, isLoading } = useProfiles();
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [selected, setSelected] = useState(() => toDateKey(new Date()));
  const [viewer, setViewer] = useState<"me" | "partner">("me");

  const from = toDateKey(startOfMonth(month));
  const to = toDateKey(endOfMonth(month));
  const { data: sessions = [] } = useSessions(from, to);
  const { data: exams = [] } = useExams();

  if (isLoading || !me) return <PageSkeleton />;

  const viewed = viewer === "partner" && partner ? partner : me;
  const tone = viewed.id === me.id ? "me" : "partner";

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Aylık görünüm</p>
          <h1 className="font-display text-3xl font-semibold capitalize md:text-4xl">{format(month, "MMMM yyyy", { locale: tr })}</h1>
        </div>
        <div className="flex items-center gap-2">
          {partner && (
            <div className="flex rounded-full border border-border bg-card p-1 text-sm">
              <button
                type="button"
                onClick={() => setViewer("me")}
                className={cn("rounded-full px-3 py-1.5 font-medium", viewer === "me" ? "bg-primary text-primary-foreground" : "text-muted-foreground")}
              >
                Ben
              </button>
              <button
                type="button"
                onClick={() => setViewer("partner")}
                className={cn("rounded-full px-3 py-1.5 font-medium", viewer === "partner" ? "bg-partner text-partner-foreground" : "text-muted-foreground")}
              >
                {partner.display_name}
              </button>
            </div>
          )}
          <Button variant="outline" size="icon" onClick={() => setMonth((m) => subMonths(m, 1))} aria-label="Önceki ay">
            <ChevronLeft />
          </Button>
          <Button variant="outline" size="sm" onClick={() => { setMonth(startOfMonth(new Date())); setSelected(toDateKey(new Date())); }}>
            Bugün
          </Button>
          <Button variant="outline" size="icon" onClick={() => setMonth((m) => addMonths(m, 1))} aria-label="Sonraki ay">
            <ChevronRight />
          </Button>
        </div>
      </div>

      <MonthStats sessions={sessions.filter((s) => s.user_id === viewed.id)} exams={exams.filter((e) => e.user_id === viewed.id && e.exam_date >= from && e.exam_date <= to)} tone={tone} />

      <div className="grid gap-6 lg:grid-cols-5">
        <section className="surface p-4 md:p-6 lg:col-span-3">
          <MonthGrid
            month={month}
            sessions={sessions.filter((s) => s.user_id === viewed.id)}
            exams={exams.filter((e) => e.user_id === viewed.id)}
            selected={selected}
            onSelect={setSelected}
            tone={tone}
          />
        </section>
        <div className="lg:col-span-2">
          <DayDetail date={selected} me={me} partner={partner} sessions={sessions} exams={exams} />
        </div>
      </div>
    </div>
  );
}

function intensity(seconds: number, tone: "me" | "partner") {
  const h = seconds / 3600;
  if (h === 0) return "bg-muted/50";
  if (tone === "me") {
    if (h < 1) return "bg-primary/15";
    if (h < 3) return "bg-primary/35";
    if (h < 6) return "bg-primary/60 text-primary-foreground";
    return "bg-primary text-primary-foreground";
  }
  if (h < 1) return "bg-partner/15";
  if (h < 3) return "bg-partner/35";
  if (h < 6) return "bg-partner/60 text-partner-foreground";
  return "bg-partner text-partner-foreground";
}

function MonthGrid({
  month,
  sessions,
  exams,
  selected,
  onSelect,
  tone,
}: {
  month: Date;
  sessions: StudySession[];
  exams: Exam[];
  selected: string;
  onSelect: (d: string) => void;
  tone: "me" | "partner";
}) {
  const days = eachDayOfInterval({
    start: startOfWeek(startOfMonth(month), { weekStartsOn: 1 }),
    end: endOfWeek(endOfMonth(month), { weekStartsOn: 1 }),
  });
  const totals = useMemo(() => {
    const m = new Map<string, number>();
    for (const s of sessions) m.set(s.session_date, (m.get(s.session_date) ?? 0) + s.duration_seconds);
    return m;
  }, [sessions]);
  const examDays = new Set(exams.map((e) => e.exam_date));
  const today = toDateKey(new Date());

  return (
    <div>
      <div className="mb-2 grid grid-cols-7 gap-1.5 text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {WEEKDAYS.map((d) => (
          <div key={d}>{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1.5">
        {days.map((d) => {
          const key = toDateKey(d);
          const secs = totals.get(key) ?? 0;
          const inMonth = isSameMonth(d, month);
          return (
            <button
              key={key}
              type="button"
              onClick={() => onSelect(key)}
              className={cn(
                "relative flex aspect-square flex-col items-start justify-between rounded-xl p-1.5 text-left transition-all hover:scale-[1.04] md:p-2",
                intensity(secs, tone),
                !inMonth && "opacity-30",
                selected === key && "ring-2 ring-foreground ring-offset-2 ring-offset-card",
                today === key && selected !== key && "ring-2 ring-primary/60",
              )}
            >
              <span className="text-xs font-bold md:text-sm">{format(d, "d")}</span>
              {secs > 0 && <span className="hidden font-clock text-[11px] font-semibold sm:block">{(secs / 3600).toFixed(1)}s</span>}
              {examDays.has(key) && (
                <span className="absolute right-1.5 top-1.5 rounded-full bg-chart-4 px-1 text-[9px] font-bold text-foreground md:text-[10px]">D</span>
              )}
            </button>
          );
        })}
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        <span>Az</span>
        {[0, 1800, 7200, 18000, 25000].map((s) => (
          <span key={s} className={cn("size-4 rounded", intensity(s, tone))} />
        ))}
        <span>Çok</span>
        <span className="ml-auto inline-flex items-center gap-1.5">
          <span className="rounded-full bg-chart-4 px-1 text-[10px] font-bold text-foreground">D</span> Deneme günü
        </span>
      </div>
    </div>
  );
}

function MonthStats({ sessions, exams, tone }: { sessions: StudySession[]; exams: Exam[]; tone: "me" | "partner" }) {
  const total = sessions.reduce((a, s) => a + s.duration_seconds, 0);
  const byDay = new Map<string, number>();
  const bySubject = new Map<string, number>();
  for (const s of sessions) {
    byDay.set(s.session_date, (byDay.get(s.session_date) ?? 0) + s.duration_seconds);
    bySubject.set(s.subject, (bySubject.get(s.subject) ?? 0) + s.duration_seconds);
  }
  const activeDays = byDay.size;
  const best = [...byDay.entries()].sort((a, b) => b[1] - a[1])[0];
  const subjects = [...bySubject.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  const bar = tone === "me" ? "bg-primary" : "bg-partner";

  return (
    <div className="grid gap-4 md:grid-cols-4">
      <Stat label="Toplam çalışma" value={formatDuration(total)} />
      <Stat label="Aktif gün" value={`${activeDays} gün`} sub={activeDays ? `Günlük ort. ${formatDuration(total / activeDays)}` : undefined} />
      <Stat label="En verimli gün" value={best ? formatDuration(best[1]) : "—"} sub={best ? format(fromDateKey(best[0]), "d MMMM", { locale: tr }) : undefined} />
      <div className="surface p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">En çok çalışılan</p>
        {subjects.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">Bu ay kayıt yok</p>
        ) : (
          <ul className="mt-2 grid gap-1.5">
            {subjects.map(([name, secs]) => (
              <li key={name} className="text-xs">
                <div className="flex justify-between">
                  <span>{name}</span>
                  <span className="text-muted-foreground">{formatDuration(secs)}</span>
                </div>
                <div className="mt-0.5 h-1.5 rounded-full bg-muted">
                  <div className={cn("h-full rounded-full", bar)} style={{ width: `${(secs / (subjects[0]?.[1] ?? secs)) * 100}%` }} />
                </div>
              </li>
            ))}
          </ul>
        )}
        {exams.length > 0 && <p className="mt-2 text-xs text-muted-foreground">Bu ay {exams.length} deneme</p>}
      </div>
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string | undefined }) {
  return (
    <div className="surface p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-2xl font-semibold">{value}</p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

function DayDetail({
  date,
  me,
  partner,
  sessions,
  exams,
}: {
  date: string;
  me: Profile;
  partner: Profile | null;
  sessions: StudySession[];
  exams: Exam[];
}) {
  const { data: notes = [] } = useDayNotes(date);
  const people = [me, ...(partner ? [partner] : [])];

  return (
    <section className="surface grid gap-5 p-5 md:p-6">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-sm text-muted-foreground capitalize">{format(fromDateKey(date), "EEEE", { locale: tr })}</p>
          <h2 className="text-2xl font-semibold">{format(fromDateKey(date), "d MMMM yyyy", { locale: tr })}</h2>
        </div>
        <ManualSessionDialog
          defaultDate={date}
          trigger={
            <Button variant="soft" size="sm">
              <Plus /> Ekle
            </Button>
          }
        />
      </div>

      {people.map((p) => {
        const isMe = p.id === me.id;
        const list = sessions.filter((s) => s.user_id === p.id && s.session_date === date);
        const dayExams = exams.filter((e) => e.user_id === p.id && e.exam_date === date);
        const total = list.reduce((a, s) => a + s.duration_seconds, 0);
        return (
          <div key={p.id} className="grid gap-3">
            <div className="flex items-center gap-2">
              <Avatar name={p.display_name} tone={isMe ? "me" : "partner"} />
              <span className="font-semibold">{isMe ? "Sen" : p.display_name}</span>
              <span className="ml-auto font-clock text-sm text-muted-foreground">{formatDuration(total)}</span>
            </div>
            <SessionList sessions={list} canDelete={isMe} tone={isMe ? "me" : "partner"} empty="Bu gün kayıt yok" />
            {dayExams.map((e) => (
              <div key={e.id} className="flex items-center justify-between rounded-xl border border-border bg-accent/40 px-3 py-2.5 text-sm">
                <span>
                  📝 <b>{EXAM_LABEL[e.exam_type]}</b> {e.title && <span className="text-muted-foreground">· {e.title}</span>}
                </span>
                <span className="font-clock font-semibold">{Number(e.total_net).toFixed(2)} net</span>
              </div>
            ))}
            <DayNote date={date} note={notes.find((n) => n.user_id === p.id)} editable={isMe} />
          </div>
        );
      })}
    </section>
  );
}
