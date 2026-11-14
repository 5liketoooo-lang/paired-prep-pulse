import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { STUDY_SUBJECTS, toDateKey } from "@/lib/yks";

export function ManualSessionDialog({ defaultDate, trigger }: { defaultDate?: string; trigger?: React.ReactNode }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [subject, setSubject] = useState<string>(STUDY_SUBJECTS[0]);
  const [hours, setHours] = useState("0");
  const [minutes, setMinutes] = useState("45");
  const [date, setDate] = useState(defaultDate ?? toDateKey(new Date()));
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  async function save() {
    const total = (Number(hours) || 0) * 3600 + (Number(minutes) || 0) * 60;
    if (total <= 0) { toast.error("Süre girmelisin"); return; }
    if (total > 24 * 3600) { toast.error("Bir oturum 24 saati geçemez"); return; }
    setBusy(true);
    const { error } = await supabase.from("study_sessions").insert({
      subject,
      duration_seconds: total,
      session_date: date,
      note: note.trim() || null,
    });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    qc.invalidateQueries({ queryKey: ["sessions"] });
    toast.success("Çalışma eklendi");
    setNote("");
    setOpen(false);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (o && defaultDate) setDate(defaultDate);
      }}
    >
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="outline" size="sm">
            <Plus /> Elle ekle
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="rounded-2xl">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">Çalışma ekle</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label>Ders</Label>
            <Select value={subject} onValueChange={setSubject}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STUDY_SUBJECTS.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="grid gap-2">
              <Label>Saat</Label>
              <Input type="number" min={0} max={24} value={hours} onChange={(e) => setHours(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>Dakika</Label>
              <Input type="number" min={0} max={59} value={minutes} onChange={(e) => setMinutes(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>Tarih</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
          </div>
          <div className="grid gap-2">
            <Label>Not</Label>
            <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ne çalıştın?" />
          </div>
          <Button variant="hero" size="lg" onClick={save} disabled={busy}>
            Kaydet
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
