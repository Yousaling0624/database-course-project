import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import Toast from './components/Toast';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import Sales from './pages/Sales';
import UserManagement from './pages/UserManagement';
import CustomerManagement from './pages/CustomerManagement';
import SupplierManagement from './pages/SupplierManagement';
import InboundManagement from './pages/InboundManagement';
import Reports from './pages/Reports';
import SystemMaintenance from './pages/SystemMaintenance';

// Role-based route protection component
function ProtectedRoute({ children, allowedRoles, userRole, showToast }) {
  if (!allowedRoles.includes(userRole)) {
    showToast('您没有权限访问此页面', 'error');
    return <Navigate to="/" replace />;
  }
  return children;
}

function App() {
  // Initialize state from localStorage
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return localStorage.getItem('isLoggedIn') === 'true';
  });
  const [currentUser, setCurrentUser] = useState(() => {
    const user = localStorage.getItem('currentUser');
    return user ? JSON.parse(user) : null;
  });

  const [toast, setToast] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  const handleLogin = (user, token) => {
    setCurrentUser(user);
    setIsLoggedIn(true);
    // Persist to localStorage
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('currentUser', JSON.stringify(user));
    if (token) localStorage.setItem('token', token);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setIsLoggedIn(false);
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('token'); // Clear token too
  };

  if (!isLoggedIn) {
    return (
      <>
        <Login onLogin={handleLogin} showToast={showToast} />
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      </>
    );
  }

  const userRole = currentUser?.role || 'staff';

  return (
    <Router>
      <div className="flex h-screen bg-slate-50 font-sans text-slate-600 overflow-hidden">
        <Sidebar
          onLogout={handleLogout}
          userRole={userRole}
          currentUser={currentUser}
          isOpen={isMobileMenuOpen}
          onClose={() => setIsMobileMenuOpen(false)}
        />

        <div className="flex-1 flex flex-col overflow-hidden relative w-full">
          <Navbar
            currentUser={currentUser}
            onMenuClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          />

          <main className="flex-1 overflow-y-auto p-8">
            <div className="max-w-7xl mx-auto">
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/inventory" element={<Inventory showToast={showToast} userRole={userRole} />} />
                <Route path="/sales" element={<Sales showToast={showToast} />} />
                <Route path="/inbound" element={<InboundManagement showToast={showToast} />} />

                {/* Admin only pages */}
                <Route path="/users" element={
                  <ProtectedRoute allowedRoles={['admin']} userRole={userRole} showToast={showToast}>
                    <UserManagement showToast={showToast} />
                  </ProtectedRoute>
                } />

                <Route path="/customers" element={<CustomerManagement showToast={showToast} />} />
                <Route path="/suppliers" element={<SupplierManagement showToast={showToast} />} />
                <Route path="/reports" element={<Reports showToast={showToast} />} />

                {/* Admin only - System Maintenance */}
                <Route path="/system" element={
                  <ProtectedRoute allowedRoles={['admin']} userRole={userRole} showToast={showToast}>
                    <SystemMaintenance showToast={showToast} />
                  </ProtectedRoute>
                } />

                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </div>
          </main>
        </div>

        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      </div>
    </Router>
  );
}

export default App;