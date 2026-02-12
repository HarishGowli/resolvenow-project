import { useData } from '@/contexts/DataContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import StatCard from '@/components/StatCard';
import StatusBadge from '@/components/StatusBadge';
import { Users, FileText, UserCheck, TrendingUp } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

const CHART_COLORS = {
  pending: 'hsl(30, 90%, 55%)',
  assigned: 'hsl(210, 80%, 55%)',
  'in-progress': 'hsl(270, 60%, 55%)',
  resolved: 'hsl(150, 70%, 42%)',
};

export default function AdminDashboard() {
  const { complaints } = useData();

  const statusCounts = {
    pending: complaints.filter(c => c.status === 'pending').length,
    assigned: complaints.filter(c => c.status === 'assigned').length,
    'in-progress': complaints.filter(c => c.status === 'in-progress').length,
    resolved: complaints.filter(c => c.status === 'resolved').length,
  };

  const pieData = Object.entries(statusCounts).map(([name, value]) => ({ name, value }));

  const categoryCounts: Record<string, number> = {};
  complaints.forEach(c => {
    categoryCounts[c.category] = (categoryCounts[c.category] || 0) + 1;
  });
  const barData = Object.entries(categoryCounts).map(([name, value]) => ({ name, value }));

  const resolutionRate = complaints.length > 0
    ? Math.round((statusCounts.resolved / complaints.length) * 100)
    : 0;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Total Complaints" value={complaints.length} icon={FileText} />
          <StatCard title="Pending" value={statusCounts.pending} icon={FileText} variant="pending" />
          <StatCard title="In Progress" value={statusCounts.assigned + statusCounts['in-progress']} icon={UserCheck} variant="in-progress" />
          <StatCard title="Resolution Rate" value={`${resolutionRate}%`} icon={TrendingUp} variant="resolved" />
        </div>

        {/* Charts */}
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="bg-card rounded-xl border border-border p-5">
            <h3 className="font-semibold mb-4">Status Distribution</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={90}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                  labelLine={false}
                >
                  {pieData.map((entry) => (
                    <Cell key={entry.name} fill={CHART_COLORS[entry.name as keyof typeof CHART_COLORS]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-card rounded-xl border border-border p-5">
            <h3 className="font-semibold mb-4">Complaints by Category</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 15%, 90%)" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="value" fill="hsl(215, 80%, 22%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* All complaints */}
        <div className="bg-card rounded-xl border border-border">
          <div className="p-4 border-b border-border">
            <h2 className="font-semibold">All Complaints</h2>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Agent</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {complaints.map(c => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.title}</TableCell>
                  <TableCell className="text-muted-foreground">{c.userName}</TableCell>
                  <TableCell className="text-muted-foreground">{c.agentName || '—'}</TableCell>
                  <TableCell className="text-muted-foreground">{c.category}</TableCell>
                  <TableCell><StatusBadge status={c.status} /></TableCell>
                  <TableCell className={`capitalize font-medium priority-${c.priority}`}>{c.priority}</TableCell>
                  <TableCell className="text-muted-foreground">{new Date(c.createdAt).toLocaleDateString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </DashboardLayout>
  );
}
