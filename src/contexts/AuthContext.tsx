import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserRole } from '@/types';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string, role: UserRole) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

interface StoredUser {
  id: string;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  createdAt: string;
}

const DEMO_USERS: StoredUser[] = [
  { id: '1', name: 'John User', email: 'user@demo.com', password: 'password123', role: 'user', createdAt: '2024-01-15' },
  { id: '2', name: 'Sarah Agent', email: 'agent@demo.com', password: 'password123', role: 'agent', createdAt: '2024-01-10' },
  { id: '3', name: 'Mike Admin', email: 'admin@demo.com', password: 'password123', role: 'admin', createdAt: '2024-01-01' },
];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('auth_user');
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
    if (user) localStorage.setItem('auth_user', JSON.stringify(user));
    else localStorage.removeItem('auth_user');
  }, [user]);

  const getUsers = (): StoredUser[] => {
    const saved = localStorage.getItem('registered_users');
    return saved ? [...DEMO_USERS, ...JSON.parse(saved)] : DEMO_USERS;
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    const users = getUsers();
    const found = users.find(u => u.email === email && u.password === password);
    if (found) {
      const { password: _, ...userData } = found;
      setUser(userData);
      return true;
    }
    return false;
  };

  const register = async (name: string, email: string, password: string, role: UserRole): Promise<boolean> => {
    const users = getUsers();
    if (users.find(u => u.email === email)) return false;
    const newUser: StoredUser = {
      id: crypto.randomUUID(),
      name,
      email,
      password,
      role,
      createdAt: new Date().toISOString(),
    };
    const custom = localStorage.getItem('registered_users');
    const existing: StoredUser[] = custom ? JSON.parse(custom) : [];
    localStorage.setItem('registered_users', JSON.stringify([...existing, newUser]));
    const { password: _, ...userData } = newUser;
    setUser(userData);
    return true;
  };

  const logout = () => setUser(null);

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
