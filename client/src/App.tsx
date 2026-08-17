import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { SocketProvider } from "./context/SocketContext";
import PublicRoute from "./routes/PublicRoute";
import ProtectedRoute from "./routes/ProtectedRoute";
import DashboardLayout from "./components/layout/DashboardLayout";

// Pages
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Contacts from "./pages/Contacts";
import Companies from "./pages/Companies";
import Leads from "./pages/Leads";
import Deals from "./pages/Deals";
import Tasks from "./pages/Tasks";
import Inbox from "./pages/Inbox";
import Campaigns from "./pages/Campaigns";
import Reports from "./pages/Reports";
import Integrations from "./pages/Integrations";
import Imports from "./pages/Imports";
import Settings from "./pages/Settings";

export function App() {
  return (
    <AuthProvider>
      <SocketProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route element={<PublicRoute />}>
            <Route path="/login" element={<Login />} />
          </Route>

          {/* Protected CRM Application Routes */}
          <Route element={<ProtectedRoute />}>
            <Route
              path="/"
              element={
                <DashboardLayout>
                  <Navigate to="/dashboard" replace />
                </DashboardLayout>
              }
            />
            <Route
              path="/dashboard"
              element={
                <DashboardLayout>
                  <Dashboard />
                </DashboardLayout>
              }
            />
            <Route
              path="/contacts"
              element={
                <DashboardLayout>
                  <Contacts />
                </DashboardLayout>
              }
            />
            <Route
              path="/companies"
              element={
                <DashboardLayout>
                  <Companies />
                </DashboardLayout>
              }
            />
            <Route
              path="/leads"
              element={
                <DashboardLayout>
                  <Leads />
                </DashboardLayout>
              }
            />
            <Route
              path="/deals"
              element={
                <DashboardLayout>
                  <Deals />
                </DashboardLayout>
              }
            />
            <Route
              path="/tasks"
              element={
                <DashboardLayout>
                  <Tasks />
                </DashboardLayout>
              }
            />
            <Route
              path="/inbox"
              element={
                <DashboardLayout>
                  <Inbox />
                </DashboardLayout>
              }
            />
            <Route
              path="/campaigns"
              element={
                <DashboardLayout>
                  <Campaigns />
                </DashboardLayout>
              }
            />
            <Route
              path="/reports"
              element={
                <DashboardLayout>
                  <Reports />
                </DashboardLayout>
              }
            />
            <Route
              path="/integrations"
              element={
                <DashboardLayout>
                  <Integrations />
                </DashboardLayout>
              }
            />
            <Route
              path="/imports"
              element={
                <DashboardLayout>
                  <Imports />
                </DashboardLayout>
              }
            />
            <Route
              path="/settings"
              element={
                <DashboardLayout>
                  <Settings />
                </DashboardLayout>
              }
            />
          </Route>

          {/* Fallback Catch-all Route */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;
