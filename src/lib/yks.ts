import { format } from "date-fns";

export const STUDY_SUBJECTS = [
  "Matematik",
  "Geometri",
  "Türkçe",
  "Paragraf",
  "Fizik",
  "Kimya",
  "Biyoloji",
  "Tarih",
  "Coğrafya",
  "Felsefe",
  "Din Kültürü",
  "Deneme Çözümü",
  "Tekrar",
  "Diğer",
] as const;

export type ExamType = "TYT" | "AYT";

export interface ExamSection {
  key: string;
  label: string;
  questions: number;
}

export const EXAM_SECTIONS: Record<ExamType, ExamSection[]> = {
  TYT: [
    { key: "turkce", label: "Türkçe", questions: 40 },
    { key: "sosyal", label: "Sosyal Bilimler", questions: 20 },
    { key: "matematik", label: "Temel Matematik", questions: 40 },
    { key: "fen", label: "Fen Bilimleri", questions: 20 },
  ],
  AYT: [
    { key: "matematik", label: "Matematik", questions: 40 },
    { key: "fizik", label: "Fizik", questions: 14 },
    { key: "kimya", label: "Kimya", questions: 13 },
    { key: "biyoloji", label: "Biyoloji", questions: 13 },
  ],
};

export const EXAM_LABEL: Record<ExamType, string> = {
  TYT: "TYT",
  AYT: "AYT Sayısal",
};

export type SectionResult = { d: number; y: number };
export type ExamResults = Record<string, SectionResult>;

/** YKS rule: 4 wrong answers cancel 1 correct one. */
export function calcNet(correct: number, wrong: number): number {
  return round2(correct - wrong / 4);
}

export function round2(n: number) {
  return Math.round(n * 100) / 100;
}

export function examTotalNet(type: ExamType, results: ExamResults): number {
  return round2(
    EXAM_SECTIONS[type].reduce((sum, s) => {
      const r = results[s.key];
      return sum + (r ? r.d - r.y / 4 : 0);
    }, 0),
  );
}

/** Returns an error message, or null when every section fits its question count. */
export function validateExam(type: ExamType, results: ExamResults): string | null {
  for (const s of EXAM_SECTIONS[type]) {
    const r = results[s.key] ?? { d: 0, y: 0 };
    if (r.d < 0 || r.y < 0) return `${s.label}: negatif sayı olamaz`;
    if (r.d + r.y > s.questions) return `${s.label}: doğru + yanlış ${s.questions} soruyu geçemez`;
  }
  return null;
}

export function toDateKey(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

/** "yyyy-MM-dd" → local Date at midnight (avoids UTC shifting). */
export function fromDateKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function formatClock(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return [h, m, sec].map((n) => String(n).padStart(2, "0")).join(":");
}

export function formatDuration(totalSeconds: number): string {
  const mins = Math.round(Math.max(0, totalSeconds) / 60);
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m} dk`;
  if (m === 0) return `${h} sa`;
  return `${h} sa ${m} dk`;
}

export interface TimerState {
  active_started_at: string | null;
  active_accumulated_seconds: number;
}

export function timerElapsed(t: TimerState, now: number): number {
  const running = t.active_started_at ? (now - Date.parse(t.active_started_at)) / 1000 : 0;
  return Math.max(0, Math.floor(t.active_accumulated_seconds + running));
}

export function timerStatus(t: TimerState & { active_subject: string | null }) {
  if (t.active_started_at) return "running" as const;
  if (t.active_accumulated_seconds > 0) return "paused" as const;
  return "idle" as const;
}
