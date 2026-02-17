import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Star } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface FeedbackData {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
}

export default function ComplaintFeedback({ complaintId, complaintStatus, complaintUserId }: {
  complaintId: string;
  complaintStatus: string;
  complaintUserId: string;
}) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [feedback, setFeedback] = useState<FeedbackData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');

  useEffect(() => {
    const fetchFeedback = async () => {
      const { data } = await supabase
        .from('complaint_feedback')
        .select('*')
        .eq('complaint_id', complaintId)
        .maybeSingle();
      if (data) setFeedback(data as FeedbackData);
      setLoading(false);
    };
    fetchFeedback();
  }, [complaintId]);

  if (loading || complaintStatus !== 'resolved') return null;

  const isOwner = user?.id === complaintUserId;

  // Already submitted feedback
  if (feedback) {
    return (
      <div className="bg-card rounded-xl border border-border p-5 space-y-3">
        <h3 className="font-semibold text-sm">Resolution Feedback</h3>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map(i => (
            <Star key={i} className={`h-5 w-5 ${i <= feedback.rating ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground'}`} />
          ))}
          <span className="ml-2 text-sm text-muted-foreground">{feedback.rating}/5</span>
        </div>
        {feedback.comment && (
          <p className="text-sm text-muted-foreground">{feedback.comment}</p>
        )}
      </div>
    );
  }

  // Only the complaint owner can submit feedback
  if (!isOwner) return null;

  const handleSubmit = async () => {
    if (rating === 0) {
      toast({ title: 'Rating required', description: 'Please select a star rating.', variant: 'destructive' });
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from('complaint_feedback').insert({
      complaint_id: complaintId,
      user_id: user!.id,
      rating,
      comment: comment.trim() || null,
    });
    if (error) {
      toast({ title: 'Error', description: 'Failed to submit feedback.', variant: 'destructive' });
    } else {
      setFeedback({ id: '', rating, comment: comment.trim() || null, created_at: new Date().toISOString() });
      toast({ title: 'Thank you!', description: 'Your feedback has been submitted.' });
    }
    setSubmitting(false);
  };

  return (
    <div className="bg-card rounded-xl border border-border p-5 space-y-3">
      <h3 className="font-semibold text-sm">Rate this Resolution</h3>
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map(i => (
          <button
            key={i}
            type="button"
            onMouseEnter={() => setHoveredRating(i)}
            onMouseLeave={() => setHoveredRating(0)}
            onClick={() => setRating(i)}
            className="focus:outline-none"
          >
            <Star className={`h-6 w-6 transition-colors ${
              i <= (hoveredRating || rating) ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground'
            }`} />
          </button>
        ))}
      </div>
      <Textarea
        placeholder="Optional comment about the resolution..."
        value={comment}
        onChange={e => setComment(e.target.value)}
        rows={2}
        maxLength={500}
      />
      <Button size="sm" onClick={handleSubmit} disabled={submitting || rating === 0}>
        {submitting ? 'Submitting...' : 'Submit Feedback'}
      </Button>
    </div>
  );
}
