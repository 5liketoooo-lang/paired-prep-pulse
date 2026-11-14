CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text NOT NULL DEFAULT 'Öğrenci',
  daily_goal_minutes integer NOT NULL DEFAULT 360,
  pair_code text NOT NULL UNIQUE DEFAULT upper(substr(md5(random()::text || clock_timestamp()::text), 1, 6)),
  partner_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  active_subject text,
  active_started_at timestamptz,
  active_accumulated_seconds integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.profiles TO authenticated;
GRANT UPDATE (display_name, daily_goal_minutes, active_subject, active_started_at, active_accumulated_seconds) ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.get_partner_id()
RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT partner_id FROM public.profiles WHERE id = auth.uid() $$;

CREATE POLICY "View own or partner profile" ON public.profiles FOR SELECT TO authenticated
USING (id = auth.uid() OR id = public.get_partner_id());
CREATE POLICY "Update own profile" ON public.profiles FOR UPDATE TO authenticated
USING (id = auth.uid()) WITH CHECK (id = auth.uid());

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NULLIF(NEW.raw_user_meta_data->>'display_name', ''), NULLIF(NEW.raw_user_meta_data->>'full_name', ''), split_part(NEW.email, '@', 1), 'Öğrenci'));
  RETURN NEW;
END $$;

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.link_partner(_code text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE target uuid; target_partner uuid; my_partner uuid;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Giriş yapmalısın'; END IF;
  SELECT id, partner_id INTO target, target_partner FROM public.profiles WHERE pair_code = upper(trim(_code));
  IF target IS NULL THEN RAISE EXCEPTION 'Bu kodla bir kullanıcı bulunamadı'; END IF;
  IF target = auth.uid() THEN RAISE EXCEPTION 'Kendi kodunu giremezsin'; END IF;
  IF target_partner IS NOT NULL AND target_partner <> auth.uid() THEN RAISE EXCEPTION 'Bu kişi zaten başka biriyle eşleşmiş'; END IF;
  SELECT partner_id INTO my_partner FROM public.profiles WHERE id = auth.uid();
  IF my_partner IS NOT NULL AND my_partner <> target THEN RAISE EXCEPTION 'Önce mevcut eşleşmeni kaldırmalısın'; END IF;
  UPDATE public.profiles SET partner_id = target WHERE id = auth.uid();
  UPDATE public.profiles SET partner_id = auth.uid() WHERE id = target;
  RETURN target;
END $$;

CREATE OR REPLACE FUNCTION public.unlink_partner()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE my_partner uuid;
BEGIN
  SELECT partner_id INTO my_partner FROM public.profiles WHERE id = auth.uid();
  UPDATE public.profiles SET partner_id = NULL WHERE id = auth.uid();
  IF my_partner IS NOT NULL THEN
    UPDATE public.profiles SET partner_id = NULL WHERE id = my_partner AND partner_id = auth.uid();
  END IF;
END $$;

REVOKE EXECUTE ON FUNCTION public.link_partner(text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.unlink_partner() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_partner_id() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.link_partner(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.unlink_partner() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_partner_id() TO authenticated;

CREATE TABLE public.study_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  subject text NOT NULL,
  duration_seconds integer NOT NULL CHECK (duration_seconds > 0),
  session_date date NOT NULL DEFAULT CURRENT_DATE,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX study_sessions_user_date ON public.study_sessions (user_id, session_date);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.study_sessions TO authenticated;
GRANT ALL ON public.study_sessions TO service_role;
ALTER TABLE public.study_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View own or partner sessions" ON public.study_sessions FOR SELECT TO authenticated
USING (user_id = auth.uid() OR user_id = public.get_partner_id());
CREATE POLICY "Insert own sessions" ON public.study_sessions FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Update own sessions" ON public.study_sessions FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Delete own sessions" ON public.study_sessions FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE TABLE public.exams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  exam_date date NOT NULL DEFAULT CURRENT_DATE,
  exam_type text NOT NULL CHECK (exam_type IN ('TYT', 'AYT')),
  title text,
  results jsonb NOT NULL DEFAULT '{}'::jsonb,
  total_net numeric(6,2) NOT NULL DEFAULT 0,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX exams_user_date ON public.exams (user_id, exam_date);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.exams TO authenticated;
GRANT ALL ON public.exams TO service_role;
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View own or partner exams" ON public.exams FOR SELECT TO authenticated
USING (user_id = auth.uid() OR user_id = public.get_partner_id());
CREATE POLICY "Insert own exams" ON public.exams FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Update own exams" ON public.exams FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Delete own exams" ON public.exams FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE TABLE public.day_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  note_date date NOT NULL,
  content text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, note_date)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.day_notes TO authenticated;
GRANT ALL ON public.day_notes TO service_role;
ALTER TABLE public.day_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View own or partner notes" ON public.day_notes FOR SELECT TO authenticated
USING (user_id = auth.uid() OR user_id = public.get_partner_id());
CREATE POLICY "Insert own notes" ON public.day_notes FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Update own notes" ON public.day_notes FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Delete own notes" ON public.day_notes FOR DELETE TO authenticated USING (user_id = auth.uid());

ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.study_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.exams;