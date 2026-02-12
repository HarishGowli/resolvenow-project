import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Priority } from '@/types';

export default function SubmitComplaint() {
  const { user } = useAuth();
  const { addComplaint } = useData();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [priority, setPriority] = useState<Priority>('medium');
  const [category, setCategory] = useState('');

  if (!user) return null;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const title = (form.get('title') as string).trim();
    const description = (form.get('description') as string).trim();

    if (!title || !description || !category) {
      toast({ title: 'Error', description: 'Please fill all required fields.', variant: 'destructive' });
      return;
    }

    setLoading(true);
    addComplaint({
      title,
      description,
      category,
      priority,
      userId: user.id,
      userName: user.name,
      address: (form.get('address') as string) || undefined,
      productName: (form.get('productName') as string) || undefined,
      purchaseDate: (form.get('purchaseDate') as string) || undefined,
    });
    setLoading(false);
    toast({ title: 'Complaint Submitted!', description: 'Your complaint has been registered successfully.' });
    navigate('/user/complaints');
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl">
        <h1 className="text-2xl font-bold mb-6">Submit a Complaint</h1>
        <form onSubmit={handleSubmit} className="space-y-5 bg-card p-6 rounded-xl border border-border">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Complaint Title *</Label>
              <Input id="title" name="title" required placeholder="Brief title" maxLength={100} />
            </div>
            <div className="space-y-2">
              <Label>Category *</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Product Quality">Product Quality</SelectItem>
                  <SelectItem value="Delivery">Delivery</SelectItem>
                  <SelectItem value="Billing">Billing</SelectItem>
                  <SelectItem value="Service">Service</SelectItem>
                  <SelectItem value="Technical">Technical</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea id="description" name="description" required placeholder="Describe your complaint in detail..." rows={4} maxLength={1000} />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Priority *</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as Priority)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="productName">Product / Service Name</Label>
              <Input id="productName" name="productName" placeholder="Optional" />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input id="address" name="address" placeholder="Optional" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="purchaseDate">Purchase Date</Label>
              <Input id="purchaseDate" name="purchaseDate" type="date" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="file">Attachment</Label>
            <Input id="file" type="file" accept="image/*,.pdf,.doc,.docx" />
            <p className="text-xs text-muted-foreground">Supported: images, PDF, DOC (max 10MB)</p>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={loading}>
              {loading ? 'Submitting...' : 'Submit Complaint'}
            </Button>
            <Button type="button" variant="outline" onClick={() => navigate(-1)}>
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
