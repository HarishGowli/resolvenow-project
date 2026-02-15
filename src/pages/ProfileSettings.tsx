import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { User, Mail, Shield, Calendar, Camera, Save, Lock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export default function ProfileSettings() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [name, setName] = useState(user?.name || '');
  const [avatarInitial, setAvatarInitial] = useState(user?.name?.charAt(0) || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  if (!user) return null;

  const handleSaveProfile = async () => {
    if (!name.trim()) {
      toast({ title: 'Error', description: 'Name cannot be empty.', variant: 'destructive' });
      return;
    }
    const { error } = await supabase
      .from('profiles')
      .update({ name })
      .eq('user_id', user.id);
    if (error) {
      toast({ title: 'Error', description: 'Failed to update profile.', variant: 'destructive' });
    } else {
      setAvatarInitial(name.charAt(0));
      toast({ title: 'Profile updated', description: 'Your name has been saved successfully.' });
    }
  };

  const handleChangePassword = async () => {
    if (!newPassword || !confirmPassword) {
      toast({ title: 'Error', description: 'Please fill all password fields.', variant: 'destructive' });
      return;
    }
    if (newPassword.length < 6) {
      toast({ title: 'Error', description: 'New password must be at least 6 characters.', variant: 'destructive' });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: 'Error', description: 'New passwords do not match.', variant: 'destructive' });
      return;
    }
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      setNewPassword('');
      setConfirmPassword('');
      toast({ title: 'Password updated', description: 'Your password has been changed successfully.' });
    }
  };

  const roleBadgeClass: Record<string, string> = {
    user: 'bg-blue-100 text-blue-700 border-blue-200',
    agent: 'bg-purple-100 text-purple-700 border-purple-200',
    admin: 'bg-amber-100 text-amber-700 border-amber-200',
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold">Profile Settings</h1>

        {/* Avatar & Info Card */}
        <div className="bg-card rounded-xl border border-border p-6">
          <div className="flex items-center gap-5">
            <div className="relative">
              <div className="h-20 w-20 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-3xl font-bold">
                {avatarInitial}
              </div>
              <button className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full bg-secondary border border-border flex items-center justify-center hover:bg-accent transition-colors">
                <Camera className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            </div>
            <div className="space-y-1">
              <h2 className="text-lg font-semibold">{name || user.name}</h2>
              <p className="text-sm text-muted-foreground">{user.email}</p>
              <Badge variant="outline" className={`capitalize ${roleBadgeClass[user.role] || ''}`}>
                {user.role}
              </Badge>
            </div>
          </div>
        </div>

        {/* Edit Profile */}
        <div className="bg-card rounded-xl border border-border p-6 space-y-4">
          <h3 className="font-semibold flex items-center gap-2">
            <User className="h-4 w-4" /> Personal Information
          </h3>
          <Separator />
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" value={name} onChange={e => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <Input id="email" value={user.email} disabled className="bg-muted" />
              </div>
              <p className="text-xs text-muted-foreground">Email cannot be changed.</p>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Role</Label>
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  <Input value={user.role.toUpperCase()} disabled className="bg-muted" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Member Since</Label>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <Input value={new Date(user.createdAt).toLocaleDateString()} disabled className="bg-muted" />
                </div>
              </div>
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={handleSaveProfile} className="gap-2">
              <Save className="h-4 w-4" /> Save Changes
            </Button>
          </div>
        </div>

        {/* Change Password */}
        <div className="bg-card rounded-xl border border-border p-6 space-y-4">
          <h3 className="font-semibold flex items-center gap-2">
            <Lock className="h-4 w-4" /> Change Password
          </h3>
          <Separator />
          <div className="grid gap-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="new-pw">New Password</Label>
                <Input id="new-pw" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-pw">Confirm Password</Label>
                <Input id="confirm-pw" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
              </div>
            </div>
          </div>
          <div className="flex justify-end">
            <Button variant="outline" onClick={handleChangePassword} className="gap-2">
              <Lock className="h-4 w-4" /> Update Password
            </Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
