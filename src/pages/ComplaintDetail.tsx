import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import StatusBadge from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { ComplaintStatus } from '@/types';
import {
  ArrowLeft, Send, Clock, CheckCircle2, UserCheck, Loader2,
  AlertTriangle, Calendar, MapPin, Package, Tag,
} from 'lucide-react';

const STATUS_STEPS: { status: ComplaintStatus; label: string; icon: typeof Clock }[] = [
  { status: 'pending', label: 'Pending', icon: Clock },
  { status: 'assigned', label: 'Assigned', icon: UserCheck },
  { status: 'in-progress', label: 'In Progress', icon: Loader2 },
  { status: 'resolved', label: 'Resolved', icon: CheckCircle2 },
];

const statusOrder: Record<ComplaintStatus, number> = {
  pending: 0,
  assigned: 1,
  'in-progress': 2,
  resolved: 3,
};

const statusColor: Record<ComplaintStatus, string> = {
  pending: 'hsl(30, 90%, 55%)',
  assigned: 'hsl(210, 80%, 55%)',
  'in-progress': 'hsl(270, 60%, 55%)',
  resolved: 'hsl(150, 70%, 42%)',
};

export default function ComplaintDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { complaints, getMessagesByComplaint, sendMessage, updateComplaintStatus } = useData();
  const [msgText, setMsgText] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  const complaint = complaints.find(c => c.id === id);
  const messages = id ? getMessagesByComplaint(id) : [];

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  if (!user || !complaint) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <AlertTriangle className="h-12 w-12 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">Complaint Not Found</h2>
          <p className="text-muted-foreground mb-4">This complaint doesn't exist or you don't have access.</p>
          <Button variant="outline" onClick={() => navigate(-1)}>Go Back</Button>
        </div>
      </DashboardLayout>
    );
  }

  const currentStep = statusOrder[complaint.status];
  const canChat = complaint.agentId && (user.id === complaint.userId || user.id === complaint.agentId || user.role === 'admin');
  const canUpdateStatus = user.role === 'agent' || user.role === 'admin';

  const handleSend = () => {
    if (!msgText.trim() || !id) return;
    sendMessage({
      complaintId: id,
      senderId: user.id,
      senderName: user.name,
      senderRole: user.role,
      message: msgText.trim(),
    });
    setMsgText('');
  };

  const priorityColor: Record<string, string> = {
    low: 'bg-green-100 text-green-700 border-green-200',
    medium: 'bg-amber-100 text-amber-700 border-amber-200',
    high: 'bg-red-100 text-red-700 border-red-200',
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>
          <h1 className="text-xl font-bold flex-1 truncate">{complaint.title}</h1>
          <StatusBadge status={complaint.status} />
        </div>

        {/* Timeline Progress */}
        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="font-semibold mb-4 text-sm">Complaint Timeline</h3>
          <div className="flex items-center justify-between relative">
            {/* Connecting line */}
            <div className="absolute top-5 left-0 right-0 h-0.5 bg-border" />
            <div
              className="absolute top-5 left-0 h-0.5 transition-all duration-500"
              style={{
                width: `${(currentStep / (STATUS_STEPS.length - 1)) * 100}%`,
                backgroundColor: statusColor[complaint.status],
              }}
            />

            {STATUS_STEPS.map((step, i) => {
              const isCompleted = i <= currentStep;
              const isCurrent = i === currentStep;
              const Icon = step.icon;
              return (
                <div key={step.status} className="flex flex-col items-center relative z-10">
                  <div
                    className={`h-10 w-10 rounded-full flex items-center justify-center border-2 transition-colors
                      ${isCompleted
                        ? 'text-white border-transparent'
                        : 'bg-card text-muted-foreground border-border'
                      }
                      ${isCurrent ? 'ring-4 ring-offset-2 ring-offset-card' : ''}`}
                    style={{
                      backgroundColor: isCompleted ? statusColor[step.status] : undefined,
                    }}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <span className={`text-xs mt-2 font-medium ${isCompleted ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Status update buttons for agent/admin */}
          {canUpdateStatus && complaint.status !== 'resolved' && (
            <div className="flex gap-2 mt-5 pt-4 border-t border-border">
              <span className="text-sm text-muted-foreground mr-2 self-center">Update:</span>
              {STATUS_STEPS.filter(s => statusOrder[s.status] > currentStep).map(s => (
                <Button
                  key={s.status}
                  size="sm"
                  variant="outline"
                  onClick={() => updateComplaintStatus(complaint.id, s.status)}
                >
                  Mark as {s.label}
                </Button>
              ))}
            </div>
          )}
        </div>

        <div className="grid lg:grid-cols-5 gap-6">
          {/* Details */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-card rounded-xl border border-border p-5 space-y-4">
              <h3 className="font-semibold text-sm">Complaint Details</h3>
              <Separator />
              <p className="text-sm text-muted-foreground leading-relaxed">{complaint.description}</p>
              <div className="grid gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <Tag className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Category:</span>
                  <span className="font-medium">{complaint.category}</span>
                </div>
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Priority:</span>
                  <Badge variant="outline" className={`capitalize ${priorityColor[complaint.priority]}`}>
                    {complaint.priority}
                  </Badge>
                </div>
                {complaint.productName && (
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Product:</span>
                    <span className="font-medium">{complaint.productName}</span>
                  </div>
                )}
                {complaint.address && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Address:</span>
                    <span className="font-medium">{complaint.address}</span>
                  </div>
                )}
                {complaint.purchaseDate && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Purchase:</span>
                    <span className="font-medium">{new Date(complaint.purchaseDate).toLocaleDateString()}</span>
                  </div>
                )}
                <Separator />
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Filed by:</span>
                  <span className="font-medium">{complaint.userName}</span>
                </div>
                {complaint.agentName && (
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Assigned to:</span>
                    <span className="font-medium">{complaint.agentName}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Created:</span>
                  <span className="font-medium">{new Date(complaint.createdAt).toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Chat */}
          <div className="lg:col-span-3">
            <div className="bg-card rounded-xl border border-border flex flex-col h-[500px]">
              <div className="px-4 py-3 border-b border-border">
                <h3 className="font-semibold text-sm">Messages</h3>
                {!complaint.agentId && (
                  <p className="text-xs text-muted-foreground">Chat will be available once an agent is assigned.</p>
                )}
              </div>

              {/* Messages area */}
              <div className="flex-1 overflow-auto p-4 space-y-3">
                {messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                    No messages yet. Start the conversation!
                  </div>
                ) : (
                  messages.map(msg => {
                    const isOwn = msg.senderId === user.id;
                    return (
                      <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[75%] ${isOwn ? 'order-1' : ''}`}>
                          <div className={`rounded-2xl px-4 py-2.5 text-sm
                            ${isOwn
                              ? 'bg-primary text-primary-foreground rounded-br-md'
                              : 'bg-secondary text-secondary-foreground rounded-bl-md'
                            }`}
                          >
                            {!isOwn && (
                              <p className="text-xs font-semibold mb-1 opacity-70">
                                {msg.senderName} ({msg.senderRole})
                              </p>
                            )}
                            <p>{msg.message}</p>
                          </div>
                          <p className={`text-[10px] text-muted-foreground mt-1 ${isOwn ? 'text-right' : ''}`}>
                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Input */}
              {canChat && complaint.status !== 'resolved' && (
                <div className="p-3 border-t border-border flex gap-2">
                  <Input
                    placeholder="Type a message..."
                    value={msgText}
                    onChange={e => setMsgText(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSend()}
                    className="flex-1"
                  />
                  <Button size="icon" onClick={handleSend} disabled={!msgText.trim()}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              )}

              {complaint.status === 'resolved' && (
                <div className="p-3 border-t border-border text-center text-sm text-muted-foreground">
                  This complaint has been resolved. Chat is closed.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
