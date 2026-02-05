import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { MainLayout } from "@/components/layout/MainLayout";
import { HRRoute, BossRoute } from "@/components/auth/ProtectedRoute";
import { NotificationProvider } from "@/components/notifications/NotificationProvider";

// Auth Pages
import Login from "@/pages/Login";
import Unauthorized from "@/pages/Unauthorized";

// HR Pages
import HRDashboard from "@/pages/hr/HRDashboard";
import EmployeesPage from "@/pages/hr/EmployeesPage";
import AttendancePage from "@/pages/hr/AttendancePage";
import LeavesPage from "@/pages/hr/LeavesPage";
import TicketsPage from "@/pages/hr/TicketsPage";
import HRMeetingsPage from "@/pages/hr/MeetingsPage";
import NoticesPage from "@/pages/hr/NoticesPage";
import AnalyticsPage from "@/pages/hr/AnalyticsPage";
import ReportActivityPage from "@/pages/hr/ReportActivityPage";
import HRTasksPage from "@/pages/hr/TasksPage";
import Chat from "@/pages/Chat";

// Boss Pages
import BossDashboard from "@/pages/boss/BossDashboard";
import MeetingsPage from "@/pages/boss/MeetingsPage";
import TasksPage from "@/pages/boss/TasksPage";
import BossNoticesPage from "@/pages/boss/BossNoticesPage";

// Shared Pages
import Settings from "@/pages/Settings";

import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Root redirect component that checks user role
function RootRedirect() {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Redirect based on role
  if (user?.role === 'boss' || user?.role === 'manager') {
    return <Navigate to="/boss" replace />;
  } else if (user?.role === 'hr' || user?.role === 'admin') {
    return <Navigate to="/hr" replace />;
  }

  return <Navigate to="/login" replace />;
}

const App = () => {
  const AppRoutes = () => (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/unauthorized" element={<Unauthorized />} />

      {/* Root redirect */}
      <Route path="/" element={<RootRedirect />} />

      {/* Protected Routes with Layout */}
      <Route element={<MainLayout />}>
        {/* HR Portal Routes - Only HR and Admin */}
        <Route path="/hr" element={
          <HRRoute><HRDashboard /></HRRoute>
        } />
        <Route path="/hr/employees" element={
          <HRRoute><EmployeesPage /></HRRoute>
        } />
        <Route path="/hr/attendance" element={
          <HRRoute><AttendancePage /></HRRoute>
        } />
        <Route path="/hr/leaves" element={
          <HRRoute><LeavesPage /></HRRoute>
        } />
        <Route path="/hr/tickets" element={
          <HRRoute><TicketsPage /></HRRoute>
        } />
        <Route path="/hr/meetings" element={
          <HRRoute><HRMeetingsPage /></HRRoute>
        } />
        <Route path="/hr/tasks" element={
          <HRRoute><HRTasksPage /></HRRoute>
        } />
        <Route path="/hr/notices" element={
          <HRRoute><NoticesPage /></HRRoute>
        } />
        <Route path="/hr/chat" element={
          <HRRoute><Chat /></HRRoute>
        } />
        <Route path="/hr/analytics" element={
          <HRRoute><AnalyticsPage /></HRRoute>
        } />
        <Route path="/hr/reports" element={
          <HRRoute><ReportActivityPage /></HRRoute>
        } />
        <Route path="/hr/settings" element={
          <HRRoute><Settings /></HRRoute>
        } />

        {/* Boss Dashboard Routes - Only Boss, Manager, and Admin */}
        <Route path="/boss" element={
          <BossRoute><BossDashboard /></BossRoute>
        } />
        <Route path="/boss/employees" element={
          <BossRoute><EmployeesPage /></BossRoute>
        } />
        <Route path="/boss/leaves" element={
          <BossRoute><LeavesPage /></BossRoute>
        } />
        <Route path="/boss/meetings" element={
          <BossRoute><MeetingsPage /></BossRoute>
        } />
        <Route path="/boss/tasks" element={
          <BossRoute><TasksPage /></BossRoute>
        } />
        <Route path="/boss/notices" element={
          <BossRoute><BossNoticesPage /></BossRoute>
        } />
        <Route path="/boss/chat" element={
          <BossRoute><Chat /></BossRoute>
        } />
        <Route path="/boss/analytics" element={
          <BossRoute><AnalyticsPage /></BossRoute>
        } />
        <Route path="/boss/reports" element={
          <BossRoute><ReportActivityPage /></BossRoute>
        } />
        <Route path="/boss/settings" element={
          <BossRoute><Settings /></BossRoute>
        } />
      </Route>

      {/* 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <NotificationProvider>
              <AppRoutes />
            </NotificationProvider>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
