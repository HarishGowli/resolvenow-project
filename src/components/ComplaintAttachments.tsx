import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { FileText, ImageIcon, Download, Paperclip } from 'lucide-react';

interface Attachment {
  id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  content_type: string | null;
  created_at: string;
}

export default function ComplaintAttachments({ complaintId }: { complaintId: string }) {
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from('complaint_attachments')
        .select('*')
        .eq('complaint_id', complaintId)
        .order('created_at', { ascending: true });
      if (data) setAttachments(data);
      setLoading(false);
    };
    fetch();
  }, [complaintId]);

  if (loading) return null;
  if (attachments.length === 0) return null;

  const getUrl = (path: string) => {
    const { data } = supabase.storage.from('complaint-attachments').getPublicUrl(path);
    return data.publicUrl;
  };

  const isImage = (type: string | null) => type?.startsWith('image/');

  return (
    <div className="bg-card rounded-xl border border-border p-5 space-y-3">
      <h3 className="font-semibold text-sm flex items-center gap-2">
        <Paperclip className="h-4 w-4" />
        Attachments ({attachments.length})
      </h3>
      <div className="grid gap-2">
        {attachments.map(att => {
          const url = getUrl(att.file_path);
          return (
            <div key={att.id}>
              {isImage(att.content_type) ? (
                <a href={url} target="_blank" rel="noopener noreferrer" className="block">
                  <img
                    src={url}
                    alt={att.file_name}
                    className="rounded-lg max-h-48 object-cover border border-border"
                  />
                </a>
              ) : (
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 bg-secondary/50 rounded-lg px-3 py-2 text-sm hover:bg-secondary transition-colors"
                >
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="flex-1 truncate">{att.file_name}</span>
                  <span className="text-xs text-muted-foreground">{(att.file_size / 1024).toFixed(0)}KB</span>
                  <Download className="h-4 w-4 text-muted-foreground" />
                </a>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
