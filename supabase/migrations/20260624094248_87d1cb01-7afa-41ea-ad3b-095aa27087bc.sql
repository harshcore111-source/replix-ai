
-- Profiles
CREATE TABLE public.profiles (
  id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  business_name TEXT,
  business_type TEXT,
  default_language TEXT NOT NULL DEFAULT 'English',
  default_tone TEXT NOT NULL DEFAULT 'Professional',
  default_length TEXT NOT NULL DEFAULT 'Medium',
  custom_instruction TEXT,
  onboarded BOOLEAN NOT NULL DEFAULT false,
  theme TEXT NOT NULL DEFAULT 'light',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_profile" ON public.profiles FOR ALL USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Reviews
CREATE TABLE public.reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  customer_name TEXT,
  rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  review_text TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- pending | replied
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX reviews_user_idx ON public.reviews(user_id, created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reviews TO authenticated;
GRANT ALL ON public.reviews TO service_role;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_reviews" ON public.reviews FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Replies
CREATE TABLE public.replies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  review_id UUID NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reply_text TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX replies_review_idx ON public.replies(review_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.replies TO authenticated;
GRANT ALL ON public.replies TO service_role;
ALTER TABLE public.replies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_replies" ON public.replies FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Usage
CREATE TABLE public.usage (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  replies_used INT NOT NULL DEFAULT 0,
  plan_type TEXT NOT NULL DEFAULT 'free', -- free | starter | growth
  billing_cycle_start TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.usage TO authenticated;
GRANT ALL ON public.usage TO service_role;
ALTER TABLE public.usage ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_usage" ON public.usage FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Auto-create profile + usage on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email) VALUES (NEW.id, NEW.email) ON CONFLICT DO NOTHING;
  INSERT INTO public.usage (user_id) VALUES (NEW.id) ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Auto monthly reset helper
CREATE OR REPLACE FUNCTION public.reset_if_cycle_elapsed(u UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.usage
  SET replies_used = 0, billing_cycle_start = now(), updated_at = now()
  WHERE user_id = u AND billing_cycle_start < now() - INTERVAL '30 days';
END;
$$;
