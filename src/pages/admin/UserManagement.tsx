import { useState, useMemo } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { UserRole } from '@/types';
import { Search, Trash2, Edit, Users, UserCheck, ShieldCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ManagedUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
}

const DEMO_USERS: ManagedUser[] = [
  { id: '1', name: 'John User', email: 'user@demo.com', role: 'user', createdAt: '2024-01-15' },
  { id: '2', name: 'Sarah Agent', email: 'agent@demo.com', role: 'agent', createdAt: '2024-01-10' },
  { id: '3', name: 'Mike Admin', email: 'admin@demo.com', role: 'admin', createdAt: '2024-01-01' },
  { id: '4', name: 'Alice Johnson', email: 'alice@example.com', role: 'user', createdAt: '2024-02-20' },
  { id: '5', name: 'Bob Smith', email: 'bob@example.com', role: 'user', createdAt: '2024-03-10' },
  { id: '6', name: 'Diana Prince', email: 'diana@example.com', role: 'agent', createdAt: '2024-04-05' },
];

const roleBadgeVariant: Record<UserRole, string> = {
  user: 'bg-blue-100 text-blue-700 border-blue-200',
  agent: 'bg-purple-100 text-purple-700 border-purple-200',
  admin: 'bg-amber-100 text-amber-700 border-amber-200',
};

const roleIcon: Record<UserRole, typeof Users> = {
  user: Users,
  agent: UserCheck,
  admin: ShieldCheck,
};

export default function UserManagement() {
  const [users, setUsers] = useState<ManagedUser[]>(DEMO_USERS);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [editUser, setEditUser] = useState<ManagedUser | null>(null);
  const [editRole, setEditRole] = useState<UserRole>('user');
  const [deleteUser, setDeleteUser] = useState<ManagedUser | null>(null);
  const { toast } = useToast();

  const filtered = useMemo(() => {
    return users.filter(u => {
      const matchesSearch = u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase());
      const matchesRole = roleFilter === 'all' || u.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [users, search, roleFilter]);

  const counts = useMemo(() => ({
    total: users.length,
    user: users.filter(u => u.role === 'user').length,
    agent: users.filter(u => u.role === 'agent').length,
    admin: users.filter(u => u.role === 'admin').length,
  }), [users]);

  const handleEditSave = () => {
    if (!editUser) return;
    setUsers(prev => prev.map(u => u.id === editUser.id ? { ...u, role: editRole } : u));
    toast({ title: 'Role updated', description: `${editUser.name} is now ${editRole}.` });
    setEditUser(null);
  };

  const handleDelete = () => {
    if (!deleteUser) return;
    setUsers(prev => prev.filter(u => u.id !== deleteUser.id));
    toast({ title: 'User removed', description: `${deleteUser.name} has been deleted.`, variant: 'destructive' });
    setDeleteUser(null);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">User Management</h1>

        {/* Role summary cards */}
        <div className="grid sm:grid-cols-4 gap-4">
          {[
            { label: 'Total Users', value: counts.total, icon: Users },
            { label: 'Users', value: counts.user, icon: Users },
            { label: 'Agents', value: counts.agent, icon: UserCheck },
            { label: 'Admins', value: counts.admin, icon: ShieldCheck },
          ].map(item => (
            <div key={item.label} className="bg-card rounded-xl border border-border p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <item.icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{item.value}</p>
                <p className="text-xs text-muted-foreground">{item.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or email..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="user">Users</SelectItem>
              <SelectItem value="agent">Agents</SelectItem>
              <SelectItem value="admin">Admins</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Users table */}
        <div className="bg-card rounded-xl border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    No users found.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map(u => {
                  const Icon = roleIcon[u.role];
                  return (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-bold shrink-0">
                          {u.name.charAt(0)}
                        </div>
                        {u.name}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{u.email}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`capitalize gap-1 ${roleBadgeVariant[u.role]}`}>
                          <Icon className="h-3 w-3" />
                          {u.role}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => { setEditUser(u); setEditRole(u.role); }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-destructive hover:text-destructive"
                            onClick={() => setDeleteUser(u)}
                            disabled={u.role === 'admin'}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Edit role dialog */}
      <Dialog open={!!editUser} onOpenChange={open => !open && setEditUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Role — {editUser?.name}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <label className="text-sm font-medium mb-2 block">Assign Role</label>
            <Select value={editRole} onValueChange={v => setEditRole(v as UserRole)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="agent">Agent</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditUser(null)}>Cancel</Button>
            <Button onClick={handleEditSave}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
      <Dialog open={!!deleteUser} onOpenChange={open => !open && setDeleteUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to remove <strong>{deleteUser?.name}</strong> ({deleteUser?.email})? This action cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteUser(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
