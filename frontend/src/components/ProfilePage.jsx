import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  AlertCircle, 
  User, 
  KeyRound, 
  Users, 
  RefreshCw,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useRole } from '../context/RoleContext';
import { authApi } from '../services/api';

const ProfilePage = () => {
  const { currentUser } = useAuth();
  const { role, isAdmin } = useRole();

  // Self Change Password Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Admin User Management State
  const [userList, setUserList] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [resetTargetUser, setResetTargetUser] = useState(null);
  const [resetNewPassword, setResetNewPassword] = useState('');
  const [resetConfirmPassword, setResetConfirmPassword] = useState('');
  const [showResetPass, setShowResetPass] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSuccessMsg, setResetSuccessMsg] = useState('');
  const [resetErrorMsg, setResetErrorMsg] = useState('');

  const fetchUsers = async () => {
    if (!isAdmin) return;
    setLoadingUsers(true);
    try {
      const res = await authApi.getUsers();
      setUserList(res.data || []);
    } catch (err) {
      console.error('Failed to fetch users:', err);
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
    }
  }, [isAdmin]);

  const handleSelfPasswordChange = async (e) => {
    e.preventDefault();
    setSuccessMessage('');
    setErrorMessage('');

    if (!currentPassword) {
      setErrorMessage('Please enter your current password.');
      return;
    }
    if (!newPassword || newPassword.length < 8) {
      setErrorMessage('New password must be at least 8 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMessage('New password and confirmation do not match.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        current_password: currentPassword,
        new_password: newPassword,
        target_username: currentUser?.username || (isAdmin ? 'admin' : 'hiringmanager'),
        requester_role: role
      };

      const res = await authApi.changePassword(payload);
      if (res.data && res.data.status === 'success') {
        setSuccessMessage('Password updated successfully.');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        if (isAdmin) fetchUsers();
      } else {
        setErrorMessage(res.data?.message || 'Failed to update password.');
      }
    } catch (err) {
      const detail = err.response?.data?.detail || 'Failed to change password. Please check current password.';
      setErrorMessage(detail);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenResetModal = (user) => {
    setResetTargetUser(user);
    setResetNewPassword('');
    setResetConfirmPassword('');
    setResetSuccessMsg('');
    setResetErrorMsg('');
    setResetModalOpen(true);
  };

  const handleAdminResetPassword = async (e) => {
    e.preventDefault();
    setResetSuccessMsg('');
    setResetErrorMsg('');

    if (!resetNewPassword || resetNewPassword.length < 8) {
      setResetErrorMsg('New password must be at least 8 characters long.');
      return;
    }
    if (resetNewPassword !== resetConfirmPassword) {
      setResetErrorMsg('Passwords do not match.');
      return;
    }

    setResetLoading(true);
    try {
      const payload = {
        new_password: resetNewPassword,
        target_username: resetTargetUser.username,
        requester_role: 'admin'
      };

      const res = await authApi.changePassword(payload);
      if (res.data && res.data.status === 'success') {
        setResetSuccessMsg(`Password for ${resetTargetUser.username} updated successfully.`);
        setResetNewPassword('');
        setResetConfirmPassword('');
        fetchUsers();
        setTimeout(() => {
          setResetModalOpen(false);
        }, 1800);
      } else {
        setResetErrorMsg(res.data?.message || 'Failed to reset user password.');
      }
    } catch (err) {
      const detail = err.response?.data?.detail || 'Failed to reset password.';
      setResetErrorMsg(detail);
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      
      {/* Header Profile Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-2xs">
        <div className="flex items-center space-x-4">
          <div className={`w-14 h-14 rounded-2xl text-white flex items-center justify-center font-black text-xl shadow-lg ring-4 ${
            isAdmin 
              ? 'bg-gradient-to-tr from-primary-600 via-primary-500 to-indigo-600 ring-primary-500/20' 
              : 'bg-gradient-to-tr from-amber-500 to-orange-600 ring-amber-500/20'
          }`}>
            {isAdmin ? 'ADM' : 'HM'}
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <span>Account Security & Profile</span>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                isAdmin 
                  ? 'bg-primary-50 dark:bg-primary-950/60 text-primary-600 dark:text-primary-400 border border-primary-500/30' 
                  : 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-500/30'
              }`}>
                {isAdmin ? 'Administrator' : 'Hiring Manager (Read Only)'}
              </span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
              Manage authentication credentials and server-backed bcrypt password security
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-xs font-bold text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-950/60 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800">
          <KeyRound size={16} className="text-primary-500" />
          <span>Active User: <strong className="text-slate-800 dark:text-slate-200">{currentUser?.username || (isAdmin ? 'admin' : 'hiringmanager')}</strong></span>
        </div>
      </div>

      {/* Main Grid: Self Password Change & User Management */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Self Password Change Form */}
        <div className={`space-y-6 ${isAdmin ? 'lg:col-span-6' : 'lg:col-span-12 max-w-2xl mx-auto'}`}>
          <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-2xs space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-4">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Lock size={18} className="text-primary-600 dark:text-primary-400" />
                Change My Password
              </h2>
              <span className="text-[11px] font-medium text-slate-400">bcrypt Hashed</span>
            </div>

            <form onSubmit={handleSelfPasswordChange} className="space-y-4">
              
              {/* Current Password */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  Current Password
                </label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3.5 top-3 text-slate-400" />
                  <input
                    type={showCurrent ? 'text' : 'password'}
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter your current password"
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:border-primary-500 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrent(!showCurrent)}
                    className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  New Password <span className="text-[11px] font-normal text-slate-400">(Min. 8 characters)</span>
                </label>
                <div className="relative">
                  <KeyRound size={16} className="absolute left-3.5 top-3 text-slate-400" />
                  <input
                    type={showNew ? 'text' : 'password'}
                    required
                    minLength={8}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new secure password"
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:border-primary-500 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(!showNew)}
                    className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Confirm New Password */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  Confirm New Password
                </label>
                <div className="relative">
                  <KeyRound size={16} className="absolute left-3.5 top-3 text-slate-400" />
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    required
                    minLength={8}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:border-primary-500 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Notifications */}
              {successMessage && (
                <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-500/30 rounded-xl text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center space-x-2 animate-fade-in">
                  <CheckCircle2 size={16} className="text-emerald-500 flex-shrink-0" />
                  <span>{successMessage}</span>
                </div>
              )}

              {errorMessage && (
                <div className="p-3.5 bg-rose-50 dark:bg-rose-950/30 border border-rose-500/30 rounded-xl text-rose-800 dark:text-rose-300 text-xs font-bold flex items-center space-x-2 animate-fade-in">
                  <AlertCircle size={16} className="text-rose-500 flex-shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl text-xs shadow-md transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <span className="animate-spin border-2 border-white border-t-transparent rounded-full h-4 w-4 mr-1" />
                      <span>Updating Password...</span>
                    </>
                  ) : (
                    <>
                      <Lock size={16} />
                      <span>Update Password</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Column: User Management (Admin Only) */}
        {isAdmin && (
          <div className="lg:col-span-6 space-y-6">
            <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-2xs space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-4">
                <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Users size={18} className="text-primary-600 dark:text-primary-400" />
                  User Account Management
                </h2>
                <button
                  onClick={fetchUsers}
                  className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg"
                  title="Refresh User List"
                >
                  <RefreshCw size={14} className={loadingUsers ? 'animate-spin' : ''} />
                </button>
              </div>

              {/* Users Table */}
              <div className="overflow-hidden border border-slate-200/70 dark:border-slate-800 rounded-xl">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200/70 dark:border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      <th className="py-3 px-4">Account</th>
                      <th className="py-3 px-4">Role</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs font-medium">
                    {userList.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-4 font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                          <User size={14} className="text-primary-500" />
                          <span>{u.username}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            u.role === 'admin' 
                              ? 'bg-primary-50 dark:bg-primary-950/60 text-primary-600 dark:text-primary-400 border border-primary-500/30' 
                              : 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                          }`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          {u.username !== 'admin' ? (
                            <button
                              onClick={() => handleOpenResetModal(u)}
                              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-bold transition-all cursor-pointer"
                            >
                              Reset Password
                            </button>
                          ) : (
                            <span className="text-[11px] text-slate-400 italic">Self Managed</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-950/40 border border-slate-200/70 dark:border-slate-800 rounded-xl">
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  <strong className="text-slate-700 dark:text-slate-300">Admin Controls:</strong> Admins can reset credentials for Hiring Manager accounts without plain text password exposure.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Admin Reset Password Modal */}
      {resetModalOpen && resetTargetUser && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-5 animate-scale-up">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <ShieldCheck size={18} className="text-primary-500" />
                Reset Password for '{resetTargetUser.username}'
              </h3>
              <button
                onClick={() => setResetModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAdminResetPassword} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  New Password
                </label>
                <div className="relative">
                  <KeyRound size={16} className="absolute left-3.5 top-3 text-slate-400" />
                  <input
                    type={showResetPass ? 'text' : 'password'}
                    required
                    minLength={8}
                    value={resetNewPassword}
                    onChange={(e) => setResetNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:border-primary-500 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowResetPass(!showResetPass)}
                    className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {showResetPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={resetConfirmPassword}
                  onChange={(e) => setResetConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:border-primary-500 transition-colors"
                />
              </div>

              {resetSuccessMsg && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-500/30 rounded-xl text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center space-x-2">
                  <CheckCircle2 size={16} className="text-emerald-500" />
                  <span>{resetSuccessMsg}</span>
                </div>
              )}

              {resetErrorMsg && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-500/30 rounded-xl text-rose-800 dark:text-rose-300 text-xs font-bold flex items-center space-x-2">
                  <AlertCircle size={16} className="text-rose-500" />
                  <span>{resetErrorMsg}</span>
                </div>
              )}

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setResetModalOpen(false)}
                  className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resetLoading}
                  className="px-5 py-2 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl text-xs shadow-md transition-all cursor-pointer disabled:opacity-50"
                >
                  {resetLoading ? 'Saving...' : 'Save Reset Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
