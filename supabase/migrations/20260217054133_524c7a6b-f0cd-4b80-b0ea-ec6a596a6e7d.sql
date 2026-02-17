
-- Create complaint_feedback table for resolution ratings
CREATE TABLE public.complaint_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  complaint_id UUID NOT NULL REFERENCES public.complaints(id) ON DELETE CASCADE UNIQUE,
  user_id UUID NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.complaint_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own feedback"
ON public.complaint_feedback FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Agents can view feedback on their complaints"
ON public.complaint_feedback FOR SELECT
USING (has_role(auth.uid(), 'agent'::app_role));

CREATE POLICY "Admins can view all feedback"
ON public.complaint_feedback FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can submit feedback on own resolved complaints"
ON public.complaint_feedback FOR INSERT
WITH CHECK (
  user_id = auth.uid() AND
  EXISTS (SELECT 1 FROM public.complaints WHERE id = complaint_id AND user_id = auth.uid() AND status = 'resolved')
);
