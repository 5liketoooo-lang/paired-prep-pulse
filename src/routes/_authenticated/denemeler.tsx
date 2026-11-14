import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { Trash2 } from "lucide-react";
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useExams, useProfiles, type Exam, type Profile } from "@/hooks/use-yks";
import { PageSkeleton } from "@/components/yks/PageSkeleton";
import { ExamDialog } from "@/components/yks/ExamDialog";
import { Avatar } from "@/components/yks/AppShell";
import { calcNet, EXAM_LABEL, EXAM_SECTIONS, fromDateKey, round2, type ExamType } from "@/lib/yks";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/denemeler")({
  head: () => ({
    meta: [
      { title: "Denemeler — YKS İkilisi" },
      { name: "description", content: "TYT ve AYT deneme netlerini kaydet, gelişimini grafikte izle." },
      { property: "og:title", content: "Denemeler — YKS İkilisi" },
      { property: "og:description", content: "TYT ve AYT deneme netlerini kaydet, gelişimini grafikte izle." },
    ],
  }),
  component: ExamsPage,
});

function ExamsPage() {
  const { me, partner, isLoading } = useProfiles();
  const { data: exams = [] } = useExams();
  const [type, setType] = useState<ExamType>("TYT");

  if (isLoading || !me) return <PageSkeleton />;

  const ofType = exams.filter((e) => e.exam_type === type);
  const mine = ofType.filter((e) => e.user_id === me.id);
  const theirs = partner ? ofType.filter((e) => e.user_id === partner.id) : [];

  const dates = [...new Set(ofType.map((e) => e.exam_date))].sort();
  const chartData = dates.map((d) => {
    const avg = (list: Exam[]) => {
      const day = list.filter((e) => e.exam_date === d);
      return day.length ? round2(day.reduce((a, e) => a + Number(e.total_net), 0) / day.length) : null;
    };
    return { label: format(fromDateKey(d), "d MMM", { locale: tr }), me: avg(mine), partner: avg(theirs) };
  });

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Net takibi</p>
          <h1 className="font-display text-3xl font-semibold md:text-4xl">Denemeler</h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex rounded-full border border-border bg-card p-1 text-sm">
            {(Object.keys(EXAM_SECTIONS) as ExamType[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={cn("rounded-full px-4 py-1.5 font-semibold", type === t ? "bg-primary text-primary-foreground" : "text-muted-foreground")}
              >
                {EXAM_LABEL[t]}
              </button>
            ))}
          </div>
          <ExamDialog defaultType={type} />
        </div>
      </div>

      <div className={cn("grid gap-4", partner && "md:grid-cols-2")}>
        <NetStats person={me} exams={mine} tone="me" isMe />
        {partner && <NetStats person={partner} exams={theirs} tone="partner" />}
      </div>

      <section className="surface p-6">
        <h2 className="text-xl font-semibold">Net gelişimi</h2>
        <p className="mb-4 text-sm text-muted-foreground">{EXAM_LABEL[type]} toplam netleri</p>
        {chartData.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
            İlk denemeni ekle, grafik burada belirecek 📈
          </p>
        ) : (
          <div className="h-72">
            <ResponsiveContainer>
              <LineChart data={chartData}>
                <CartesianGrid vertical={false} stroke="var(--border)" />
                <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} />
                <YAxis tickLine={false} axisLine={false} width={36} tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} domain={[0, type === "TYT" ? 120 : 80]} />
                <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12, color: "var(--foreground)" }} />
                <Legend />
                <Line type="monotone" dataKey="me" name={me.display_name} stroke="var(--primary)" strokeWidth={3} dot={{ r: 4 }} connectNulls />
                {partner && <Line type="monotone" dataKey="partner" name={partner.display_name} stroke="var(--partner)" strokeWidth={3} dot={{ r: 4 }} connectNulls />}
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>

      <section className="grid gap-3">
        <h2 className="text-xl font-semibold">Tüm {EXAM_LABEL[type]} denemeleri</h2>
        {ofType.length === 0 && <p className="text-sm text-muted-foreground">Henüz deneme yok.</p>}
        <div className="grid gap-3 md:grid-cols-2">
          {[...ofType].reverse().map((e) => (
            <ExamCard key={e.id} exam={e} owner={e.user_id === me.id ? me : partner} isMine={e.user_id === me.id} />
          ))}
        </div>
      </section>
    </div>
  );
}

function NetStats({ person, exams, tone, isMe }: { person: Profile; exams: Exam[]; tone: "me" | "partner"; isMe?: boolean }) {
  const nets = exams.map((e) => Number(e.total_net));
  const last = nets.at(-1);
  const prev = nets.at(-2);
  const best = nets.length ? Math.max(...nets) : undefined;
  const last5 = nets.slice(-5);
  const avg = last5.length ? round2(last5.reduce((a, b) => a + b, 0) / last5.length) : undefined;
  const diff = last !== undefined && prev !== undefined ? round2(last - prev) : undefined;

  return (
    <div className="surface p-5">
      <div className="mb-4 flex items-center gap-2">
        <Avatar name={person.display_name} tone={tone} />
        <span className="font-semibold">{isMe ? "Sen" : person.display_name}</span>
        <span className="ml-auto text-xs text-muted-foreground">{exams.length} deneme</span>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <p className="text-xs text-muted-foreground">Son net</p>
          <p className={cn("font-display text-3xl font-semibold", tone === "me" ? "text-primary" : "text-partner")}>{last?.toFixed(2) ?? "—"}</p>
          {diff !== undefined && (
            <p className={cn("text-xs font-semibold", diff >= 0 ? "text-chart-5" : "text-destructive")}>
              {diff >= 0 ? "▲" : "▼"} {Math.abs(diff).toFixed(2)}
            </p>
          )}
        </div>
        <div>
          <p className="text-xs text-muted-foreground">En iyi</p>
          <p className="font-display text-3xl font-semibold">{best?.toFixed(2) ?? "—"}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Son 5 ort.</p>
          <p className="font-display text-3xl font-semibold">{avg?.toFixed(2) ?? "—"}</p>
        </div>
      </div>
    </div>
  );
}

function ExamCard({ exam, owner, isMine }: { exam: Exam; owner: Profile | null; isMine: boolean }) {
  const qc = useQueryClient();

  async function remove() {
    if (!confirm("Bu denemeyi silmek istediğine emin misin?")) return;
    const { error } = await supabase.from("exams").delete().eq("id", exam.id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["exams"] });
  }

  return (
    <article className="surface group p-5">
      <div className="flex items-start gap-3">
        {owner && <Avatar name={owner.display_name} tone={isMine ? "me" : "partner"} />}
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">{exam.title || EXAM_LABEL[exam.exam_type]}</p>
          <p className="text-xs text-muted-foreground">{format(fromDateKey(exam.exam_date), "d MMMM yyyy, EEEE", { locale: tr })}</p>
        </div>
        <div className="text-right">
          <p className="font-clock text-2xl font-semibold">{Number(exam.total_net).toFixed(2)}</p>
          <p className="text-xs text-muted-foreground">net</p>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {EXAM_SECTIONS[exam.exam_type].map((s) => {
          const r = exam.results[s.key] ?? { d: 0, y: 0 };
          return (
            <div key={s.key} className="rounded-xl bg-muted/60 p-2">
              <p className="truncate text-[11px] text-muted-foreground">{s.label}</p>
              <p className="font-clock font-semibold">{calcNet(r.d, r.y).toFixed(2)}</p>
              <p className="text-[11px] text-muted-foreground">
                {r.d}D · {r.y}Y
              </p>
            </div>
          );
        })}
      </div>
      {isMine && (
        <button type="button" onClick={remove} className="mt-3 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive">
          <Trash2 className="size-3.5" /> Sil
        </button>
      )}
    </article>
  );
}
