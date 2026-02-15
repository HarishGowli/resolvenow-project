
-- Create role enum
CREATE TYPE public.app_role AS ENUM ('user', 'agent', 'admin');

-- User roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Complaints table
CREATE TYPE public.complaint_status AS ENUM ('pending', 'assigned', 'in-progress', 'resolved');
CREATE TYPE public.complaint_priority AS ENUM ('low', 'medium', 'high');

CREATE TABLE public.complaints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  status complaint_status NOT NULL DEFAULT 'pending',
  priority complaint_priority NOT NULL DEFAULT 'medium',
  category TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  user_name TEXT NOT NULL,
  agent_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  agent_name TEXT,
  address TEXT,
  product_name TEXT,
  purchase_date TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;

-- Chat messages table
CREATE TABLE public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  complaint_id UUID REFERENCES public.complaints(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  sender_name TEXT NOT NULL,
  sender_role app_role NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Notifications table
CREATE TYPE public.notification_type AS ENUM ('status_update', 'assignment', 'message', 'resolution');

CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT false,
  type notification_type NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Security definer function to check complaint participation
CREATE OR REPLACE FUNCTION public.is_complaint_participant(_user_id UUID, _complaint_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.complaints
    WHERE id = _complaint_id AND (user_id = _user_id OR agent_id = _user_id)
  )
$$;

-- Trigger: auto-create profile and role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', 'User'), NEW.email);
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'user'));
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_complaints_updated_at
  BEFORE UPDATE ON public.complaints
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- RLS Policies: user_roles
CREATE POLICY "Users can read own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Admins can read all roles" ON public.user_roles
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage roles" ON public.user_roles
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies: profiles
CREATE POLICY "Users can read own profile" ON public.profiles
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Admins can read all profiles" ON public.profiles
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Agents can read all profiles" ON public.profiles
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'agent'));

-- RLS Policies: complaints
CREATE POLICY "Users can read own complaints" ON public.complaints
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can create complaints" ON public.complaints
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "Agents can read assigned complaints" ON public.complaints
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'agent'));

CREATE POLICY "Agents can update assigned complaints" ON public.complaints
  FOR UPDATE TO authenticated USING (agent_id = auth.uid() AND public.has_role(auth.uid(), 'agent'));

CREATE POLICY "Admins can do everything on complaints" ON public.complaints
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies: chat_messages
CREATE POLICY "Participants can read messages" ON public.chat_messages
  FOR SELECT TO authenticated USING (public.is_complaint_participant(auth.uid(), complaint_id));

CREATE POLICY "Participants can send messages" ON public.chat_messages
  FOR INSERT TO authenticated WITH CHECK (sender_id = auth.uid() AND public.is_complaint_participant(auth.uid(), complaint_id));

CREATE POLICY "Admins can read all messages" ON public.chat_messages
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies: notifications
CREATE POLICY "Users can read own notifications" ON public.notifications
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications" ON public.notifications
  FOR UPDATE TO authenticated USING (user_id = auth.uid());
