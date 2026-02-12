export type UserRole = 'user' | 'agent' | 'admin';
export type ComplaintStatus = 'pending' | 'assigned' | 'in-progress' | 'resolved';
export type Priority = 'low' | 'medium' | 'high';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
}

export interface Complaint {
  id: string;
  title: string;
  description: string;
  status: ComplaintStatus;
  priority: Priority;
  category: string;
  userId: string;
  userName: string;
  agentId?: string;
  agentName?: string;
  address?: string;
  productName?: string;
  purchaseDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AppNotification {
  id: string;
  userId: string;
  message: string;
  read: boolean;
  createdAt: string;
  type: 'status_update' | 'assignment' | 'message' | 'resolution';
}
