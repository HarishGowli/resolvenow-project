import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  variant?: 'default' | 'pending' | 'assigned' | 'in-progress' | 'resolved';
}

const borderStyles: Record<string, string> = {
  default: 'border-l-primary',
  pending: 'stat-border-pending',
  assigned: 'stat-border-assigned',
  'in-progress': 'stat-border-in-progress',
  resolved: 'stat-border-resolved',
};

export default function StatCard({ title, value, icon: Icon, variant = 'default' }: StatCardProps) {
  return (
    <div className={`bg-card rounded-xl border border-border border-l-4 ${borderStyles[variant]} p-5 transition-shadow hover:shadow-md`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-3xl font-bold mt-1">{value}</p>
        </div>
        <Icon className="h-10 w-10 text-muted-foreground/30" />
      </div>
    </div>
  );
}
