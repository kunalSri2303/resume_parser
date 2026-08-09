import React, { useEffect, useState } from 'react';
import { 
  BarChart2, 
  MapPin, 
  Clock, 
  TrendingUp, 
  Award,
  Sparkles,
  Users,
  Briefcase,
  Layers,
  RefreshCw
} from 'lucide-react';
import { analyticsApi } from '../services/api';

const AnalyticsPage = () => {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await analyticsApi.getMetrics();
      setMetrics(res.data);
    } catch (err) {
      console.error('Failed to load analytics details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" />
      </div>
    );
  }

  // Defensive calculations for empty dictionaries
  const expDist = metrics?.experience_distribution || {};
  const expEntries = Object.entries(expDist);
  const maxExpCount = expEntries.length > 0 ? Math.max(...Object.values(expDist)) : 1;

  const locDist = metrics?.candidate_locations || {};
  const locEntries = Object.entries(locDist);
  const maxLocCount = locEntries.length > 0 ? Math.max(...Object.values(locDist)) : 1;

  const skillDist = metrics?.skill_distribution || {};
  const skillEntries = Object.entries(skillDist);
  const maxSkillCount = skillEntries.length > 0 ? Math.max(...Object.values(skillDist)) : 1;

  const trendDist = metrics?.resume_upload_trends || {};
  const trendEntries = Object.entries(trendDist);
  const maxTrendCount = trendEntries.length > 0 ? Math.max(...Object.values(trendDist)) : 1;

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            Talent Pool Analytics
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-primary-100 dark:bg-primary-950 text-primary-700 dark:text-primary-300 font-semibold font-mono">
              Live Insights
            </span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Aggregated metrics showing experience distributions, skill overlaps, and talent pipeline volume.
          </p>
        </div>

        <button
          onClick={fetchAnalytics}
          className="inline-flex items-center space-x-2 px-3.5 py-2 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold shadow-2xs transition-all self-start"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          <span>Refresh Metrics</span>
        </button>
      </div>

      {/* Top Overview KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-2xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Total Candidates
          </span>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white">
            {metrics?.total_candidates ?? 0}
          </div>
        </div>

        <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-2xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Active Job Positions
          </span>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white">
            {metrics?.total_jobs ?? 0}
          </div>
        </div>

        <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-2xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Average Experience
          </span>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white">
            {metrics?.average_experience ?? 0} Yrs
          </div>
        </div>

        <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-2xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Indexed Skills
          </span>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white">
            {skillEntries.length}
          </div>
        </div>
      </div>

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Experience Distribution (Vertical Column Chart) */}
        <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-2xs space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
              <Clock size={16} className="text-primary-500" />
              <span>Experience Tier Distribution</span>
            </h3>
            <span className="text-xs text-slate-400 font-medium">Candidate Counts</span>
          </div>

          <div className="h-64 flex items-end justify-around border-b border-slate-200 dark:border-slate-800 pb-2 px-2">
            {expEntries.length > 0 ? (
              expEntries.map(([bin, count]) => {
                const heightPercentage = maxExpCount > 0 ? (count / maxExpCount) * 100 : 0;
                return (
                  <div key={bin} className="flex flex-col items-center w-full max-w-[80px] space-y-2 group">
                    <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200 font-mono">
                      {count}
                    </span>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-44 rounded-xl flex items-end overflow-hidden p-1">
                      <div
                        className="w-full bg-gradient-to-t from-primary-600 to-indigo-600 rounded-lg transition-all duration-700 group-hover:from-primary-500 group-hover:to-indigo-500 shadow-xs"
                        style={{ height: `${Math.max(8, heightPercentage)}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 text-center truncate w-full" title={bin}>
                      {bin}
                    </span>
                  </div>
                );
              })
            ) : (
              <div className="text-xs text-slate-400 py-12">No experience data available.</div>
            )}
          </div>
        </div>

        {/* Candidate Locations (Horizontal Progress Bars) */}
        <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-2xs space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
              <MapPin size={16} className="text-primary-500" />
              <span>Top Candidate Locations</span>
            </h3>
            <span className="text-xs text-slate-400 font-medium">Geographic Reach</span>
          </div>

          <div className="space-y-4">
            {locEntries.length > 0 ? (
              locEntries.map(([loc, count]) => {
                const percentage = Math.round((count / maxLocCount) * 100);
                return (
                  <div key={loc} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-slate-800 dark:text-slate-200">{loc}</span>
                      <span className="text-slate-500 dark:text-slate-400 font-mono">
                        {count} candidate{count !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-indigo-600 to-purple-600 h-full rounded-full transition-all duration-700"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-xs text-slate-400 text-center py-16">
                No location records indexed yet.
              </p>
            )}
          </div>
        </div>

        {/* Skill Distribution */}
        <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-2xs space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
              <Award size={16} className="text-primary-500" />
              <span>Most Common Skills</span>
            </h3>
            <span className="text-xs text-slate-400 font-medium">Skill Frequency</span>
          </div>

          <div className="space-y-4">
            {skillEntries.length > 0 ? (
              skillEntries.slice(0, 8).map(([skill, count]) => {
                const percentage = Math.round((count / maxSkillCount) * 100);
                return (
                  <div key={skill} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-slate-800 dark:text-slate-200">{skill}</span>
                      <span className="text-slate-500 dark:text-slate-400 font-mono">
                        {count} profile{count !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-emerald-600 to-teal-600 h-full rounded-full transition-all duration-700"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-xs text-slate-400 text-center py-16">
                No skills indexed yet.
              </p>
            )}
          </div>
        </div>

        {/* Upload Volume Trends */}
        <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-2xs space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
              <TrendingUp size={16} className="text-primary-500" />
              <span>Resume Ingestion Timeline</span>
            </h3>
            <span className="text-xs text-slate-400 font-medium">Activity Volume</span>
          </div>

          <div className="space-y-4">
            {trendEntries.length > 0 ? (
              trendEntries.map(([date, count]) => {
                const percentage = Math.round((count / maxTrendCount) * 100);
                return (
                  <div key={date} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-slate-800 dark:text-slate-200">{date}</span>
                      <span className="text-slate-500 dark:text-slate-400 font-mono">
                        {count} resume{count !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-violet-600 to-purple-600 h-full rounded-full transition-all duration-700"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-xs text-slate-400 text-center py-16">
                No upload events recorded yet.
              </p>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default AnalyticsPage;
