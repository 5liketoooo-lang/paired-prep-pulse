import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Heart } from "lucide-react";
import { toast } from "sonner";
import "@lovable.dev/cloud-auth-js/styles.css";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Giriş yap — YKS İkilisi" },
      { name: "description", content: "YKS İkilisi hesabına giriş yap ya da yeni hesap oluştur." },
      { property: "og:title", content: "Giriş yap — YKS İkilisi" },
      { property: "og:description", content: "YKS İkilisi hesabına giriş yap ya da yeni hesap oluştur." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/bugun", replace: true });
    });
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) navigate({ to: "/bugun", replace: true });
    });
    return () => data.subscription.unsubscribe();
  }, [navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin + "/bugun", data: { display_name: name.trim() } },
        });
        if (error) throw error;
        if (!data.session) setSent(true);
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Bir hata oluştu";
      toast.error(msg.includes("Invalid login") ? "E-posta veya şifre hatalı" : msg);
    } finally {
      setBusy(false);
    }
  }

  async function oauth(provider: "google" | "lovable") {
    const result = await lovable.auth.signInWithOAuth(provider, { redirect_uri: window.location.origin + "/auth" });
    if (result.error) toast.error(result.error.message);
  }

  return (
    <div className="grid min-h-screen place-items-center px-4 py-10">
      <div className="w-full max-w-md animate-rise">
        <Link to="/" className="mb-8 flex items-center justify-center gap-2">
          <span className="grid size-10 place-items-center rounded-xl bg-gradient-primary text-primary-foreground shadow-glow">
            <Heart className="size-5" fill="currentColor" />
          </span>
          <span className="font-display text-2xl font-semibold">YKS İkilisi</span>
        </Link>

        <div className="surface p-6 md:p-8">
          {sent ? (
            <div className="text-center">
              <h1 className="text-2xl font-semibold">E-postanı kontrol et 💌</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                <b>{email}</b> adresine bir onay bağlantısı gönderdik. Bağlantıya tıklayınca giriş yapmış olacaksın.
              </p>
              <Button variant="ghost" className="mt-4" onClick={() => { setSent(false); setMode("signin"); }}>
                Girişe dön
              </Button>
            </div>
          ) : (
            <>
              <div className="mb-6 flex rounded-full bg-muted p-1">
                {(["signin", "signup"] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMode(m)}
                    className={cn("flex-1 rounded-full py-2 text-sm font-semibold transition", mode === m ? "bg-card shadow-sm" : "text-muted-foreground")}
                  >
                    {m === "signin" ? "Giriş yap" : "Kayıt ol"}
                  </button>
                ))}
              </div>

              <form onSubmit={submit} className="grid gap-4">
                {mode === "signup" && (
                  <div className="grid gap-2">
                    <Label htmlFor="name">İsmin</Label>
                    <Input id="name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="ör. Elif" maxLength={30} />
                  </div>
                )}
                <div className="grid gap-2">
                  <Label htmlFor="email">E-posta</Label>
                  <Input id="email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="password">Şifre</Label>
                  <Input
                    id="password"
                    type="password"
                    required
                    minLength={6}
                    autoComplete={mode === "signup" ? "new-password" : "current-password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <Button type="submit" variant="hero" size="lg" disabled={busy}>
                  {mode === "signin" ? "Giriş yap" : "Hesap oluştur"}
                </Button>
              </form>

              <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
                <span className="h-px flex-1 bg-border" /> veya <span className="h-px flex-1 bg-border" />
              </div>

              <div className="grid gap-3">
                <button
                  type="button"
                  onClick={() => oauth("google")}
                  className="inline-flex h-11 w-full items-center justify-center gap-2.5 rounded-lg border border-[#747775] bg-[#FFFFFF] px-3 text-sm font-medium text-[#1F1F1F]"
                >
                  <svg aria-hidden="true" width="18" height="18" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.170 3.56-8.82z"/><path fill="#34A853" d="M12 24c3.24 0 5.950-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z"/><path fill="#FBBC05" d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z"/><path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z"/></svg>
                  Google ile devam et
                </button>
                <button type="button" className="lovable-auth-button w-full" onClick={() => oauth("lovable")}>
                  Lovable ile devam et
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
