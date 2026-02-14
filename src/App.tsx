import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { DataProvider } from "@/contexts/DataContext";
import ProtectedRoute from "@/components/ProtectedRoute";

import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import NotFound from "./pages/NotFound";
import ProfileSettings from "./pages/ProfileSettings";
import ComplaintDetail from "./pages/ComplaintDetail";

import UserDashboard from "./pages/user/UserDashboard";
import SubmitComplaint from "./pages/user/SubmitComplaint";
import MyComplaints from "./pages/user/MyComplaints";

import AgentDashboard from "./pages/agent/AgentDashboard";
import AdminDashboard from "./pages/admin/AdminDashboard";
import UserManagement from "./pages/admin/UserManagement";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <DataProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* User routes */}
              <Route path="/user/dashboard" element={<ProtectedRoute roles={['user']}><UserDashboard /></ProtectedRoute>} />
              <Route path="/user/complaints/new" element={<ProtectedRoute roles={['user']}><SubmitComplaint /></ProtectedRoute>} />
              <Route path="/user/complaints" element={<ProtectedRoute roles={['user']}><MyComplaints /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute roles={['user','agent','admin']}><ProfileSettings /></ProtectedRoute>} />
              <Route path="/complaints/:id" element={<ProtectedRoute roles={['user','agent','admin']}><ComplaintDetail /></ProtectedRoute>} />

              {/* Agent routes */}
              <Route path="/agent/dashboard" element={<ProtectedRoute roles={['agent']}><AgentDashboard /></ProtectedRoute>} />
              <Route path="/agent/complaints" element={<ProtectedRoute roles={['agent']}><AgentDashboard /></ProtectedRoute>} />

              {/* Admin routes */}
              <Route path="/admin/dashboard" element={<ProtectedRoute roles={['admin']}><AdminDashboard /></ProtectedRoute>} />
              <Route path="/admin/complaints" element={<ProtectedRoute roles={['admin']}><AdminDashboard /></ProtectedRoute>} />
              <Route path="/admin/users" element={<ProtectedRoute roles={['admin']}><UserManagement /></ProtectedRoute>} />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </DataProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
