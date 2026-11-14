import { createFileRoute } from "@tanstack/react-router";
import { format, subDays } from "date-fns";
import { tr } from "date-fns/locale";
import { useProfiles, useSessions } from "@/hooks/use-yks";
import { Stopwatch } from "@/components/yks/Stopwatch";
import { GoalCard, PartnerLive } from "@/components/yks/PartnerLive";
import { SessionList } from "@/components/yks/SessionList";
import { ManualSessionDialog } from "@/components/yks/ManualSessionDialog";
import { WeekChart } from "@/components/yks/WeekChart";
import { PageSkeleton } from "@/components/yks/PageSkeleton";
import { formatDuration, toDateKey } from "@/lib/yks";

export const Route = createFileRoute("/_authenticated/bugun")({
  head: () => ({
    meta: [
      { title: "Bugün — YKS İkilisi" },
      { name: "description", content: "Günlük kronometre, hedef ve partnerinin canlı çalışma durumu." },
      { property: "og:title", content: "Bugün — YKS İkilisi" },
      { property: "og:description", content: "Günlük kronometre, hedef ve partnerinin canlı çalışma durumu." },
    ],
  }),
  component: TodayPage,
});

function TodayPage() {
  const { me, partner, isLoading } = useProfiles();
  const today = toDateKey(new Date());
  const weekStart = toDateKey(subDays(new Date(), 6));
  const { data: sessions = [] } = useSessions(weekStart, today);

  if (isLoading || !me) return <PageSkeleton />;

  const todays = sessions.filter((s) => s.session_date === today);
  const mine = todays.filter((s) => s.user_id === me.id).reverse();
  const theirs = partner ? todays.filter((s) => s.user_id === partner.id).reverse() : [];
  const sum = (list: typeof todays) => list.reduce((a, s) => a + s.duration_seconds, 0);

  return (
    <div className="grid gap-6">
      <div className="animate-rise">
        <p className="text-sm capitalize text-muted-foreground">{format(new Date(), "d MMMM EEEE", { locale: tr })}</p>
        <h1 className="font-display text-3xl font-semibold md:text-4xl">Merhaba {me.display_name} ✨</h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Stopwatch key={me.id} me={me} />
        </div>
        <div className="grid content-start gap-6">
          <GoalCard me={me} todaySeconds={sum(mine)} />
          <PartnerLive partner={partner} todaySeconds={sum(theirs)} />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <section className="surface p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Bugün çalıştıkların</h2>
              <p className="text-sm text-muted-foreground">Toplam {formatDuration(sum(mine))}</p>
            </div>
            <ManualSessionDialog />
          </div>
          <SessionList sessions={mine} canDelete tone="me" empty="Kronometreyi başlat, ilk kaydını ekle!" />
        </section>
        <section className="surface p-6">
          <div className="mb-4">
            <h2 className="text-xl font-semibold">{partner ? `${partner.display_name} bugün` : "Partnerin bugün"}</h2>
            <p className="text-sm text-muted-foreground">{partner ? `Toplam ${formatDuration(sum(theirs))}` : "Henüz bağlı değil"}</p>
          </div>
          <SessionList sessions={theirs} canDelete={false} tone="partner" empty={partner ? "Bugün henüz kayıt yok" : "Partner bağlanınca burada görünecek"} />
        </section>
      </div>

      <section className="surface p-6">
        <h2 className="mb-1 text-xl font-semibold">Son 7 gün</h2>
        <p className="mb-4 text-sm text-muted-foreground">Günlük çalışma saatleri</p>
        <WeekChart sessions={sessions} meId={me.id} partnerId={partner?.id ?? null} meName={me.display_name} partnerName={partner?.display_name ?? null} />
      </section>
    </div>
  );
}
