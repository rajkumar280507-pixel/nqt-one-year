import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Today from './pages/Today';
import Calendar from './pages/Calendar';
import Topics from './pages/Topics';
import Coding from './pages/Coding';
import MockTests from './pages/MockTests';
import Dashboard from './pages/Dashboard';
import Admin from './pages/Admin';
import DsaLab from './pages/DsaLab';
import English from './pages/English';
import AiTutor from './pages/AiTutor';

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')) || null);
  const [darkMode, setDarkMode] = useState(localStorage.getItem('darkMode') === 'true');

  useEffect(() => {
    // Sync dark mode class
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('darkMode', darkMode);
  }, [darkMode]);

  const login = (token, userData) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setToken(token);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken('');
    setUser(null);
  };

  const updateUserData = (updatedUser) => {
    localStorage.setItem('user', JSON.stringify(updatedUser));
    setUser(updatedUser);
  };

  const isAuthenticated = !!token;
  const adminEmail = import.meta.env.VITE_ADMIN_EMAIL || 'admin@nqt.com';
  const isAdmin = user && user.email === adminEmail;

  return (
    <Router>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col transition-colors duration-200">
        {isAuthenticated && (
          <Navbar 
            user={user} 
            logout={logout} 
            darkMode={darkMode} 
            setDarkMode={setDarkMode} 
          />
        )}
        
        <main className="flex-1 w-full pb-16 md:pb-0">
          <Routes>
            {/* Public Routes */}
            <Route 
              path="/login" 
              element={isAuthenticated ? <Navigate to="/today" /> : <Login login={login} />} 
            />
            <Route 
              path="/signup" 
              element={isAuthenticated ? <Navigate to="/today" /> : <Signup login={login} />} 
            />

            {/* Authenticated Private Routes */}
            <Route 
              path="/today" 
              element={isAuthenticated ? <Today token={token} user={user} updateUserData={updateUserData} /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/calendar" 
              element={isAuthenticated ? <Calendar token={token} user={user} /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/topics" 
              element={isAuthenticated ? <Topics token={token} /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/coding" 
              element={isAuthenticated ? <Coding token={token} /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/mock-tests" 
              element={isAuthenticated ? <MockTests token={token} user={user} /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/dashboard" 
              element={isAuthenticated ? <Dashboard token={token} user={user} /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/dsa-lab" 
              element={isAuthenticated ? <DsaLab token={token} /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/english" 
              element={isAuthenticated ? <English token={token} user={user} /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/ai-tutor" 
              element={isAuthenticated ? <AiTutor token={token} user={user} /> : <Navigate to="/login" />} 
            />

            {/* Admin Route */}
            <Route 
              path="/admin" 
              element={isAuthenticated && isAdmin ? <Admin token={token} /> : <Navigate to="/login" />} 
            />

            {/* Catch-all Fallback */}
            <Route 
              path="*" 
              element={<Navigate to={isAuthenticated ? "/today" : "/login"} />} 
            />
          </Routes>
        </main>
      </div>
    </Router>
  );
}
