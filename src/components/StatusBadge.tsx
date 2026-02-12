import { ComplaintStatus } from '@/types';

const statusConfig: Record<ComplaintStatus, { label: string; className: string }> = {
  pending: { label: 'Pending', className: 'badge-pending' },
  assigned: { label: 'Assigned', className: 'badge-assigned' },
  'in-progress': { label: 'In Progress', className: 'badge-in-progress' },
  resolved: { label: 'Resolved', className: 'badge-resolved' },
};

export default function StatusBadge({ status }: { status: ComplaintStatus }) {
  const config = statusConfig[status];
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${config.className}`}>
      {config.label}
    </span>
  );
}
