import { useEffect, useState } from "react";
import { useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { useRouteContext } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesUpdate } from "@/integrations/supabase/types";
import type { ExamResults, ExamType } from "@/lib/yks";

export type Profile = Tables<"profiles">;
export type StudySession = Tables<"study_sessions">;
export type DayNote = Tables<"day_notes">;
export type Exam = Omit<Tables<"exams">, "results" | "exam_type"> & {
  results: ExamResults;
  exam_type: ExamType;
};

export function useUserId(): string {
  return useRouteContext({ from: "/_authenticated" }).userId;
}

export function useProfiles() {
  const userId = useUserId();
  const q = useQuery({
    queryKey: ["profiles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*");
      if (error) throw error;
      return data;
    },
  });
  const me = q.data?.find((p) => p.id === userId) ?? null;
  const partner = me?.partner_id ? (q.data?.find((p) => p.id === me.partner_id) ?? null) : null;
  return { ...q, me, partner };
}

export async function updateMyProfile(
  qc: QueryClient,
  userId: string,
  patch: Pick<
    TablesUpdate<"profiles">,
    "display_name" | "daily_goal_minutes" | "active_subject" | "active_started_at" | "active_accumulated_seconds"
  >,
) {
  qc.setQueryData<Profile[]>(["profiles"], (old) =>
    old?.map((p) => (p.id === userId ? { ...p, ...patch } : p)),
  );
  const { error } = await supabase.from("profiles").update(patch).eq("id", userId);
  if (error) {
    await qc.invalidateQueries({ queryKey: ["profiles"] });
    throw error;
  }
}

/** Sessions of both partners between two date keys (inclusive). */
export function useSessions(from: string, to: string) {
  return useQuery({
    queryKey: ["sessions", from, to],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("study_sessions")
        .select("*")
        .gte("session_date", from)
        .lte("session_date", to)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    },
  });
}

export function useExams() {
  return useQuery({
    queryKey: ["exams"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("exams")
        .select("*")
        .order("exam_date", { ascending: true })
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as unknown as Exam[];
    },
  });
}

export function useDayNotes(date: string) {
  return useQuery({
    queryKey: ["day_notes", date],
    queryFn: async () => {
      const { data, error } = await supabase.from("day_notes").select("*").eq("note_date", date);
      if (error) throw error;
      return data;
    },
  });
}

/** Keeps both partners' screens in sync while the app is open. */
export function useLiveSync() {
  const qc = useQueryClient();
  useEffect(() => {
    const channel = supabase
      .channel(`yks-sync-${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, () =>
        qc.invalidateQueries({ queryKey: ["profiles"] }),
      )
      .on("postgres_changes", { event: "*", schema: "public", table: "study_sessions" }, () =>
        qc.invalidateQueries({ queryKey: ["sessions"] }),
      )
      .on("postgres_changes", { event: "*", schema: "public", table: "exams" }, () =>
        qc.invalidateQueries({ queryKey: ["exams"] }),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [qc]);
}

export function useNow(active: boolean, intervalMs = 1000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return;
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [active, intervalMs]);
  return now;
}
