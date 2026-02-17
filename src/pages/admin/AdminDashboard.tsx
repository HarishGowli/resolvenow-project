import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '@/contexts/DataContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import StatCard from '@/components/StatCard';
import StatusBadge from '@/components/StatusBadge';
import { Users, FileText, UserCheck, TrendingUp, Search, Download, ArrowUpDown } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, LineChart, Line, Legend } from 'recharts';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Complaint, ComplaintStatus } from '@/types';

const CHART_COLORS = {
  pending: 'hsl(30, 90%, 55%)',
  assigned: 'hsl(210, 80%, 55%)',
  'in-progress': 'hsl(270, 60%, 55%)',
  resolved: 'hsl(150, 70%, 42%)',
};

interface Agent {
  user_id: string;
  name: string;
}

export default function AdminDashboard() {
  const { complaints, updateComplaintStatus } = useData();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');

  // Assignment
  const [agents, setAgents] = useState<Agent[]>([]);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [selectedAgent, setSelectedAgent] = useState('');

  useEffect(() => {
    const fetchAgents = async () => {
      const { data: roles } = await supabase.from('user_roles').select('user_id').in('role', ['agent', 'admin']);
      if (roles && roles.length > 0) {
        const userIds = roles.map(r => r.user_id);
        const { data: profiles } = await supabase.from('profiles').select('user_id, name').in('user_id', userIds);
        if (profiles) setAgents(profiles);
      }
    };
    fetchAgents();
  }, []);

  const filtered = useMemo(() => {
    return complaints.filter(c => {
      const s = search.toLowerCase();
      const matchesSearch = !s || c.title.toLowerCase().includes(s) || c.userName.toLowerCase().includes(s) || c.category.toLowerCase().includes(s);
      const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
      const matchesCategory = categoryFilter === 'all' || c.category === categoryFilter;
      const matchesPriority = priorityFilter === 'all' || c.priority === priorityFilter;
      return matchesSearch && matchesStatus && matchesCategory && matchesPriority;
    });
  }, [complaints, search, statusFilter, categoryFilter, priorityFilter]);

  const categories = useMemo(() => [...new Set(complaints.map(c => c.category))], [complaints]);

  const statusCounts = {
    pending: complaints.filter(c => c.status === 'pending').length,
    assigned: complaints.filter(c => c.status === 'assigned').length,
    'in-progress': complaints.filter(c => c.status === 'in-progress').length,
    resolved: complaints.filter(c => c.status === 'resolved').length,
  };

  const pieData = Object.entries(statusCounts).map(([name, value]) => ({ name, value }));

  const categoryCounts: Record<string, number> = {};
  complaints.forEach(c => { categoryCounts[c.category] = (categoryCounts[c.category] || 0) + 1; });
  const barData = Object.entries(categoryCounts).map(([name, value]) => ({ name, value }));

  // Trend data - complaints per day (last 30 days)
  const trendData = useMemo(() => {
    const days: Record<string, { date: string; total: number; resolved: number }> = {};
    const now = new Date();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      days[key] = { date: key, total: 0, resolved: 0 };
    }
    complaints.forEach(c => {
      const key = new Date(c.createdAt).toISOString().slice(0, 10);
      if (days[key]) { days[key].total++; }
      if (c.status === 'resolved') {
        const rKey = new Date(c.updatedAt).toISOString().slice(0, 10);
        if (days[rKey]) { days[rKey].resolved++; }
      }
    });
    return Object.values(days).map(d => ({ ...d, date: d.date.slice(5) }));
  }, [complaints]);

  const resolutionRate = complaints.length > 0
    ? Math.round((statusCounts.resolved / complaints.length) * 100)
    : 0;

  const handleAssign = async () => {
    if (!selectedComplaint || !selectedAgent) return;
    const agent = agents.find(a => a.user_id === selectedAgent);
    if (!agent) return;

    const { error } = await supabase
      .from('complaints')
      .update({ agent_id: selectedAgent, agent_name: agent.name, status: 'assigned' as any })
      .eq('id', selectedComplaint.id);

    if (error) {
      toast({ title: 'Error', description: 'Failed to assign complaint.', variant: 'destructive' });
    } else {
      toast({ title: 'Assigned', description: `Complaint assigned to ${agent.name}.` });
      // Trigger refresh via context
      await updateComplaintStatus(selectedComplaint.id, 'assigned');
    }
    setAssignDialogOpen(false);
    setSelectedComplaint(null);
    setSelectedAgent('');
  };

  const exportCSV = () => {
    const headers = ['Title', 'User', 'Agent', 'Category', 'Status', 'Priority', 'Date'];
    const rows = filtered.map(c => [
      `"${c.title}"`, c.userName, c.agentName || '', c.category, c.status, c.priority,
      new Date(c.createdAt).toLocaleDateString(),
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `complaints-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <Button variant="outline" size="sm" onClick={exportCSV}>
            <Download className="h-4 w-4 mr-2" /> Export CSV
          </Button>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Total Complaints" value={complaints.length} icon={FileText} />
          <StatCard title="Pending" value={statusCounts.pending} icon={FileText} variant="pending" />
          <StatCard title="In Progress" value={statusCounts.assigned + statusCounts['in-progress']} icon={UserCheck} variant="in-progress" />
          <StatCard title="Resolution Rate" value={`${resolutionRate}%`} icon={TrendingUp} variant="resolved" />
        </div>

        {/* Charts */}
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="bg-card rounded-xl border border-border p-5">
            <h3 className="font-semibold mb-4">Status Distribution</h3>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`} labelLine={false}>
                  {pieData.map((entry) => (
                    <Cell key={entry.name} fill={CHART_COLORS[entry.name as keyof typeof CHART_COLORS]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-card rounded-xl border border-border p-5">
            <h3 className="font-semibold mb-4">By Category</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 15%, 90%)" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="value" fill="hsl(215, 80%, 22%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-card rounded-xl border border-border p-5">
            <h3 className="font-semibold mb-4">30-Day Trend</h3>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 15%, 90%)" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="total" stroke="hsl(215, 80%, 22%)" strokeWidth={2} dot={false} name="New" />
                <Line type="monotone" dataKey="resolved" stroke="hsl(150, 70%, 42%)" strokeWidth={2} dot={false} name="Resolved" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search complaints..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="assigned">Assigned</SelectItem>
              <SelectItem value="in-progress">In Progress</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
            </SelectContent>
          </Select>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-40"><SelectValue placeholder="Category" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-36"><SelectValue placeholder="Priority" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priority</SelectItem>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Complaints table */}
        <div className="bg-card rounded-xl border border-border">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h2 className="font-semibold">All Complaints ({filtered.length})</h2>
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
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(c => (
                <TableRow key={c.id} className="cursor-pointer hover:bg-secondary/50">
                  <TableCell className="font-medium" onClick={() => navigate(`/complaints/${c.id}`)}>{c.title}</TableCell>
                  <TableCell className="text-muted-foreground">{c.userName}</TableCell>
                  <TableCell className="text-muted-foreground">{c.agentName || '—'}</TableCell>
                  <TableCell className="text-muted-foreground">{c.category}</TableCell>
                  <TableCell><StatusBadge status={c.status} /></TableCell>
                  <TableCell className={`capitalize font-medium priority-${c.priority}`}>{c.priority}</TableCell>
                  <TableCell className="text-muted-foreground">{new Date(c.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell>
                    {!c.agentId && (
                      <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); setSelectedComplaint(c); setAssignDialogOpen(true); }}>
                        Assign
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-8">No complaints match filters.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Assign Agent Dialog */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Assign Agent</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground mb-2">
            Assign <strong>{selectedComplaint?.title}</strong> to an agent:
          </p>
          <Select value={selectedAgent} onValueChange={setSelectedAgent}>
            <SelectTrigger><SelectValue placeholder="Select an agent" /></SelectTrigger>
            <SelectContent>
              {agents.map(a => (
                <SelectItem key={a.user_id} value={a.user_id}>{a.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAssign} disabled={!selectedAgent}>Assign</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
