import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Check, Copy, HeartHandshake, LogOut } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { updateMyProfile, useProfiles } from "@/hooks/use-yks";
import { PageSkeleton } from "@/components/yks/PageSkeleton";
import { Avatar } from "@/components/yks/AppShell";
import { applyTheme, DEFAULT_THEME, THEMES } from "@/lib/themes";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/ayarlar")({
  head: () => ({
    meta: [
      { title: "Ayarlar — YKS İkilisi" },
      { name: "description", content: "Profil, partner eşleşmesi ve tema seçimi." },
      { property: "og:title", content: "Ayarlar — YKS İkilisi" },
      { property: "og:description", content: "Profil, partner eşleşmesi ve tema seçimi." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { me, partner, isLoading } = useProfiles();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [goalHours, setGoalHours] = useState("6");
  const [code, setCode] = useState("");
  const [copied, setCopied] = useState(false);
  const [theme, setTheme] = useState(DEFAULT_THEME);

  useEffect(() => {
    if (me) {
      setName(me.display_name);
      setGoalHours(String(me.daily_goal_minutes / 60));
    }
  }, [me?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setTheme(document.documentElement.dataset.theme ?? DEFAULT_THEME);
  }, []);

  if (isLoading || !me) return <PageSkeleton />;

  async function saveProfile() {
    const minutes = Math.round((Number(goalHours) || 0) * 60);
    if (!name.trim()) return toast.error("İsim boş olamaz");
    if (minutes < 30 || minutes > 16 * 60) return toast.error("Hedef 0,5 ile 16 saat arasında olmalı");
    try {
      await updateMyProfile(qc, me!.id, { display_name: name.trim(), daily_goal_minutes: minutes });
      toast.success("Profil güncellendi");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Kaydedilemedi");
    }
  }

  async function link() {
    if (!code.trim()) return;
    const { error } = await supabase.rpc("link_partner", { _code: code.trim() });
    if (error) return toast.error(error.message);
    setCode("");
    await qc.invalidateQueries();
    toast.success("Eşleştiniz! 💞");
  }

  async function unlink() {
    if (!confirm("Eşleşmeyi kaldırmak istediğine emin misin?")) return;
    const { error } = await supabase.rpc("unlink_partner");
    if (error) return toast.error(error.message);
    await qc.invalidateQueries();
    toast.success("Eşleşme kaldırıldı");
  }

  async function copyCode() {
    await navigator.clipboard.writeText(me!.pair_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="grid gap-6">
      <div>
        <p className="text-sm text-muted-foreground">Kendine göre ayarla</p>
        <h1 className="font-display text-3xl font-semibold md:text-4xl">Ayarlar</h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="surface grid gap-4 p-6">
          <h2 className="text-xl font-semibold">Profil</h2>
          <div className="grid gap-2">
            <Label>İsmin</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} maxLength={30} />
          </div>
          <div className="grid gap-2">
            <Label>Günlük hedef (saat)</Label>
            <Input type="number" step="0.5" min={0.5} max={16} value={goalHours} onChange={(e) => setGoalHours(e.target.value)} />
          </div>
          <Button onClick={saveProfile} className="justify-self-start">
            Kaydet
          </Button>
        </section>

        <section className="surface grid content-start gap-4 p-6">
          <h2 className="flex items-center gap-2 text-xl font-semibold">
            <HeartHandshake className="size-5 text-partner" /> Partner
          </h2>
          {partner ? (
            <div className="flex items-center gap-3 rounded-xl bg-muted/60 p-4">
              <Avatar name={me.display_name} tone="me" />
              <span className="text-partner">♥</span>
              <Avatar name={partner.display_name} tone="partner" />
              <p className="flex-1 text-sm">
                <b>{partner.display_name}</b> ile eşleştin
              </p>
              <Button variant="ghost" size="sm" onClick={unlink}>
                Kaldır
              </Button>
            </div>
          ) : (
            <>
              <div>
                <Label>Senin kodun</Label>
                <div className="mt-2 flex items-center gap-2">
                  <span className="rounded-xl border border-dashed border-primary bg-primary/10 px-4 py-2 font-clock text-2xl font-semibold tracking-[0.3em] text-primary">
                    {me.pair_code}
                  </span>
                  <Button variant="outline" size="icon" onClick={copyCode} aria-label="Kodu kopyala">
                    {copied ? <Check /> : <Copy />}
                  </Button>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">Bu kodu kız arkadaşına gönder, o girsin — ya da onun kodunu sen gir.</p>
              </div>
              <div className="grid gap-2">
                <Label>Partnerinin kodu</Label>
                <div className="flex gap-2">
                  <Input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="ABC123" maxLength={6} className="font-clock tracking-widest" />
                  <Button variant="partner" onClick={link}>
                    Eşleş
                  </Button>
                </div>
              </div>
            </>
          )}
        </section>
      </div>

      <section className="surface p-6">
        <h2 className="text-xl font-semibold">Tema</h2>
        <p className="mb-4 text-sm text-muted-foreground">Bu cihazda geçerli olur — ikiniz farklı tema seçebilirsiniz.</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {THEMES.map((t) => (
            <button
              key={t.id}
              type="button"
              data-theme={t.id}
              onClick={() => {
                applyTheme(t.id);
                setTheme(t.id);
              }}
              className={cn(
                "group relative overflow-hidden rounded-2xl border-2 bg-background p-3 text-left text-foreground transition-all hover:-translate-y-0.5",
                theme === t.id ? "border-primary shadow-glow" : "border-border",
              )}
            >
              <div className="flex gap-1">
                <span className="h-8 flex-1 rounded-lg bg-primary" />
                <span className="h-8 flex-1 rounded-lg bg-partner" />
                <span className="h-8 flex-1 rounded-lg bg-accent" />
                <span className="h-8 flex-1 rounded-lg bg-card ring-1 ring-border" />
              </div>
              <p className="mt-2 text-sm font-semibold">{t.name}</p>
              <p className="text-xs text-muted-foreground">{t.description}</p>
              {theme === t.id && (
                <span className="absolute right-2 top-2 grid size-5 place-items-center rounded-full bg-primary text-primary-foreground">
                  <Check className="size-3" />
                </span>
              )}
            </button>
          ))}
        </div>
      </section>

      <Button variant="outline" onClick={signOut} className="justify-self-start">
        <LogOut /> Çıkış yap
      </Button>
    </div>
  );
}
