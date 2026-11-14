import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Pause, Play, Square, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { updateMyProfile, useNow, type Profile } from "@/hooks/use-yks";
import { formatClock, STUDY_SUBJECTS, timerElapsed, timerStatus, toDateKey } from "@/lib/yks";
import { cn } from "@/lib/utils";

export function Stopwatch({ me }: { me: Profile }) {
  const qc = useQueryClient();
  const status = timerStatus(me);
  const now = useNow(status === "running");
  const elapsed = timerElapsed(me, now);
  const [subject, setSubject] = useState<string>(me.active_subject ?? STUDY_SUBJECTS[0]);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const locked = status !== "idle";
  const currentSubject = locked ? (me.active_subject ?? subject) : subject;

  async function run(fn: () => Promise<void>) {
    setBusy(true);
    try {
      await fn();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Bir şeyler ters gitti");
    } finally {
      setBusy(false);
    }
  }

  const start = () =>
    run(() =>
      updateMyProfile(qc, me.id, {
        active_subject: currentSubject,
        active_started_at: new Date().toISOString(),
      }),
    );

  const pause = () =>
    run(() =>
      updateMyProfile(qc, me.id, {
        active_started_at: null,
        active_accumulated_seconds: timerElapsed(me, Date.now()),
      }),
    );

  const reset = () =>
    run(() =>
      updateMyProfile(qc, me.id, {
        active_subject: null,
        active_started_at: null,
        active_accumulated_seconds: 0,
      }),
    );

  const finish = () =>
    run(async () => {
      const total = timerElapsed(me, Date.now());
      if (total < 30) {
        toast.error("30 saniyeden kısa çalışmalar kaydedilmiyor");
        return;
      }
      const { error } = await supabase.from("study_sessions").insert({
        subject: currentSubject,
        duration_seconds: total,
        session_date: toDateKey(new Date()),
        note: note.trim() || null,
      });
      if (error) throw error;
      await updateMyProfile(qc, me.id, {
        active_subject: null,
        active_started_at: null,
        active_accumulated_seconds: 0,
      });
      setNote("");
      qc.invalidateQueries({ queryKey: ["sessions"] });
      toast.success(`${currentSubject} kaydedildi 🎉`);
    });

  return (
    <section className="surface relative overflow-hidden p-6 md:p-8">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">Kronometre</p>
        <span
          className={cn(
            "rounded-full px-3 py-1 text-xs font-semibold",
            status === "running" && "bg-primary text-primary-foreground",
            status === "paused" && "bg-accent text-accent-foreground",
            status === "idle" && "bg-muted text-muted-foreground",
          )}
        >
          {status === "running" ? "Çalışıyorsun" : status === "paused" ? "Mola" : "Hazır"}
        </span>
      </div>

      <div className="my-8 text-center">
        <div className={cn("font-clock text-6xl font-semibold sm:text-7xl md:text-8xl", status === "running" && "text-primary")}>
          {formatClock(elapsed)}
        </div>
        <p className="mt-2 text-muted-foreground">{currentSubject}</p>
      </div>

      <div className="flex flex-wrap justify-center gap-2">
        {STUDY_SUBJECTS.map((s) => (
          <button
            key={s}
            type="button"
            disabled={locked}
            onClick={() => setSubject(s)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-sm transition-all",
              currentSubject === s
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-foreground hover:border-primary/60",
              locked && currentSubject !== s && "opacity-40",
            )}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="mx-auto mt-6 max-w-md">
        <Input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Not ekle (ör. 3D Limit testi, 40 soru)"
          className="h-11 rounded-xl bg-card"
        />
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        {status === "running" ? (
          <Button size="xl" variant="soft" onClick={pause} disabled={busy}>
            <Pause /> Mola ver
          </Button>
        ) : (
          <Button size="xl" variant="hero" onClick={start} disabled={busy} className={cn(status === "idle" && "animate-pulse-ring")}>
            <Play fill="currentColor" /> {status === "paused" ? "Devam et" : "Başla"}
          </Button>
        )}
        {status !== "idle" && (
          <>
            <Button size="xl" variant="default" onClick={finish} disabled={busy}>
              <Square fill="currentColor" /> Bitir & kaydet
            </Button>
            <Button size="icon" variant="ghost" onClick={reset} disabled={busy} aria-label="Sıfırla" title="Kaydetmeden sıfırla">
              <Trash2 />
            </Button>
          </>
        )}
      </div>
    </section>
  );
}
