
-- Create storage bucket for complaint attachments
INSERT INTO storage.buckets (id, name, public) VALUES ('complaint-attachments', 'complaint-attachments', true);

-- Allow authenticated users to upload files to their own folder
CREATE POLICY "Users can upload complaint attachments"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'complaint-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow anyone to view attachments (public bucket)
CREATE POLICY "Anyone can view complaint attachments"
ON storage.objects FOR SELECT
USING (bucket_id = 'complaint-attachments');

-- Allow users to delete their own attachments
CREATE POLICY "Users can delete own attachments"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'complaint-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create table to track attachments per complaint
CREATE TABLE public.complaint_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  complaint_id UUID NOT NULL REFERENCES public.complaints(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER NOT NULL DEFAULT 0,
  content_type TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.complaint_attachments ENABLE ROW LEVEL SECURITY;

-- Users can see attachments on their own complaints
CREATE POLICY "Users can view own complaint attachments"
ON public.complaint_attachments FOR SELECT
USING (
  EXISTS (SELECT 1 FROM public.complaints WHERE id = complaint_id AND user_id = auth.uid())
);

-- Agents can view attachments on complaints they can see
CREATE POLICY "Agents can view complaint attachments"
ON public.complaint_attachments FOR SELECT
USING (has_role(auth.uid(), 'agent'::app_role));

-- Admins can view all attachments
CREATE POLICY "Admins can view all attachments"
ON public.complaint_attachments FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Users can insert attachments on their own complaints
CREATE POLICY "Users can add attachments to own complaints"
ON public.complaint_attachments FOR INSERT
WITH CHECK (
  user_id = auth.uid() AND
  EXISTS (SELECT 1 FROM public.complaints WHERE id = complaint_id AND user_id = auth.uid())
);
