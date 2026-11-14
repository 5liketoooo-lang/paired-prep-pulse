import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarDays, Heart, Timer, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import heroImg from "@/assets/study-together.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "YKS İkilisi — Birlikte çalış, birlikte kazan" },
      { name: "description", content: "Sevgilinle YKS'ye birlikte hazırlan: ortak kronometre, aylık takvim ve deneme neti takibi." },
      { property: "og:title", content: "YKS İkilisi — Birlikte çalış, birlikte kazan" },
      { property: "og:description", content: "Sevgilinle YKS'ye birlikte hazırlan: ortak kronometre, aylık takvim ve deneme neti takibi." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const FEATURES = [
  { icon: Timer, title: "Günlük kronometre", text: "Ders seç, başlat. Partnerin şu an ne çalışıyor, canlı gör." },
  { icon: CalendarDays, title: "Aylık takvim", text: "Hangi gün ne kadar çalıştınız? Güne tıkla, tüm detaylar önünde." },
  { icon: Trophy, title: "Deneme netleri", text: "TYT & AYT netlerini gir, gelişiminizi aynı grafikte karşılaştır." },
];

function Index() {
  return (
    <div className="min-h-screen">
      <header className="mx-auto flex h-20 max-w-6xl items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <span className="grid size-9 place-items-center rounded-xl bg-gradient-primary text-primary-foreground shadow-glow">
            <Heart className="size-4" fill="currentColor" />
          </span>
          <span className="font-display text-xl font-semibold">YKS İkilisi</span>
        </div>
        <Button asChild variant="ghost">
          <Link to="/auth">Giriş yap</Link>
        </Button>
      </header>

      <main className="mx-auto grid max-w-6xl items-center gap-10 px-4 pb-16 pt-6 lg:grid-cols-2 lg:pt-12">
        <div className="animate-rise">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-semibold text-muted-foreground">
            <span className="size-2 rounded-full bg-partner" /> İki kişilik çalışma odası
          </span>
          <h1 className="mt-5 font-display text-5xl font-semibold leading-[1.05] md:text-6xl">
            Birlikte çalış,
            <br />
            <span className="text-primary italic">birlikte kazan.</span>
          </h1>
          <p className="mt-5 max-w-md text-lg text-muted-foreground">
            Kız arkadaşınla YKS'ye hazırlanırken her dakikanızı, her denemenizi tek yerde tutun.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild variant="hero" size="xl">
              <Link to="/bugun">Hadi başlayalım</Link>
            </Button>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {FEATURES.map((f) => (
              <div key={f.title} className="surface p-4">
                <f.icon className="size-5 text-primary" />
                <p className="mt-2 font-semibold">{f.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{f.text}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative">
          <div className="absolute -inset-4 rotate-2 rounded-[2rem] bg-gradient-primary opacity-30 blur-2xl" />
          <img
            src={heroImg}
            alt="Masada birlikte ders çalışan iki öğrenci"
            width={1280}
            height={960}
            className="relative rounded-[2rem] border border-border shadow-soft"
          />
        </div>
      </main>
    </div>
  );
}
