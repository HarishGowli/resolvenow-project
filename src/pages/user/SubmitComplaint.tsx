import { useState, useRef } from 'react';
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
import { supabase } from '@/integrations/supabase/client';
import { Paperclip, X, FileText, ImageIcon } from 'lucide-react';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

export default function SubmitComplaint() {
  const { user } = useAuth();
  const { addComplaint } = useData();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [priority, setPriority] = useState<Priority>('medium');
  const [category, setCategory] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!user) return null;

  const handleFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    const valid = selected.filter(f => {
      if (f.size > MAX_FILE_SIZE) {
        toast({ title: 'File too large', description: `${f.name} exceeds 10MB limit.`, variant: 'destructive' });
        return false;
      }
      if (!ACCEPTED_TYPES.includes(f.type)) {
        toast({ title: 'Invalid file type', description: `${f.name} is not supported.`, variant: 'destructive' });
        return false;
      }
      return true;
    });
    setFiles(prev => [...prev, ...valid].slice(0, 5));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const uploadFiles = async (complaintId: string) => {
    for (const file of files) {
      const ext = file.name.split('.').pop();
      const filePath = `${user.id}/${complaintId}/${crypto.randomUUID()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('complaint-attachments')
        .upload(filePath, file);

      if (uploadError) {
        console.error('Upload error:', uploadError);
        continue;
      }

      await supabase.from('complaint_attachments').insert({
        complaint_id: complaintId,
        user_id: user.id,
        file_name: file.name,
        file_path: filePath,
        file_size: file.size,
        content_type: file.type,
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const title = (form.get('title') as string).trim();
    const description = (form.get('description') as string).trim();

    if (!title || !description || !category) {
      toast({ title: 'Error', description: 'Please fill all required fields.', variant: 'destructive' });
      return;
    }

    setLoading(true);

    // Insert complaint and get its ID
    const { data: inserted, error } = await supabase.from('complaints').insert({
      title,
      description,
      category,
      priority: priority as any,
      user_id: user.id,
      user_name: user.name,
      address: (form.get('address') as string) || null,
      product_name: (form.get('productName') as string) || null,
      purchase_date: (form.get('purchaseDate') as string) || null,
    }).select('id').single();

    if (error || !inserted) {
      toast({ title: 'Error', description: 'Failed to submit complaint.', variant: 'destructive' });
      setLoading(false);
      return;
    }

    if (files.length > 0) {
      await uploadFiles(inserted.id);
    }

    setLoading(false);
    toast({ title: 'Complaint Submitted!', description: 'Your complaint has been registered successfully.' });
    navigate('/user/complaints');
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <ImageIcon className="h-4 w-4 text-muted-foreground" />;
    return <FileText className="h-4 w-4 text-muted-foreground" />;
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

          {/* File Attachments */}
          <div className="space-y-3">
            <Label>Attachments</Label>
            <div
              className="border-2 border-dashed border-border rounded-lg p-4 text-center cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <Paperclip className="h-6 w-6 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">Click to add files (max 5, 10MB each)</p>
              <p className="text-xs text-muted-foreground mt-1">Images, PDF, DOC supported</p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,.pdf,.doc,.docx"
              className="hidden"
              onChange={handleFilesChange}
            />

            {files.length > 0 && (
              <div className="space-y-2">
                {files.map((file, i) => (
                  <div key={i} className="flex items-center gap-2 bg-secondary/50 rounded-lg px-3 py-2 text-sm">
                    {getFileIcon(file.type)}
                    <span className="flex-1 truncate">{file.name}</span>
                    <span className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(0)}KB</span>
                    <button type="button" onClick={() => removeFile(i)} className="text-muted-foreground hover:text-destructive">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
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
