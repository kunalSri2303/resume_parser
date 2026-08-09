import React, { useState } from 'react';
import { 
  FileCheck2, 
  ShieldCheck, 
  Briefcase, 
  Lock, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  Sparkles,
  ArrowRight,
  User
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useRole } from '../context/RoleContext';

const LoginPage = () => {
  const { login } = useAuth();
  const { setRole } = useRole();

  const [selectedRole, setSelectedRole] = useState('admin'); // 'admin' or 'hiring_manager'
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleRoleSelect = (roleKey) => {
    setSelectedRole(roleKey);
    setErrorMessage('');
    setPassword('');
    if (roleKey === 'admin') {
      setUsername('admin');
    } else {
      setUsername('hiringmanager');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    if (!password) {
      setErrorMessage('Please enter your password.');
      return;
    }

    setLoading(true);
    try {
      const res = await login(selectedRole, username, password, setRole);
      if (!res.success) {
        setErrorMessage(res.message || 'Authentication failed. Please check your credentials.');
      }
    } catch (err) {
      console.error('Login error:', err);
      setErrorMessage('An unexpected authentication error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-100 flex items-center justify-center p-4 sm:p-6 lg:p-8 relative overflow-hidden selection:bg-primary-500 selection:text-white font-sans">
      {/* Dynamic Ambient Background Glows */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary-600/20 rounded-full blur-3xl pointer-events-none animate-pulse-slow" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />

      {/* Main Glassmorphism Container */}
      <div className="w-full max-w-md bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 z-10 animate-fade-in relative">
        
        {/* Brand Header */}
        <div className="text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-primary-600 via-primary-500 to-indigo-600 text-white flex items-center justify-center mx-auto shadow-xl shadow-primary-500/25 ring-4 ring-primary-500/10">
            <FileCheck2 size={30} className="stroke-[2.5]" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-white flex items-center justify-center gap-2">
              RecruitAI
              <span className="text-[10px] font-bold uppercase tracking-wider bg-primary-950 text-primary-300 border border-primary-800 px-2 py-0.5 rounded-md">
                PRO
              </span>
            </h1>
            <p className="text-xs text-slate-400 font-medium mt-1">
              Enterprise Talent Intelligence Cockpit
            </p>
          </div>
        </div>

        {/* Role Selection Tabs */}
        <div className="space-y-2">
          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block text-center">
            Select Account Role:
          </label>
          <div className="grid grid-cols-2 gap-2 bg-slate-950/80 p-1.5 rounded-2xl border border-slate-800">
            <button
              type="button"
              onClick={() => handleRoleSelect('admin')}
              className={`py-2.5 px-3 rounded-xl transition-all flex items-center justify-center space-x-2 text-xs font-bold cursor-pointer ${
                selectedRole === 'admin'
                  ? 'bg-gradient-to-r from-primary-600 to-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <ShieldCheck size={16} />
              <span>Admin</span>
            </button>

            <button
              type="button"
              onClick={() => handleRoleSelect('hiring_manager')}
              className={`py-2.5 px-3 rounded-xl transition-all flex items-center justify-center space-x-2 text-xs font-bold cursor-pointer ${
                selectedRole === 'hiring_manager'
                  ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <Briefcase size={16} />
              <span>Hiring Manager</span>
            </button>
          </div>
        </div>

        {/* Credentials Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Username Field */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 block">
              Username
            </label>
            <div className="relative">
              <User size={16} className="absolute left-3.5 top-3.5 text-slate-500" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username..."
                className="w-full pl-10 pr-4 py-3 bg-slate-950/60 border border-slate-800 rounded-xl text-xs font-semibold text-white focus:outline-none focus:border-primary-500 transition-colors"
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 block">
              Password
            </label>
            <div className="relative">
              <Lock size={16} className="absolute left-3.5 top-3.5 text-slate-500" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password..."
                className="w-full pl-10 pr-10 py-3 bg-slate-950/60 border border-slate-800 rounded-xl text-xs font-semibold text-white focus:outline-none focus:border-primary-500 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3.5 text-slate-400 hover:text-white transition-colors cursor-pointer"
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="p-3.5 bg-rose-950/40 border border-rose-500/30 rounded-xl text-rose-300 text-xs font-bold flex items-center space-x-2 animate-fade-in">
              <AlertCircle size={16} className="text-rose-400 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3.5 rounded-xl font-extrabold text-xs tracking-wider uppercase text-white shadow-lg transition-all flex items-center justify-center space-x-2 cursor-pointer ${
              selectedRole === 'hiring_manager'
                ? 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 shadow-amber-950/30'
                : 'bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-700 hover:to-indigo-700 shadow-primary-950/30'
            }`}
          >
            {loading ? (
              <>
                <span className="animate-spin border-2 border-white border-t-transparent rounded-full h-4 w-4 mr-1" />
                <span>Authenticating...</span>
              </>
            ) : (
              <>
                <span>Login to Cockpit</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        {/* Footer Note */}
        <div className="pt-2 text-center border-t border-slate-800/80">
          <p className="text-[11px] text-slate-500 font-medium">
            Protected Enterprise ATS • Database Authenticated Gate
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
