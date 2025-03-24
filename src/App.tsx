import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Layout } from './components/Layout';
import { LoginPage } from './pages/LoginPage';
import { Navigate } from 'react-router-dom';
import { DashboardPage } from './pages/DashboardPage';
import { TemplatesPage } from './pages/TemplatesPage';
import { GeneratorPage } from './pages/GeneratorPage';
import { ReviewerPage } from './pages/ReviewerPage';
import { ExportPage } from './pages/ExportPage';
import { SettingsPage } from './pages/SettingsPage';

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/login" />;
  }
  return <>{children}</>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Toaster position="top-right" />
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/" element={
              <ProtectedRoute><Layout /></ProtectedRoute>
            }>
              <Route index element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
              <Route path="templates" element={<ProtectedRoute><TemplatesPage /></ProtectedRoute>} />
              <Route path="generator" element={<ProtectedRoute><GeneratorPage /></ProtectedRoute>} />
              <Route path="reviewer" element={<ProtectedRoute><ReviewerPage /></ProtectedRoute>} />
              <Route path="export" element={<ProtectedRoute><ExportPage /></ProtectedRoute>} />
              <Route path="settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
            </Route>
          </Routes>
        </div>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
