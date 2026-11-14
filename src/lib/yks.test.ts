import { describe, expect, it } from "vitest";
import { calcNet, examTotalNet, timerElapsed, validateExam } from "./yks";

describe("YKS net hesabı", () => {
  it("4 yanlış 1 doğruyu götürür", () => {
    expect(calcNet(30, 8)).toBe(28);
    expect(calcNet(10, 3)).toBe(9.25);
  });

  it("TYT toplam neti bölümlerin toplamıdır", () => {
    const net = examTotalNet("TYT", {
      turkce: { d: 32, y: 4 },
      sosyal: { d: 15, y: 2 },
      matematik: { d: 25, y: 8 },
      fen: { d: 10, y: 4 },
    });
    expect(net).toBe(31 + 14.5 + 23 + 9);
  });

  it("doğru + yanlış soru sayısını geçemez", () => {
    expect(validateExam("AYT", { fizik: { d: 10, y: 5 } })).toMatch(/Fizik/);
    expect(validateExam("AYT", { fizik: { d: 10, y: 4 } })).toBeNull();
  });
});

describe("kronometre", () => {
  it("duraklatılmış süre + çalışan süre toplanır", () => {
    const start = Date.parse("2026-01-01T10:00:00Z");
    expect(
      timerElapsed({ active_started_at: new Date(start).toISOString(), active_accumulated_seconds: 120 }, start + 60_000),
    ).toBe(180);
    expect(timerElapsed({ active_started_at: null, active_accumulated_seconds: 95 }, start)).toBe(95);
  });
});
