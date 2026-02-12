import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import StatCard from '@/components/StatCard';
import StatusBadge from '@/components/StatusBadge';
import { FileText, Clock, AlertCircle, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';

export default function UserDashboard() {
  const { user } = useAuth();
  const { getComplaintsByUser } = useData();

  if (!user) return null;

  const complaints = getComplaintsByUser(user.id);
  const stats = {
    total: complaints.length,
    pending: complaints.filter(c => c.status === 'pending').length,
    inProgress: complaints.filter(c => c.status === 'in-progress' || c.status === 'assigned').length,
    resolved: complaints.filter(c => c.status === 'resolved').length,
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <Link to="/user/complaints/new">
            <Button>New Complaint</Button>
          </Link>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Total Complaints" value={stats.total} icon={FileText} />
          <StatCard title="Pending" value={stats.pending} icon={Clock} variant="pending" />
          <StatCard title="In Progress" value={stats.inProgress} icon={AlertCircle} variant="in-progress" />
          <StatCard title="Resolved" value={stats.resolved} icon={CheckCircle} variant="resolved" />
        </div>

        <div className="bg-card rounded-xl border border-border">
          <div className="p-4 border-b border-border">
            <h2 className="font-semibold">Recent Complaints</h2>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {complaints.slice(0, 5).map(c => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.title}</TableCell>
                  <TableCell className="text-muted-foreground">{c.category}</TableCell>
                  <TableCell><StatusBadge status={c.status} /></TableCell>
                  <TableCell className={`capitalize font-medium priority-${c.priority}`}>{c.priority}</TableCell>
                  <TableCell className="text-muted-foreground">{new Date(c.createdAt).toLocaleDateString()}</TableCell>
                </TableRow>
              ))}
              {complaints.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    No complaints yet. Submit your first complaint!
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
