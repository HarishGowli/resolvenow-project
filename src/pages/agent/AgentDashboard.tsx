import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import StatCard from '@/components/StatCard';
import StatusBadge from '@/components/StatusBadge';
import { ClipboardList, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { ComplaintStatus } from '@/types';
import { useToast } from '@/hooks/use-toast';

export default function AgentDashboard() {
  const { user } = useAuth();
  const { getComplaintsByAgent, updateComplaintStatus } = useData();
  const { toast } = useToast();
  const navigate = useNavigate();

  if (!user) return null;

  const complaints = getComplaintsByAgent(user.id);
  const stats = {
    total: complaints.length,
    active: complaints.filter(c => c.status === 'assigned' || c.status === 'in-progress').length,
    resolved: complaints.filter(c => c.status === 'resolved').length,
  };

  const handleStatusChange = (id: string, status: ComplaintStatus) => {
    updateComplaintStatus(id, status);
    toast({ title: 'Status Updated', description: `Complaint status changed to ${status}.` });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Agent Dashboard</h1>

        <div className="grid sm:grid-cols-3 gap-4">
          <StatCard title="Assigned Complaints" value={stats.total} icon={ClipboardList} />
          <StatCard title="Active" value={stats.active} icon={Clock} variant="assigned" />
          <StatCard title="Resolved" value={stats.resolved} icon={CheckCircle} variant="resolved" />
        </div>

        <div className="bg-card rounded-xl border border-border">
          <div className="p-4 border-b border-border">
            <h2 className="font-semibold">Assigned Complaints</h2>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Update Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {complaints.map(c => (
                <TableRow key={c.id} className="cursor-pointer hover:bg-secondary/50" onClick={() => navigate(`/complaints/${c.id}`)}>
                  <TableCell className="font-medium">{c.title}</TableCell>
                  <TableCell className="text-muted-foreground">{c.userName}</TableCell>
                  <TableCell className={`capitalize font-medium priority-${c.priority}`}>{c.priority}</TableCell>
                  <TableCell><StatusBadge status={c.status} /></TableCell>
                  <TableCell>
                    <Select
                      value={c.status}
                      onValueChange={(v) => handleStatusChange(c.id, v as ComplaintStatus)}
                    >
                      <SelectTrigger className="w-36 h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="assigned">Assigned</SelectItem>
                        <SelectItem value="in-progress">In Progress</SelectItem>
                        <SelectItem value="resolved">Resolved</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
              ))}
              {complaints.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    No complaints assigned to you yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </DashboardLayout>
  );
}
