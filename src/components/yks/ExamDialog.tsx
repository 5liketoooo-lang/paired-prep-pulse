import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { calcNet, EXAM_LABEL, EXAM_SECTIONS, examTotalNet, toDateKey, validateExam, type ExamResults, type ExamType } from "@/lib/yks";
import { cn } from "@/lib/utils";

export function ExamDialog({ defaultType }: { defaultType: ExamType }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<ExamType>(defaultType);
  const [date, setDate] = useState(toDateKey(new Date()));
  const [title, setTitle] = useState("");
  const [results, setResults] = useState<ExamResults>({});
  const [busy, setBusy] = useState(false);

  const total = examTotalNet(type, results);

  function setField(key: string, field: "d" | "y", raw: string) {
    const n = Math.max(0, Math.floor(Number(raw) || 0));
    setResults((r) => ({ ...r, [key]: { d: r[key]?.d ?? 0, y: r[key]?.y ?? 0, [field]: n } }));
  }

  async function save() {
    const err = validateExam(type, results);
    if (err) { toast.error(err); return; }
    const clean: ExamResults = {};
    for (const s of EXAM_SECTIONS[type]) clean[s.key] = results[s.key] ?? { d: 0, y: 0 };
    setBusy(true);
    const { error } = await supabase.from("exams").insert({
      exam_type: type,
      exam_date: date,
      title: title.trim() || null,
      results: clean,
      total_net: examTotalNet(type, clean),
    });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    qc.invalidateQueries({ queryKey: ["exams"] });
    toast.success(`${EXAM_LABEL[type]} kaydedildi · ${examTotalNet(type, clean).toFixed(2)} net`);
    setResults({});
    setTitle("");
    setOpen(false);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (o) setType(defaultType);
      }}
    >
      <DialogTrigger asChild>
        <Button variant="hero" size="lg">
          <Plus /> Deneme ekle
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-2xl">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">Deneme sonucu</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="flex rounded-full border border-border bg-muted p-1">
            {(Object.keys(EXAM_SECTIONS) as ExamType[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => {
                  setType(t);
                  setResults({});
                }}
                className={cn("flex-1 rounded-full py-1.5 text-sm font-semibold", type === t ? "bg-card shadow-sm" : "text-muted-foreground")}
              >
                {EXAM_LABEL[t]}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label>Tarih</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>Yayın / ad</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="ör. 3D Türkiye Geneli" />
            </div>
          </div>

          <div className="grid gap-2">
            <div className="grid grid-cols-[1fr_4rem_4rem_4rem] gap-2 px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <span>Ders</span>
              <span className="text-center">Doğru</span>
              <span className="text-center">Yanlış</span>
              <span className="text-right">Net</span>
            </div>
            {EXAM_SECTIONS[type].map((s) => {
              const r = results[s.key] ?? { d: 0, y: 0 };
              const over = r.d + r.y > s.questions;
              return (
                <div key={s.key} className="grid grid-cols-[1fr_4rem_4rem_4rem] items-center gap-2 rounded-xl bg-muted/50 p-2">
                  <div>
                    <p className="text-sm font-medium">{s.label}</p>
                    <p className={cn("text-xs", over ? "text-destructive" : "text-muted-foreground")}>
                      {s.questions} soru · boş {Math.max(0, s.questions - r.d - r.y)}
                    </p>
                  </div>
                  <Input type="number" min={0} max={s.questions} inputMode="numeric" className="h-9 text-center" value={r.d || ""} onChange={(e) => setField(s.key, "d", e.target.value)} />
                  <Input type="number" min={0} max={s.questions} inputMode="numeric" className="h-9 text-center" value={r.y || ""} onChange={(e) => setField(s.key, "y", e.target.value)} />
                  <span className="text-right font-clock font-semibold">{calcNet(r.d, r.y).toFixed(2)}</span>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between rounded-xl bg-gradient-primary px-4 py-3 text-primary-foreground">
            <span className="font-semibold">Toplam net</span>
            <span className="font-clock text-2xl font-semibold">{total.toFixed(2)}</span>
          </div>

          <Button variant="default" size="lg" onClick={save} disabled={busy}>
            Kaydet
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
