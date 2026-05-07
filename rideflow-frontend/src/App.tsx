import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { Landing } from './pages/Landing';
import { RiderDashboard } from './pages/rider/RiderDashboard';
import { DriverDashboard } from './pages/driver/DriverDashboard';
import { AdminDashboard } from './pages/admin/AdminDashboard';

function ProtectedRoute({ role, children }: { role?: string, children: React.ReactNode }) {
  const token = useAuthStore(state => state.token);
  const user = useAuthStore(state => state.user);

  console.log('=== PROTECTED ROUTE CHECK ===');
  console.log('Current path:', window.location.pathname);
  console.log('Expected role:', role);
  console.log('Token exists:', !!token);
  console.log('User data:', user);
  console.log('User role:', user?.role);
  console.log('Role comparison:', {
    expected: role?.toLowerCase(),
    actual: user?.role?.toLowerCase(),
    match: role?.toLowerCase() === user?.role?.toLowerCase()
  });

  if (!token) {
    console.log('❌ No token found, redirecting to /');
    return <Navigate to="/" replace />;
  }

  if (role && user?.role?.toLowerCase() !== role.toLowerCase()) {
    console.log('❌ Role mismatch, redirecting to /');
    console.log('Expected:', role, 'Got:', user?.role);
    return <Navigate to="/" replace />;
  }

  console.log('✅ Authentication passed, rendering protected content');
  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/rider" element={<ProtectedRoute role="Rider"><RiderDashboard /></ProtectedRoute>} />
        <Route path="/driver" element={<ProtectedRoute role="Driver"><DriverDashboard /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute role="Admin"><AdminDashboard /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
