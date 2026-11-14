import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { format, subDays } from "date-fns";
import { tr } from "date-fns/locale";
import type { StudySession } from "@/hooks/use-yks";
import { toDateKey } from "@/lib/yks";

export function WeekChart({
  sessions,
  meId,
  partnerId,
  meName,
  partnerName,
}: {
  sessions: StudySession[];
  meId: string;
  partnerId: string | null;
  meName: string;
  partnerName: string | null;
}) {
  const days = Array.from({ length: 7 }, (_, i) => subDays(new Date(), 6 - i));
  const data = days.map((d) => {
    const key = toDateKey(d);
    const sum = (uid: string | null) =>
      Math.round(
        (sessions.filter((s) => s.user_id === uid && s.session_date === key).reduce((a, s) => a + s.duration_seconds, 0) / 3600) * 10,
      ) / 10;
    return { label: format(d, "EEE", { locale: tr }), me: sum(meId), partner: sum(partnerId) };
  });

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer>
        <BarChart data={data} barGap={4}>
          <CartesianGrid vertical={false} stroke="var(--border)" />
          <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} />
          <YAxis tickLine={false} axisLine={false} width={28} tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} unit="sa" />
          <Tooltip
            cursor={{ fill: "var(--muted)" }}
            contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12, color: "var(--foreground)" }}
            formatter={(v: number, n: string) => [`${v} saat`, n === "me" ? meName : (partnerName ?? "")]}
          />
          <Bar dataKey="me" fill="var(--primary)" radius={[6, 6, 0, 0]} />
          {partnerId && <Bar dataKey="partner" fill="var(--partner)" radius={[6, 6, 0, 0]} />}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
