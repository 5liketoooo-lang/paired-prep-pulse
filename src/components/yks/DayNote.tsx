import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import type { DayNote as DayNoteRow } from "@/hooks/use-yks";

export function DayNote({ date, note, editable }: { date: string; note: DayNoteRow | undefined; editable: boolean }) {
  const qc = useQueryClient();
  const [value, setValue] = useState(note?.content ?? "");
  const [busy, setBusy] = useState(false);

  useEffect(() => setValue(note?.content ?? ""), [note?.content, date]);

  if (!editable) {
    return note?.content ? (
      <p className="whitespace-pre-wrap rounded-xl bg-muted/60 p-3 text-sm">{note.content}</p>
    ) : null;
  }

  async function save() {
    setBusy(true);
    const { error } = await supabase
      .from("day_notes")
      .upsert({ note_date: date, content: value, updated_at: new Date().toISOString() }, { onConflict: "user_id,note_date" });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    qc.invalidateQueries({ queryKey: ["day_notes", date] });
    toast.success("Not kaydedildi");
  }

  const dirty = value !== (note?.content ?? "");

  return (
    <div className="grid gap-2">
      <Textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Günün notu: neler iyi gitti, neyi tekrar etmelisin?"
        className="min-h-20 rounded-xl bg-card"
      />
      {dirty && (
        <Button size="sm" variant="soft" onClick={save} disabled={busy} className="justify-self-end">
          Notu kaydet
        </Button>
      )}
    </div>
  );
}
