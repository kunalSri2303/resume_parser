import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Sun, 
  Moon, 
  Search, 
  Menu, 
  Sparkles, 
  Bell, 
  Activity,
  ShieldCheck
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const routeTitles = {
  '/': { title: 'Dashboard', subtitle: 'Overview & Talent Intelligence' },
  '/resumes': { title: 'Talent Pool', subtitle: 'Resume Ingestion & Candidates' },
  '/jobs': { title: 'Job Openings', subtitle: 'Active Requisitions & Requirements' },
  '/search': { title: 'Talent Search', subtitle: 'Semantic Vector Query' },
  '/analytics': { title: 'Recruitment Analytics', subtitle: 'Pipeline & Skill Metrics' },
};

const Navbar = ({ onToggleSidebar }) => {
  const { isDark, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  // Determine current page title
  const currentPath = location.pathname;
  let pageInfo = routeTitles[currentPath];
  if (!pageInfo) {
    if (currentPath.startsWith('/resume/')) {
      pageInfo = { title: 'Candidate Profile', subtitle: 'Structured Extraction & Evaluation' };
    } else if (currentPath.startsWith('/job/')) {
      pageInfo = { title: 'Job Cockpit', subtitle: 'Relevance Ranking & Recruiter Actions' };
    } else {
      pageInfo = { title: 'RecruitAI Hub', subtitle: 'Enterprise ATS Platform' };
    }
  }

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 md:px-8 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md transition-colors duration-200">
      {/* Left: Mobile Menu & Page Title */}
      <div className="flex items-center space-x-3">
        <button
          onClick={onToggleSidebar}
          className="p-2 -ml-2 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden focus:outline-none"
          aria-label="Open Navigation"
        >
          <Menu size={20} />
        </button>

        <div>
          <h1 className="text-base md:text-lg font-bold text-slate-800 dark:text-white tracking-tight leading-tight flex items-center gap-2">
            {pageInfo.title}
          </h1>
          <p className="hidden sm:block text-[11px] font-medium text-slate-500 dark:text-slate-400">
            {pageInfo.subtitle}
          </p>
        </div>
      </div>

      {/* Right: Quick Search, Status, Theme Toggle, Recruiter Pill */}
      <div className="flex items-center space-x-2 md:space-x-4">
        {/* Quick Search Bar Shortcut */}
        <button
          onClick={() => navigate('/search')}
          className="hidden md:flex items-center space-x-2 px-3 py-1.5 text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200/70 dark:hover:bg-slate-750 rounded-lg border border-slate-200/60 dark:border-slate-700/60 transition-all cursor-pointer group"
          title="Jump to Semantic Talent Search"
        >
          <Search size={14} className="group-hover:text-primary-600 dark:group-hover:text-primary-400" />
          <span className="font-medium">Semantic Search...</span>
          <kbd className="hidden lg:inline-block px-1.5 py-0.5 text-[10px] font-mono bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-slate-500 shadow-2xs">
            ⌘K
          </kbd>
        </button>

        {/* AI System Online Badge */}
        <div className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 rounded-full text-xs font-semibold">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>AI Matcher Active</span>
        </div>

        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
          className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800 transition-all"
        >
          {isDark ? (
            <Sun size={18} className="text-amber-400 hover:rotate-45 transition-transform" />
          ) : (
            <Moon size={18} className="text-slate-700 hover:-rotate-12 transition-transform" />
          )}
        </button>

        {/* Recruiter Avatar Badge */}
        <div className="flex items-center space-x-2 pl-2 border-l border-slate-200 dark:border-slate-800">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary-600 to-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-sm ring-2 ring-primary-500/20">
            HR
          </div>
          <div className="hidden xl:block text-left leading-tight">
            <span className="text-xs font-bold text-slate-800 dark:text-white block">Talent Lead</span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400">Enterprise ATS</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
