import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Briefcase, 
  Search, 
  BarChart3, 
  Sun, 
  Moon, 
  Sparkles,
  X,
  Layers,
  FileCheck2
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useRole } from '../context/RoleContext';
import { ShieldCheck, Lock } from 'lucide-react';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard', badge: null },
  { to: '/resumes', icon: Users, label: 'Talent Pool', badge: 'Resumes' },
  { to: '/jobs', icon: Briefcase, label: 'Job Positions', badge: 'Active' },
  { to: '/search', icon: Search, label: 'Talent Search', badge: 'AI' },
  { to: '/analytics', icon: BarChart3, label: 'Analytics', badge: null },
  { to: '/profile', icon: ShieldCheck, label: 'Security & Profile', badge: null },
];

const Sidebar = ({ isOpen, onClose }) => {
  const { isDark, toggleTheme } = useTheme();
  const { role, isAdmin, isHiringManager } = useRole();

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div 
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-xs lg:hidden transition-opacity"
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`
          fixed top-0 bottom-0 left-0 z-50 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 
          flex flex-col justify-between transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static
          ${isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:shadow-none'}
        `}
      >
        <div className="p-5">
          {/* Brand Header */}
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100 dark:border-slate-800/80">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary-600 via-primary-500 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-primary-500/25">
                <FileCheck2 size={22} className="stroke-[2.5]" />
              </div>
              <div>
                <h1 className="font-extrabold text-lg leading-none tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
                  RecruitAI
                  <span className="text-[9px] font-bold uppercase tracking-wider bg-primary-100 text-primary-700 dark:bg-primary-950 dark:text-primary-300 px-1.5 py-0.5 rounded">
                    PRO
                  </span>
                </h1>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                  Intelligence ATS
                </span>
              </div>
            </div>

            {/* Mobile Close Button */}
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg lg:hidden"
            >
              <X size={20} />
            </button>
          </div>

          {/* Active Account Role Badge (Non-Interactive) */}
          <div className="mb-6 p-3 bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 rounded-xl space-y-1.5">
            <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              <span className="flex items-center gap-1.5">
                <ShieldCheck size={13} className="text-primary-500" />
                Active Account Role:
              </span>
            </div>
            
            <div className={`p-2 rounded-lg text-xs font-extrabold flex items-center justify-between ${
              isHiringManager
                ? 'bg-amber-50 dark:bg-amber-950/40 border border-amber-500/30 text-amber-800 dark:text-amber-300'
                : 'bg-primary-50 dark:bg-primary-950/40 border border-primary-500/30 text-primary-800 dark:text-primary-300'
            }`}>
              <span>{isHiringManager ? 'Hiring Manager' : 'Admin'}</span>
              {isHiringManager && (
                <span className="flex items-center gap-1 text-[9px] uppercase tracking-wider bg-amber-200/50 dark:bg-amber-900/60 px-1.5 py-0.5 rounded">
                  <Lock size={10} />
                  <span>Read Only</span>
                </span>
              )}
            </div>
          </div>

          {/* Nav List */}
          <div className="space-y-1">
            <p className="px-3 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
              Main Menu
            </p>
            <nav className="space-y-1.5">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => {
                      if (onClose) onClose();
                    }}
                    className={({ isActive }) => `
                      flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 group
                      ${isActive 
                        ? 'bg-primary-50 dark:bg-primary-950/50 text-primary-600 dark:text-primary-400 shadow-2xs font-bold' 
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'}
                    `}
                  >
                    {({ isActive }) => (
                      <>
                        <div className="flex items-center space-x-3">
                          <Icon 
                            size={18} 
                            className={`transition-colors ${isActive ? 'text-primary-600 dark:text-primary-400' : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200'}`} 
                          />
                          <span>{item.label}</span>
                        </div>

                        {item.badge && (
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${isActive ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}>
                            {item.badge}
                          </span>
                        )}
                      </>
                    )}
                  </NavLink>
                );
              })}
            </nav>
          </div>

          {/* Quick Engine Status Card */}
          <div className="mt-8 p-3.5 bg-slate-50 dark:bg-slate-950/40 border border-slate-200/70 dark:border-slate-800/80 rounded-xl space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
              <span className="flex items-center gap-1.5">
                <Sparkles size={14} className="text-primary-500" />
                FAISS Vector Engine
              </span>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400">Ready</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-normal">
              384-dimensional cosine embeddings with section-level semantic matching.
            </p>
          </div>
        </div>

        {/* Footer Theme Toggle */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50">
          <button
            onClick={toggleTheme}
            className="flex items-center justify-between w-full px-3.5 py-2.5 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 hover:shadow-2xs transition-all cursor-pointer"
          >
            <span className="flex items-center space-x-2">
              {isDark ? <Moon size={16} className="text-primary-400" /> : <Sun size={16} className="text-amber-500" />}
              <span>{isDark ? 'Dark Theme' : 'Light Theme'}</span>
            </span>
            <span className="w-9 h-5 bg-slate-200 dark:bg-slate-700 rounded-full relative flex items-center p-0.5 transition-colors">
              <span className={`w-4 h-4 bg-white dark:bg-primary-400 rounded-full shadow-md transform transition-transform duration-200 ${isDark ? 'translate-x-4' : 'translate-x-0'}`} />
            </span>
          </button>
          <div className="mt-2 text-center">
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
              v2.5.0 • Enterprise Edition
            </span>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
