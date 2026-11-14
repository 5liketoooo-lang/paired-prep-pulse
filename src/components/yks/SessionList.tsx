import { useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { StudySession } from "@/hooks/use-yks";
import { formatDuration } from "@/lib/yks";
import { cn } from "@/lib/utils";

export function SessionList({
  sessions,
  canDelete,
  tone,
  empty = "Henüz kayıt yok",
}: {
  sessions: StudySession[];
  canDelete: boolean;
  tone: "me" | "partner";
  empty?: string;
}) {
  const qc = useQueryClient();

  async function remove(id: string) {
    const { error } = await supabase.from("study_sessions").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    qc.invalidateQueries({ queryKey: ["sessions"] });
  }

  if (sessions.length === 0) {
    return <p className="rounded-xl border border-dashed border-border p-4 text-center text-sm text-muted-foreground">{empty}</p>;
  }

  return (
    <ul className="grid gap-2">
      {sessions.map((s) => (
        <li key={s.id} className="group flex items-center gap-3 rounded-xl border border-border bg-card px-3 py-2.5">
          <span className={cn("h-8 w-1.5 shrink-0 rounded-full", tone === "me" ? "bg-primary" : "bg-partner")} />
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline justify-between gap-2">
              <span className="truncate font-semibold">{s.subject}</span>
              <span className="shrink-0 font-clock text-sm text-muted-foreground">{formatDuration(s.duration_seconds)}</span>
            </div>
            {s.note && <p className="truncate text-sm text-muted-foreground">{s.note}</p>}
          </div>
          {canDelete && (
            <button
              type="button"
              onClick={() => remove(s.id)}
              aria-label="Sil"
              className="rounded-lg p-1.5 text-muted-foreground opacity-60 transition hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
            >
              <Trash2 className="size-4" />
            </button>
          )}
        </li>
      ))}
    </ul>
  );
}
