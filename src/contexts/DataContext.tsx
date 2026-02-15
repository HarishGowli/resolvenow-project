import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Complaint, AppNotification, ComplaintStatus, ChatMessage } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';

interface DataContextType {
  complaints: Complaint[];
  notifications: AppNotification[];
  messages: ChatMessage[];
  addComplaint: (complaint: Omit<Complaint, 'id' | 'createdAt' | 'updatedAt' | 'status'>) => Promise<void>;
  updateComplaintStatus: (id: string, status: ComplaintStatus) => Promise<void>;
  getComplaintsByUser: (userId: string) => Complaint[];
  getComplaintsByAgent: (agentId: string) => Complaint[];
  getUnreadNotifications: (userId: string) => AppNotification[];
  markNotificationRead: (id: string) => Promise<void>;
  markAllNotificationsRead: (userId: string) => Promise<void>;
  getMessagesByComplaint: (complaintId: string) => ChatMessage[];
  sendMessage: (msg: Omit<ChatMessage, 'id' | 'createdAt'>) => Promise<void>;
  loadingComplaints: boolean;
}

const DataContext = createContext<DataContextType | null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingComplaints, setLoadingComplaints] = useState(true);

  // Fetch complaints
  const fetchComplaints = useCallback(async () => {
    if (!user) { setComplaints([]); setLoadingComplaints(false); return; }
    setLoadingComplaints(true);
    const { data, error } = await supabase
      .from('complaints')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error && data) {
      setComplaints(data.map(mapComplaint));
    }
    setLoadingComplaints(false);
  }, [user]);

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    if (!user) { setNotifications([]); return; }
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (data) setNotifications(data.map(mapNotification));
  }, [user]);

  // Fetch messages
  const fetchMessages = useCallback(async () => {
    if (!user) { setMessages([]); return; }
    const { data } = await supabase
      .from('chat_messages')
      .select('*')
      .order('created_at', { ascending: true });
    if (data) setMessages(data.map(mapMessage));
  }, [user]);

  useEffect(() => {
    fetchComplaints();
    fetchNotifications();
    fetchMessages();
  }, [fetchComplaints, fetchNotifications, fetchMessages]);

  // Realtime subscriptions
  useEffect(() => {
    if (!user) return;

    const msgChannel = supabase
      .channel('chat_messages_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_messages' }, () => {
        fetchMessages();
      })
      .subscribe();

    const notifChannel = supabase
      .channel('notifications_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, () => {
        fetchNotifications();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(msgChannel);
      supabase.removeChannel(notifChannel);
    };
  }, [user, fetchMessages, fetchNotifications]);

  const addComplaint = async (data: Omit<Complaint, 'id' | 'createdAt' | 'updatedAt' | 'status'>) => {
    const { error } = await supabase.from('complaints').insert({
      title: data.title,
      description: data.description,
      category: data.category,
      priority: data.priority as any,
      user_id: data.userId,
      user_name: data.userName,
      address: data.address || null,
      product_name: data.productName || null,
      purchase_date: data.purchaseDate || null,
    });
    if (!error) await fetchComplaints();
  };

  const updateComplaintStatus = async (id: string, status: ComplaintStatus) => {
    const { error } = await supabase
      .from('complaints')
      .update({ status: status as any })
      .eq('id', id);
    if (!error) await fetchComplaints();
  };

  const getComplaintsByUser = (userId: string) => complaints.filter(c => c.userId === userId);
  const getComplaintsByAgent = (agentId: string) => complaints.filter(c => c.agentId === agentId);
  const getUnreadNotifications = (userId: string) => notifications.filter(n => n.userId === userId && !n.read);

  const markNotificationRead = async (id: string) => {
    await supabase.from('notifications').update({ read: true }).eq('id', id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllNotificationsRead = async (userId: string) => {
    await supabase.from('notifications').update({ read: true }).eq('user_id', userId).eq('read', false);
    setNotifications(prev => prev.map(n => n.userId === userId ? { ...n, read: true } : n));
  };

  const getMessagesByComplaint = (complaintId: string) =>
    messages.filter(m => m.complaintId === complaintId);

  const sendMessage = async (msg: Omit<ChatMessage, 'id' | 'createdAt'>) => {
    await supabase.from('chat_messages').insert({
      complaint_id: msg.complaintId,
      sender_id: msg.senderId,
      sender_name: msg.senderName,
      sender_role: msg.senderRole as any,
      message: msg.message,
    });
  };

  return (
    <DataContext.Provider value={{
      complaints, notifications, messages, addComplaint, updateComplaintStatus,
      getComplaintsByUser, getComplaintsByAgent, getUnreadNotifications,
      markNotificationRead, markAllNotificationsRead, getMessagesByComplaint, sendMessage,
      loadingComplaints,
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

// Mappers from snake_case DB to camelCase types
function mapComplaint(row: any): Complaint {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    status: row.status,
    priority: row.priority,
    category: row.category,
    userId: row.user_id,
    userName: row.user_name,
    agentId: row.agent_id || undefined,
    agentName: row.agent_name || undefined,
    address: row.address || undefined,
    productName: row.product_name || undefined,
    purchaseDate: row.purchase_date || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapNotification(row: any): AppNotification {
  return {
    id: row.id,
    userId: row.user_id,
    message: row.message,
    read: row.read,
    createdAt: row.created_at,
    type: row.type,
  };
}

function mapMessage(row: any): ChatMessage {
  return {
    id: row.id,
    complaintId: row.complaint_id,
    senderId: row.sender_id,
    senderName: row.sender_name,
    senderRole: row.sender_role,
    message: row.message,
    createdAt: row.created_at,
  };
}
