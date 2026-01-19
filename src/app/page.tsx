'use client';

import { useState } from 'react';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { FamilyProvider } from '@/context/FamilyContext';
import FamilyTree from '@/components/FamilyTree';
import AuthPage from '@/components/AuthPage';
import FamilyList from '@/components/FamilyList';
import AdminPanel from '@/components/AdminPanel';

function AppContent() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [showAdminPanel, setShowAdminPanel] = useState(false);

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <div className="app-loading">
        <div className="loading-spinner"></div>
        <p>加载中...</p>
      </div>
    );
  }

  // Show auth page if not logged in
  if (!isAuthenticated) {
    return <AuthPage />;
  }

  // Show admin panel if admin and toggled
  if (showAdminPanel && user?.role === 'admin') {
    return <AdminPanel onBack={() => setShowAdminPanel(false)} />;
  }

  // Show family list
  return (
    <FamilyList
      onLogout={() => { }}
      isAdmin={user?.role === 'admin'}
      onOpenAdmin={() => setShowAdminPanel(true)}
    />
  );
}

export default function Home() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

