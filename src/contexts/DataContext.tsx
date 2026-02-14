import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Complaint, AppNotification, ComplaintStatus, ChatMessage } from '@/types';
import { initialComplaints, initialNotifications, initialMessages } from '@/data/mockData';

interface DataContextType {
  complaints: Complaint[];
  notifications: AppNotification[];
  messages: ChatMessage[];
  addComplaint: (complaint: Omit<Complaint, 'id' | 'createdAt' | 'updatedAt' | 'status'>) => void;
  updateComplaintStatus: (id: string, status: ComplaintStatus) => void;
  getComplaintsByUser: (userId: string) => Complaint[];
  getComplaintsByAgent: (agentId: string) => Complaint[];
  getUnreadNotifications: (userId: string) => AppNotification[];
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: (userId: string) => void;
  getMessagesByComplaint: (complaintId: string) => ChatMessage[];
  sendMessage: (msg: Omit<ChatMessage, 'id' | 'createdAt'>) => void;
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

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem('messages_data');
    return saved ? JSON.parse(saved) : initialMessages;
  });

  useEffect(() => {
    localStorage.setItem('complaints_data', JSON.stringify(complaints));
  }, [complaints]);

  useEffect(() => {
    localStorage.setItem('notifications_data', JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem('messages_data', JSON.stringify(messages));
  }, [messages]);

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

  const getMessagesByComplaint = (complaintId: string) =>
    messages.filter(m => m.complaintId === complaintId).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  const sendMessage = (msg: Omit<ChatMessage, 'id' | 'createdAt'>) => {
    const newMsg: ChatMessage = {
      ...msg,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    setMessages(prev => [...prev, newMsg]);
  };

  return (
    <DataContext.Provider value={{
      complaints, notifications, messages, addComplaint, updateComplaintStatus,
      getComplaintsByUser, getComplaintsByAgent, getUnreadNotifications,
      markNotificationRead, markAllNotificationsRead, getMessagesByComplaint, sendMessage,
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
