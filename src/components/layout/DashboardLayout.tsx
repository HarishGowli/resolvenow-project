import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import {
  LayoutDashboard, FileText, PlusCircle, Users,
  LogOut, Menu, X, Bell, ChevronDown, Shield, ClipboardList, Settings,
} from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

const navConfig = {
  user: [
    { label: 'Dashboard', path: '/user/dashboard', icon: LayoutDashboard },
    { label: 'Submit Complaint', path: '/user/complaints/new', icon: PlusCircle },
    { label: 'My Complaints', path: '/user/complaints', icon: FileText },
  ],
  agent: [
    { label: 'Dashboard', path: '/agent/dashboard', icon: LayoutDashboard },
    { label: 'Assigned Complaints', path: '/agent/complaints', icon: ClipboardList },
  ],
  admin: [
    { label: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { label: 'All Complaints', path: '/admin/complaints', icon: FileText },
    { label: 'Manage Users', path: '/admin/users', icon: Users },
  ],
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const { getUnreadNotifications, notifications, markAllNotificationsRead } = useData();
  const location = useLocation();
  const navigate = useNavigate();

  if (!user) return null;

  const items = navConfig[user.role] || [];
  const unreadNotifs = getUnreadNotifications(user.id);
  const userNotifications = notifications.filter(n => n.userId === user.id).slice(0, 5);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-foreground/30 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-sidebar text-sidebar-foreground
        transform transition-transform duration-200 lg:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between px-6 py-5 border-b border-sidebar-border">
            <div className="flex items-center gap-2.5">
              <Shield className="h-7 w-7 text-sidebar-primary" />
              <span className="text-lg font-bold text-sidebar-primary-foreground">ComplaintHub</span>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-sidebar-foreground">
              <X className="h-5 w-5" />
            </button>
          </div>

          <nav className="flex-1 px-3 py-4 space-y-1">
            {items.map(item => {
              const active = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                    ${active
                      ? 'bg-sidebar-accent text-sidebar-primary'
                      : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                    }`}
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="px-3 py-4 border-t border-sidebar-border">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent w-full transition-colors"
            >
              <LogOut className="h-5 w-5" />
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-card border-b border-border flex items-center justify-between px-4 lg:px-6 shrink-0">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-lg hover:bg-secondary">
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex-1" />

          <div className="flex items-center gap-2">
            {/* Notifications */}
            <Popover>
              <PopoverTrigger asChild>
                <button className="relative p-2 rounded-lg hover:bg-secondary transition-colors">
                  <Bell className="h-5 w-5 text-muted-foreground" />
                  {unreadNotifs.length > 0 && (
                    <span className="absolute top-1 right-1 h-4 w-4 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
                      {unreadNotifs.length}
                    </span>
                  )}
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0" align="end">
                <div className="flex items-center justify-between p-3 border-b border-border">
                  <h4 className="font-semibold text-sm">Notifications</h4>
                  {unreadNotifs.length > 0 && (
                    <button
                      onClick={() => markAllNotificationsRead(user.id)}
                      className="text-xs text-accent hover:underline"
                    >
                      Mark all read
                    </button>
                  )}
                </div>
                <div className="max-h-64 overflow-auto">
                  {userNotifications.length === 0 ? (
                    <p className="text-sm text-muted-foreground p-4 text-center">No notifications</p>
                  ) : (
                    userNotifications.map(n => (
                      <div
                        key={n.id}
                        className={`px-3 py-2.5 border-b border-border last:border-0 text-sm ${!n.read ? 'bg-secondary/50' : ''}`}
                      >
                        <p className="text-foreground">{n.message}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(n.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </PopoverContent>
            </Popover>

            {/* User menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-secondary transition-colors">
                  <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-bold">
                    {user.name.charAt(0)}
                  </div>
                  <span className="hidden sm:block text-sm font-medium">{user.name}</span>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem disabled className="text-xs text-muted-foreground">
                  {user.email}
                </DropdownMenuItem>
                <DropdownMenuItem disabled className="text-xs">
                  Role: {user.role.toUpperCase()}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/profile')}>
                  <Settings className="h-4 w-4 mr-2" />
                  Profile Settings
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
