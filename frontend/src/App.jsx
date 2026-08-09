import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { RoleProvider } from './context/RoleContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import ResumesPage from './components/ResumesPage';
import CandidateDetails from './components/CandidateDetails';
import JobsPage from './components/JobsPage';
import JobDetails from './components/JobDetails';
import Search from './components/Search';
import AnalyticsPage from './components/AnalyticsPage';
import LoginPage from './components/LoginPage';
import ProfilePage from './components/ProfilePage';

function MainLayout() {
  const { isAuthenticated } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 antialiased selection:bg-primary-500 selection:text-white transition-colors duration-200">
      {/* Main Sidebar Nav */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 min-w-0 h-full overflow-hidden">
        {/* Top Navbar */}
        <Navbar onToggleSidebar={() => setSidebarOpen((prev) => !prev)} />

        {/* Scrollable Page Viewport */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto pb-12">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/resumes" element={<ResumesPage />} />
              <Route path="/resume/:id" element={<CandidateDetails />} />
              <Route path="/jobs" element={<JobsPage />} />
              <Route path="/job/:id" element={<JobDetails />} />
              <Route path="/search" element={<Search />} />
              <Route path="/analytics" element={<AnalyticsPage />} />
              <Route path="/profile" element={<ProfilePage />} />
            </Routes>
          </div>
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <RoleProvider>
      <AuthProvider>
        <ThemeProvider>
          <Router>
            <MainLayout />
          </Router>
        </ThemeProvider>
      </AuthProvider>
    </RoleProvider>
  );
}

export default App;
