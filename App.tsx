
import React, { useState, useEffect } from 'react';
import { User } from './types';
import { Layout } from './components/Layout';
import { RegisterForm } from './components/RegisterForm';
import { PlayerDashboard } from './components/PlayerDashboard';
import { AdminView } from './components/AdminView';
import { ShiftRankingView } from './components/ShiftRankingView';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<'player' | 'admin' | 'ranking'>('player');

  useEffect(() => {
    const savedUser = localStorage.getItem('current_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const handleLogin = (newUser: User) => {
    setUser(newUser);
    localStorage.setItem('current_user', JSON.stringify(newUser));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('current_user');
    setCurrentView('player');
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <RegisterForm onLogin={handleLogin} />
      </div>
    );
  }

  return (
    <Layout 
      user={user} 
      onLogout={handleLogout} 
      onNavigate={setCurrentView}
      currentView={currentView}
    >
      {currentView === 'player' ? (
        <PlayerDashboard user={user} />
      ) : currentView === 'admin' ? (
        <AdminView />
      ) : (
        <ShiftRankingView />
      )}
    </Layout>
  );
};

export default App;
