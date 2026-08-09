import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, 
  Briefcase, 
  Clock, 
  TrendingUp, 
  Upload, 
  ArrowRight,
  Sparkles,
  Plus,
  Search,
  CheckCircle2,
  AlertCircle,
  BarChart2,
  FileText,
  MapPin
} from 'lucide-react';
import { analyticsApi, resumeApi, jobApi } from '../services/api';
import { useRole } from '../context/RoleContext';
import { Lock } from 'lucide-react';

const Dashboard = () => {
  const { isHiringManager } = useRole();
  const [metrics, setMetrics] = useState(null);
  const [recentCandidates, setRecentCandidates] = useState([]);
  const [recentJobs, setRecentJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [analyticsRes, candidatesRes, jobsRes] = await Promise.all([
        analyticsApi.getMetrics(),
        resumeApi.getAll(),
        jobApi.getAll()
      ]);
      
      setMetrics(analyticsRes.data);
      setRecentCandidates(candidatesRes.data.slice(0, 6));
      setRecentJobs(jobsRes.data.slice(0, 4));
    } catch (err) {
      console.error('Failed to load dashboard metrics:', err);
      setError('Unable to connect to the recruitment platform API. Please ensure the backend server is running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-28 bg-slate-200 dark:bg-slate-800/60 rounded-2xl" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-slate-200 dark:bg-slate-800/60 rounded-2xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 h-96 bg-slate-200 dark:bg-slate-800/60 rounded-2xl" />
          <div className="h-96 bg-slate-200 dark:bg-slate-800/60 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 max-w-2xl mx-auto my-12 bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/50 rounded-2xl text-center space-y-4 shadow-lg">
        <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
          <AlertCircle size={28} />
        </div>
        <h3 className="text-lg font-bold text-slate-800 dark:text-white">API Connection Error</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400">{error}</p>
        <button
          onClick={fetchData}
          className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-xs font-semibold rounded-xl transition-all cursor-pointer shadow-sm"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  // Calculate Funnel Totals safely
  const funnel = metrics?.hiring_funnel || {};
  const hiredCount = funnel.Hired || 0;
  const shortlistedCount = funnel.Shortlisted || 0;
  const rejectedCount = funnel.Rejected || 0;
  const totalDecisions = hiredCount + shortlistedCount + rejectedCount;

  const statCards = [
    {
      title: 'Talent Pool',
      value: metrics?.total_candidates ?? 0,
      subtitle: 'Indexed Resumes',
      icon: Users,
      color: 'from-blue-600 to-cyan-600',
      badge: 'Active Database',
      to: '/resumes'
    },
    {
      title: 'Job Openings',
      value: metrics?.total_jobs ?? 0,
      subtitle: 'Open Requisitions',
      icon: Briefcase,
      color: 'from-emerald-600 to-teal-600',
      badge: 'Matching Ready',
      to: '/jobs'
    },
    {
      title: 'Avg. Experience',
      value: `${metrics?.average_experience ?? 0} Yrs`,
      subtitle: 'Across All Candidates',
      icon: Clock,
      color: 'from-violet-600 to-purple-600',
      badge: 'Seniority Index',
      to: '/analytics'
    },
    {
      title: 'Recruiter Actions',
      value: totalDecisions,
      subtitle: `${hiredCount} Hired • ${shortlistedCount} Shortlisted`,
      icon: TrendingUp,
      color: 'from-amber-500 to-orange-600',
      badge: 'Decision Funnel',
      to: '/analytics'
    }
  ];

  // Defensive skills calculation
  const skillDist = metrics?.skill_distribution || {};
  const skillEntries = Object.entries(skillDist);
  const maxSkillCount = skillEntries.length > 0 ? Math.max(...Object.values(skillDist)) : 1;

  return (
    <div className="space-y-8">
      {/* Hero Welcome Banner */}
      <div className="relative overflow-hidden p-6 sm:p-8 rounded-2xl bg-gradient-to-r from-primary-900 via-primary-800 to-slate-900 text-white shadow-xl shadow-primary-950/10 border border-primary-700/30">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 rounded-full bg-primary-500/20 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-primary-500/20 text-primary-200 border border-primary-400/30 text-xs font-semibold backdrop-blur-md">
              <Sparkles size={13} className="text-primary-300 animate-spin-slow" />
              <span>AI Semantic Matching & Extraction Engine</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Recruitment Intelligence Cockpit
            </h2>
            <p className="text-sm text-primary-100/80 font-normal leading-relaxed">
              Automated multi-format resume parsing, FAISS vector embeddings, and LLM-powered candidate-job recommendation matching.
            </p>
          </div>

          {isHiringManager ? (
            <div className="flex items-center space-x-2 bg-amber-500/20 text-amber-200 border border-amber-400/30 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold uppercase tracking-wider backdrop-blur-sm">
              <Lock size={16} className="text-amber-400" />
              <span>READ ONLY MODE</span>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-3">
              <Link
                to="/resumes"
                className="flex items-center space-x-2 bg-white hover:bg-slate-100 text-primary-900 font-bold px-4 py-2.5 rounded-xl text-xs sm:text-sm shadow-md hover:shadow-lg transition-all"
              >
                <Upload size={16} />
                <span>Ingest Resumes</span>
              </Link>
              <Link
                to="/jobs"
                className="flex items-center space-x-2 bg-primary-600/80 hover:bg-primary-600 text-white border border-primary-400/40 font-bold px-4 py-2.5 rounded-xl text-xs sm:text-sm shadow-sm transition-all"
              >
                <Plus size={16} />
                <span>New Job</span>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <Link
              key={idx}
              to={card.to}
              className="p-5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-2xs hover:shadow-lg dark:hover:shadow-primary-950/40 glow-card transition-all flex flex-col justify-between group"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  {card.title}
                </span>
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${card.color} text-white flex items-center justify-center shadow-md shadow-slate-900/10 group-hover:scale-105 transition-transform`}>
                  <Icon size={20} />
                </div>
              </div>

              <div>
                <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  {card.value}
                </div>
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 dark:border-slate-800/80 text-[11px]">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">
                    {card.subtitle}
                  </span>
                  <span className="text-primary-600 dark:text-primary-400 font-bold group-hover:translate-x-0.5 transition-transform">
                    →
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Columns: Top Skills & Recent Ingestions */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Top Canonical Skills */}
          <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-2xs">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <BarChart2 size={18} className="text-primary-600 dark:text-primary-400" />
                  Top Technical Skills in Talent Pool
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Normalized canonical skills aggregated across parsed resumes.
                </p>
              </div>
              <Link
                to="/analytics"
                className="text-primary-600 dark:text-primary-400 text-xs font-bold flex items-center hover:underline"
              >
                <span>Full Metrics</span>
                <ArrowRight size={13} className="ml-1" />
              </Link>
            </div>

            <div className="space-y-4">
              {skillEntries.length > 0 ? (
                skillEntries.slice(0, 6).map(([skill, count]) => {
                  const percentage = Math.round((count / maxSkillCount) * 100);
                  return (
                    <div key={skill} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span className="text-slate-800 dark:text-slate-200">{skill}</span>
                        <span className="text-slate-500 dark:text-slate-400 font-mono">
                          {count} candidate{count !== 1 ? 's' : ''}
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-primary-600 to-indigo-600 h-full rounded-full transition-all duration-700"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8 text-slate-400 dark:text-slate-500 text-xs font-medium">
                  No skills indexed yet. Upload resumes to generate skill analytics.
                </div>
              )}
            </div>
          </div>

          {/* Recent Candidates Table */}
          <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-2xs">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Users size={18} className="text-primary-600 dark:text-primary-400" />
                  Recent Candidate Profiles
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Latest parsed candidate records with confidence scores.
                </p>
              </div>
              <Link
                to="/resumes"
                className="text-primary-600 dark:text-primary-400 text-xs font-bold flex items-center hover:underline"
              >
                <span>View All ({metrics?.total_candidates ?? 0})</span>
                <ArrowRight size={13} className="ml-1" />
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
                    <th className="pb-3 pr-4">Candidate</th>
                    <th className="pb-3">Role</th>
                    <th className="pb-3">Experience</th>
                    <th className="pb-3">Location</th>
                    <th className="pb-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {recentCandidates.map((cand) => {
                    const initials = (cand.name || 'C')
                      .split(' ')
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join('')
                      .toUpperCase();
                    return (
                      <tr key={cand.id} className="text-slate-700 dark:text-slate-300 hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="py-3.5 pr-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-slate-200 to-slate-300 dark:from-slate-800 dark:to-slate-700 text-slate-700 dark:text-slate-200 font-bold flex items-center justify-center text-[11px]">
                              {initials}
                            </div>
                            <div>
                              <Link
                                to={`/resume/${cand.id}`}
                                className="font-bold text-slate-900 dark:text-white hover:text-primary-600 dark:hover:text-primary-400 block"
                              >
                                {cand.name}
                              </Link>
                              <span className="text-[10px] text-slate-400 block truncate max-w-[160px]">
                                {cand.email}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 font-medium text-slate-600 dark:text-slate-300">
                          {cand.role || <span className="text-slate-400 italic">Not extracted</span>}
                        </td>
                        <td className="py-3.5 font-semibold text-slate-800 dark:text-slate-200">
                          {cand.experience_years} Yrs
                        </td>
                        <td className="py-3.5 text-slate-500 dark:text-slate-400">
                          {cand.location || 'N/A'}
                        </td>
                        <td className="py-3.5 text-right">
                          <Link
                            to={`/resume/${cand.id}`}
                            className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-primary-50 dark:bg-primary-950/40 text-primary-700 dark:text-primary-300 hover:bg-primary-100 text-[11px] font-bold transition-colors"
                          >
                            <span>Profile</span>
                            <ArrowRight size={11} />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                  {recentCandidates.length === 0 && (
                    <tr>
                      <td colSpan="5" className="text-center py-8 text-slate-400 dark:text-slate-500">
                        No candidate resumes uploaded yet. Click 'Ingest Resumes' to get started.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* Right 1 Column: Active Openings & Recruiter Action Funnel */}
        <div className="space-y-8">
          
          {/* Active Job Openings */}
          <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-2xs">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Briefcase size={18} className="text-primary-600 dark:text-primary-400" />
                  Active Job Requisitions
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Click to view ranked candidate matches.
                </p>
              </div>
              <Link
                to="/jobs"
                className="text-primary-600 dark:text-primary-400 text-xs font-bold flex items-center hover:underline"
              >
                <span>All Jobs</span>
                <ArrowRight size={13} className="ml-1" />
              </Link>
            </div>

            <div className="space-y-3">
              {recentJobs.map((job) => (
                <Link
                  key={job.id}
                  to={`/job/${job.id}`}
                  className="p-4 border border-slate-200/70 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/30 hover:border-primary-500/40 hover:bg-white dark:hover:bg-slate-850/50 rounded-xl transition-all block group"
                >
                  <div className="flex items-start justify-between">
                    <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                      {job.title}
                    </h4>
                    <span className="text-[10px] font-bold text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-950/40 px-2 py-0.5 rounded-full">
                      Match
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400 mt-2 font-medium">
                    <span className="flex items-center gap-1">
                      <MapPin size={11} />
                      {job.location || 'Remote'}
                    </span>
                    <span>•</span>
                    <span>{job.experience || 'Any Exp'}</span>
                  </div>
                </Link>
              ))}
              {recentJobs.length === 0 && (
                <div className="text-center py-6 text-slate-400 text-xs">
                  No job descriptions active.
                </div>
              )}
            </div>
          </div>

          {/* Hiring Funnel Breakdown */}
          <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-2xs space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <TrendingUp size={18} className="text-primary-600 dark:text-primary-400" />
              Recruiter Decision Funnel
            </h3>
            
            <div className="space-y-3.5">
              {[
                { status: 'Shortlisted', count: shortlistedCount, color: 'bg-blue-600', text: 'text-blue-600 dark:text-blue-400' },
                { status: 'Hired', count: hiredCount, color: 'bg-emerald-600', text: 'text-emerald-600 dark:text-emerald-400' },
                { status: 'Rejected', count: rejectedCount, color: 'bg-rose-600', text: 'text-rose-600 dark:text-rose-400' }
              ].map((item) => {
                const pct = totalDecisions > 0 ? Math.round((item.count / totalDecisions) * 100) : 0;
                return (
                  <div key={item.status} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-slate-600 dark:text-slate-400 uppercase tracking-wider text-[10px]">
                        {item.status}
                      </span>
                      <span className={`font-bold ${item.text}`}>
                        {item.count} ({pct}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div
                        className={`${item.color} h-full rounded-full transition-all duration-500`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-2 text-[11px] text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800">
              Total recruiter reviews registered: <strong>{totalDecisions}</strong>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default Dashboard;
