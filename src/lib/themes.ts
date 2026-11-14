export interface AppTheme {
  id: string;
  name: string;
  description: string;
}

export const THEMES: AppTheme[] = [
  { id: "kiraz", name: "Kiraz Çiçeği", description: "Yumuşak pembeler" },
  { id: "adacayi", name: "Adaçayı", description: "Huzurlu yeşil & krem" },
  { id: "gece", name: "Gece Odak", description: "Koyu, gece çalışmasına" },
  { id: "gokyuzu", name: "Gökyüzü & Şeftali", description: "Neşeli ve ferah" },
  { id: "okyanus", name: "Okyanus", description: "Derin mavi, sakin" },
  { id: "lavanta", name: "Lavanta", description: "Pastel mor & pembe" },
  { id: "sonbahar", name: "Sonbahar", description: "Sıcak kahve tonları" },
  { id: "orman", name: "Orman", description: "Koyu yeşil, doğal" },
  { id: "kagit", name: "Kâğıt & Mürekkep", description: "Sade, defter gibi" },
  { id: "neon", name: "Neon Nane", description: "Koyu & enerjik" },
];

export const DEFAULT_THEME = "kiraz";
export const THEME_STORAGE_KEY = "yks-theme";

export function applyTheme(id: string) {
  document.documentElement.dataset["theme"] = id;
  try {
    localStorage.setItem(THEME_STORAGE_KEY, id);
  } catch {
    /* ignore */
  }
}

/** Runs before first paint so the saved theme shows without a flash. */
export const THEME_BOOT_SCRIPT = `try{var t=localStorage.getItem("${THEME_STORAGE_KEY}");document.documentElement.dataset.theme=t||"${DEFAULT_THEME}"}catch(e){document.documentElement.dataset.theme="${DEFAULT_THEME}"}`;
