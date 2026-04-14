CREATE TABLE public.goal_checkins (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  goal_id UUID NOT NULL REFERENCES public.goals(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  amount NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(goal_id, date)
);

ALTER TABLE public.goal_checkins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own checkins"
ON public.goal_checkins
FOR ALL
TO public
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_goal_checkins_goal_date ON public.goal_checkins(goal_id, date);
CREATE INDEX idx_goal_checkins_user ON public.goal_checkins(user_id);