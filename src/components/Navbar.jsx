import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Sun, Moon, Flame, Menu, X, LogOut, BookOpen,
  Calendar, BarChart2, Code, ShieldAlert, Award,
  Sparkles, ChevronRight, MoreHorizontal, User
} from 'lucide-react';

export default function Navbar({ user, logout, darkMode, setDarkMode }) {
  const [moreOpen, setMoreOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const profileRef = useRef(null);
  const moreRef = useRef(null);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
      if (moreRef.current && !moreRef.current.contains(e.target)) {
        setMoreOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Primary 5 nav items (shown in bottom tab on mobile)
  const primaryNav = [
    { label: 'Today',    path: '/today',     icon: BookOpen },
    { label: 'DSA Lab',  path: '/dsa-lab',   icon: Code },
    { label: 'English',  path: '/english',   icon: Award },
    { label: 'AI Tutor', path: '/ai-tutor',  icon: Sparkles },
    { label: 'Progress', path: '/dashboard', icon: BarChart2 },
  ];

  // Secondary items (in "More" drawer on mobile, shown in desktop nav too)
  const secondaryNav = [
    { label: 'Topics Library', path: '/topics',      icon: BookOpen },
    { label: 'Mock Tests',     path: '/mock-tests',  icon: Award },
    { label: 'Calendar',       path: '/calendar',    icon: Calendar },
  ];

  const allNav = [...primaryNav, ...secondaryNav];

  const adminEmail = import.meta.env.VITE_ADMIN_EMAIL || 'admin@nqt.com';
  const isAdmin = user && user.email === adminEmail;

  const isActive = (path) => location.pathname === path;

  const navLinkClass = (path) =>
    `whitespace-nowrap flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
      isActive(path)
        ? 'bg-primary-50 dark:bg-primary-950/50 text-primary-600 dark:text-primary-400'
        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100'
    }`;

  const initials = user?.name?.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase() || 'U';

  return (
    <>
      {/* ─── Top bar ──────────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors duration-200">
        <div className="flex items-center justify-between w-full px-4 py-3 gap-4 min-w-0 lg:overflow-visible overflow-x-auto whitespace-nowrap scrollbar-hide">

          {/* Logo — always single line */}
          <Link
            to="/today"
            className="flex items-center gap-2 flex-shrink-0"
            style={{ minWidth: 'fit-content' }}
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-primary-600 to-indigo-500 flex items-center justify-center text-white text-sm font-bold shadow-md shadow-primary-500/20 flex-shrink-0">
              N1
            </div>
            <span className="text-lg font-bold whitespace-nowrap bg-gradient-to-r from-primary-600 to-indigo-500 dark:from-primary-400 dark:to-indigo-400 bg-clip-text text-transparent">
              NQT One-Year
            </span>
          </Link>

          {/* Desktop navigation — horizontal scroll when tight */}
          <div className="hidden md:flex items-center gap-0.5 overflow-x-auto whitespace-nowrap flex-1 px-2 scrollbar-hide">
            {allNav.map(({ label, path, icon: Icon }) => (
              <Link key={path} to={path} className={navLinkClass(path)}>
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span className="whitespace-nowrap">{label}</span>
              </Link>
            ))}
            {isAdmin && (
              <Link
                to="/admin"
                className={`whitespace-nowrap flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  isActive('/admin')
                    ? 'bg-rose-50 dark:bg-rose-950/20 text-rose-600'
                    : 'text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/10'
                }`}
              >
                <ShieldAlert className="w-4 h-4" /> Admin
              </Link>
            )}
          </div>

          {/* Right side controls */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Streak badge — always one line */}
            {user && (
              <div
                id="streak-badge"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-100 text-amber-900 text-sm font-medium whitespace-nowrap"
              >
                <span>🔥 {user.streak || 0} Day Streak</span>
              </div>
            )}

            {/* Dark mode toggle */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Toggle Dark Mode"
            >
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            {/* User profile area */}
            {user && (
              <div className="flex items-center" ref={profileRef}>
                {/* On desktop (>= 1024px): show avatar + details + separate logout button */}
                <div className="hidden lg:flex items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-indigo-600 flex items-center justify-center text-white text-sm font-bold shadow flex-shrink-0">
                      {initials}
                    </div>
                    <div className="flex flex-col text-left">
                      <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 leading-none">{user.name}</span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 max-w-[120px] truncate">{user.email}</span>
                    </div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="ml-3 p-2 rounded-lg text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors"
                    aria-label="Logout"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                </div>

                {/* On tablet/mobile (< 1024px): show only avatar, click opens popover */}
                <div className="lg:hidden relative">
                  <button
                    onClick={() => setProfileOpen(v => !v)}
                    className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-indigo-600 flex items-center justify-center text-white text-sm font-bold shadow flex-shrink-0 focus:outline-none"
                    aria-label="User profile"
                  >
                    {initials}
                  </button>
                  {profileOpen && (
                    <div className="absolute right-0 top-12 w-56 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 py-2 z-50">
                      <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700">
                        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{user.name}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">{user.email}</p>
                      </div>
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors"
                      >
                        <LogOut className="w-4 h-4" /> Logout
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Mobile: More button (opens drawer) */}
            <button
              onClick={() => setMoreOpen(v => !v)}
              className="md:hidden p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="More menu"
            >
              {moreOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile drawer — secondary nav items */}
        {moreOpen && (
          <div
            ref={moreRef}
            className="md:hidden border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 pb-4 pt-2 space-y-1"
          >
            {secondaryNav.map(({ label, path, icon: Icon }) => (
              <Link
                key={path}
                to={path}
                onClick={() => setMoreOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive(path)
                    ? 'bg-primary-50 dark:bg-primary-950/35 text-primary-600 dark:text-primary-400'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{label}</span>
                <ChevronRight className="w-4 h-4 ml-auto opacity-40" />
              </Link>
            ))}
            {isAdmin && (
              <Link
                to="/admin"
                onClick={() => setMoreOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/10"
              >
                <ShieldAlert className="w-5 h-5" />
                Admin Panel
              </Link>
            )}
            {user && (
              <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3 px-3 py-2">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold">
                    {initials}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{user.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[180px]">{user.email}</p>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/10 mt-1"
                >
                  <LogOut className="w-5 h-5" /> Logout
                </button>
              </div>
            )}
          </div>
        )}
      </nav>

      {/* ─── Mobile bottom tab bar ─────────────────────────────────────────── */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 flex justify-around items-center h-16 px-1 shadow-lg">
        {primaryNav.map(({ label, path, icon: Icon }) => (
          <Link
            key={path}
            to={path}
            className={`flex flex-col items-center justify-center flex-1 h-full gap-0.5 transition-all ${
              isActive(path)
                ? 'text-primary-600 dark:text-primary-400'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            <Icon className={`w-5 h-5 ${isActive(path) ? 'stroke-[2.5]' : ''}`} />
            <span className="text-[9px] font-semibold whitespace-nowrap">{label}</span>
          </Link>
        ))}
        {/* "More" tab opens drawer */}
        <button
          onClick={() => setMoreOpen(v => !v)}
          className={`flex flex-col items-center justify-center flex-1 h-full gap-0.5 transition-all ${
            moreOpen ? 'text-primary-600 dark:text-primary-400' : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <MoreHorizontal className="w-5 h-5" />
          <span className="text-[9px] font-semibold">More</span>
        </button>
      </div>
    </>
  );
}
