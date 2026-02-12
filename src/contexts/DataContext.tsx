import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Complaint, AppNotification, ComplaintStatus } from '@/types';
import { initialComplaints, initialNotifications } from '@/data/mockData';

interface DataContextType {
  complaints: Complaint[];
  notifications: AppNotification[];
  addComplaint: (complaint: Omit<Complaint, 'id' | 'createdAt' | 'updatedAt' | 'status'>) => void;
  updateComplaintStatus: (id: string, status: ComplaintStatus) => void;
  getComplaintsByUser: (userId: string) => Complaint[];
  getComplaintsByAgent: (agentId: string) => Complaint[];
  getUnreadNotifications: (userId: string) => AppNotification[];
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: (userId: string) => void;
}

const DataContext = createContext<DataContextType | null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
  const [complaints, setComplaints] = useState<Complaint[]>(() => {
    const saved = localStorage.getItem('complaints_data');
    return saved ? JSON.parse(saved) : initialComplaints;
  });

  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    const saved = localStorage.getItem('notifications_data');
    return saved ? JSON.parse(saved) : initialNotifications;
  });

  useEffect(() => {
    localStorage.setItem('complaints_data', JSON.stringify(complaints));
  }, [complaints]);

  useEffect(() => {
    localStorage.setItem('notifications_data', JSON.stringify(notifications));
  }, [notifications]);

  const addComplaint = (data: Omit<Complaint, 'id' | 'createdAt' | 'updatedAt' | 'status'>) => {
    const newComplaint: Complaint = {
      ...data,
      id: crypto.randomUUID(),
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setComplaints(prev => [newComplaint, ...prev]);
  };

  const updateComplaintStatus = (id: string, status: ComplaintStatus) => {
    setComplaints(prev =>
      prev.map(c =>
        c.id === id ? { ...c, status, updatedAt: new Date().toISOString() } : c
      )
    );
  };

  const getComplaintsByUser = (userId: string) => complaints.filter(c => c.userId === userId);
  const getComplaintsByAgent = (agentId: string) => complaints.filter(c => c.agentId === agentId);
  const getUnreadNotifications = (userId: string) => notifications.filter(n => n.userId === userId && !n.read);

  const markNotificationRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllNotificationsRead = (userId: string) => {
    setNotifications(prev => prev.map(n => n.userId === userId ? { ...n, read: true } : n));
  };

  return (
    <DataContext.Provider value={{
      complaints, notifications, addComplaint, updateComplaintStatus,
      getComplaintsByUser, getComplaintsByAgent, getUnreadNotifications,
      markNotificationRead, markAllNotificationsRead,
    }}>
      {children}
    </DataContext.Provider>
  );
}

export const useData = () => {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
};
