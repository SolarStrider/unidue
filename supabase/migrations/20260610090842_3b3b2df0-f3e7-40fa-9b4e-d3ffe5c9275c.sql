
-- NOTES
CREATE TABLE public.notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL DEFAULT 'Untitled',
  content text NOT NULL DEFAULT '',
  subject text NOT NULL DEFAULT '',
  assignment_id uuid REFERENCES public.assignments(id) ON DELETE SET NULL,
  pinned boolean NOT NULL DEFAULT false,
  tags text[] NOT NULL DEFAULT '{}',
  ai_summary text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notes TO authenticated;
GRANT ALL ON public.notes TO service_role;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own notes" ON public.notes FOR ALL TO authenticated USING (auth.uid()=user_id) WITH CHECK (auth.uid()=user_id);
CREATE TRIGGER notes_updated BEFORE UPDATE ON public.notes FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- FLASHCARD DECKS
CREATE TABLE public.flashcard_decks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  subject text NOT NULL DEFAULT '',
  source_note_id uuid REFERENCES public.notes(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.flashcard_decks TO authenticated;
GRANT ALL ON public.flashcard_decks TO service_role;
ALTER TABLE public.flashcard_decks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own decks" ON public.flashcard_decks FOR ALL TO authenticated USING (auth.uid()=user_id) WITH CHECK (auth.uid()=user_id);
CREATE TRIGGER decks_updated BEFORE UPDATE ON public.flashcard_decks FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- FLASHCARDS
CREATE TABLE public.flashcards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  deck_id uuid NOT NULL REFERENCES public.flashcard_decks(id) ON DELETE CASCADE,
  front text NOT NULL,
  back text NOT NULL,
  ease real NOT NULL DEFAULT 2.5,
  interval_days integer NOT NULL DEFAULT 0,
  next_review timestamptz NOT NULL DEFAULT now(),
  times_known integer NOT NULL DEFAULT 0,
  times_review integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.flashcards TO authenticated;
GRANT ALL ON public.flashcards TO service_role;
ALTER TABLE public.flashcards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own flashcards" ON public.flashcards FOR ALL TO authenticated USING (auth.uid()=user_id) WITH CHECK (auth.uid()=user_id);

-- QUIZZES
CREATE TABLE public.quizzes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  source_type text NOT NULL DEFAULT 'manual',
  source_id uuid,
  source_label text NOT NULL DEFAULT '',
  difficulty text NOT NULL DEFAULT 'medium',
  questions jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.quizzes TO authenticated;
GRANT ALL ON public.quizzes TO service_role;
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own quizzes" ON public.quizzes FOR ALL TO authenticated USING (auth.uid()=user_id) WITH CHECK (auth.uid()=user_id);

-- QUIZ ATTEMPTS
CREATE TABLE public.quiz_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  quiz_id uuid NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  score integer NOT NULL DEFAULT 0,
  total integer NOT NULL DEFAULT 0,
  answers jsonb NOT NULL DEFAULT '[]'::jsonb,
  taken_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.quiz_attempts TO authenticated;
GRANT ALL ON public.quiz_attempts TO service_role;
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own attempts" ON public.quiz_attempts FOR ALL TO authenticated USING (auth.uid()=user_id) WITH CHECK (auth.uid()=user_id);

-- BOOKMARKS
CREATE TABLE public.bookmarks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  item_type text NOT NULL,
  item_id uuid NOT NULL,
  label text NOT NULL DEFAULT '',
  subject text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, item_type, item_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bookmarks TO authenticated;
GRANT ALL ON public.bookmarks TO service_role;
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own bookmarks" ON public.bookmarks FOR ALL TO authenticated USING (auth.uid()=user_id) WITH CHECK (auth.uid()=user_id);

-- AI SETTINGS
CREATE TABLE public.ai_settings (
  user_id uuid PRIMARY KEY,
  default_provider text NOT NULL DEFAULT 'gemini',
  providers jsonb NOT NULL DEFAULT '{}'::jsonb,
  module_config jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_settings TO authenticated;
GRANT ALL ON public.ai_settings TO service_role;
ALTER TABLE public.ai_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own ai settings" ON public.ai_settings FOR ALL TO authenticated USING (auth.uid()=user_id) WITH CHECK (auth.uid()=user_id);
CREATE TRIGGER ai_settings_updated BEFORE UPDATE ON public.ai_settings FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- GOOGLE CALENDAR CONNECTIONS (per-user OAuth via App User Connector)
CREATE TABLE public.google_calendar_connections (
  user_id uuid PRIMARY KEY,
  connection_api_key text NOT NULL,
  sync_enabled boolean NOT NULL DEFAULT true,
  calendar_id text NOT NULL DEFAULT 'primary',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.google_calendar_connections TO authenticated;
GRANT ALL ON public.google_calendar_connections TO service_role;
ALTER TABLE public.google_calendar_connections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own gcal" ON public.google_calendar_connections FOR ALL TO authenticated USING (auth.uid()=user_id) WITH CHECK (auth.uid()=user_id);
CREATE TRIGGER gcal_updated BEFORE UPDATE ON public.google_calendar_connections FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- Add google_event_id to assignments for sync tracking
ALTER TABLE public.assignments ADD COLUMN IF NOT EXISTS google_event_id text;
