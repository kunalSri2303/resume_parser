import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  Briefcase, 
  MapPin, 
  Clock, 
  GraduationCap, 
  ChevronRight, 
  Sparkles, 
  Check, 
  X, 
  UserCheck,
  Star,
  Eye,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Pencil
} from 'lucide-react';
import { jobApi, recommendationApi, feedbackApi } from '../services/api';
import { useRole } from '../context/RoleContext';
import { Lock } from 'lucide-react';

const JobDetails = () => {
  const { isHiringManager } = useRole();
  const { id } = useParams();
  const [job, setJob] = useState(null);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [matchingLoading, setMatchingLoading] = useState(false);

  // Edit Vacancy State
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState({
    title: '',
    location: '',
    experience: '',
    education: '',
    interview_date: ''
  });
  const [updating, setUpdating] = useState(false);
  
  // Feedback popup state
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [feedbackStatus, setFeedbackStatus] = useState(''); // 'Shortlisted', 'Hired', 'Rejected'
  const [feedbackText, setFeedbackText] = useState('');
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [feedbackSuccessMsg, setFeedbackSuccessMsg] = useState('');

  const fetchJobDetails = async () => {
    setLoading(true);
    try {
      const res = await jobApi.getById(id);
      setJob(res.data);
      
      // Fetch ranked candidates list immediately
      setMatchingLoading(true);
      const matchRes = await recommendationApi.matchJob(id);
      setMatches(matchRes.data || []);
    } catch (err) {
      console.error('Failed to load job details or candidates list:', err);
    } finally {
      setLoading(false);
      setMatchingLoading(false);
    }
  };

  useEffect(() => {
    fetchJobDetails();
  }, [id]);

  const handleFeedbackClick = (candidate, status) => {
    setSelectedCandidate(candidate);
    setFeedbackStatus(status);
    setFeedbackText('');
    setFeedbackSuccessMsg('');
  };

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCandidate || !feedbackStatus) return;
    
    setSubmittingFeedback(true);
    try {
      await feedbackApi.submit(
        selectedCandidate.candidate_id,
        id,
        feedbackStatus,
        feedbackText
      );
      setFeedbackSuccessMsg(`Successfully registered candidate feedback as '${feedbackStatus}'!`);
      setTimeout(() => {
        setSelectedCandidate(null);
        setFeedbackStatus('');
        setFeedbackText('');
      }, 1800);
    } catch (err) {
      console.error('Failed to submit recruiter feedback:', err);
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const handleStartEdit = () => {
    if (!job) return;
    setEditFormData({
      title: job.title || '',
      location: job.location || '',
      experience: job.experience || '',
      education: job.education || '',
      interview_date: job.interview_date || ''
    });
    setIsEditing(true);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    setUpdating(true);
    try {
      const res = await jobApi.update(id, {
        title: editFormData.title,
        location: editFormData.location,
        experience: editFormData.experience,
        education: editFormData.education,
        interview_date: editFormData.interview_date || null
      });
      setJob(res.data);
      setIsEditing(false);
    } catch (err) {
      console.error('Failed to update job details:', err);
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="text-center p-12 max-w-md mx-auto my-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-md">
        <p className="text-slate-500 dark:text-slate-400">Job requisition not found.</p>
        <Link
          to="/jobs"
          className="mt-4 inline-flex items-center px-4 py-2 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold transition-colors"
        >
          Back to Openings
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center space-x-2 text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
        <Link to="/jobs" className="hover:text-primary-600 dark:hover:text-primary-400">
          Job Positions
        </Link>
        <ChevronRight size={13} />
        <span className="text-slate-800 dark:text-white font-bold">Position #{job.id}</span>
      </div>

      {/* Job Header Info Card */}
      <div className="p-6 sm:p-8 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-2xs flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex items-start space-x-5">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-primary-600 via-primary-500 to-indigo-600 text-white flex items-center justify-center font-extrabold text-xl shadow-lg shadow-primary-500/20 ring-4 ring-primary-500/10 flex-shrink-0">
            <Briefcase size={28} />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center space-x-3">
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white leading-tight">
                {job.title}
              </h2>
              {!isHiringManager && (
                <button
                  type="button"
                  onClick={handleStartEdit}
                  className="p-1.5 text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                  title="Edit Vacancy Details"
                >
                  <Pencil size={16} />
                </button>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-xs text-slate-500 dark:text-slate-400 font-medium pt-1">
              <span className="flex items-center space-x-1">
                <MapPin size={13} />
                <span>{job.location || 'Remote'}</span>
              </span>
              <span className="flex items-center space-x-1">
                <Clock size={13} />
                <span>{job.experience || 'Any experience'}</span>
              </span>
              <span className="flex items-center space-x-1">
                <GraduationCap size={13} />
                <span>{job.education || 'CS / Engineering Degree'}</span>
              </span>
              <span className="flex items-center space-x-1 text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-50 dark:bg-indigo-950/40 px-2.5 py-0.5 rounded-md border border-indigo-500/20">
                <Calendar size={13} />
                <span>Interview Date: {job.interview_date || 'Not scheduled'}</span>
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3 border-t lg:border-t-0 pt-4 lg:pt-0 border-slate-100 dark:border-slate-800">
          {!isHiringManager && (
            <button
              type="button"
              onClick={handleStartEdit}
              className="flex items-center space-x-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl transition-colors cursor-pointer mr-2"
            >
              <Pencil size={14} />
              <span>Edit Requisition</span>
            </button>
          )}
          <div className="text-right">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Match Engine Status
            </span>
            <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 flex items-center justify-end gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {matches.length} Candidates Evaluated
            </span>
          </div>
        </div>
      </div>

   {/* Edit Vacancy Modal in JobDetails */}
      {!isHiringManager && isEditing && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Pencil size={18} className="text-primary-600 dark:text-primary-400" />
                Edit Position Requisition
              </h3>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Position Title
                </label>
                <input
                  type="text"
                  required
                  value={editFormData.title}
                  onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-bold"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Interview Date
                </label>
                <input
                  type="date"
                  value={editFormData.interview_date}
                  onChange={(e) => setEditFormData({ ...editFormData, interview_date: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-medium"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Location
                </label>
                <input
                  type="text"
                  value={editFormData.location}
                  onChange={(e) => setEditFormData({ ...editFormData, location: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-medium"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Required Experience
                </label>
                <input
                  type="text"
                  value={editFormData.experience}
                  onChange={(e) => setEditFormData({ ...editFormData, experience: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-medium"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Required Education
                </label>
                <input
                  type="text"
                  value={editFormData.education}
                  onChange={(e) => setEditFormData({ ...editFormData, education: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-medium"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-800 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="bg-primary-600 hover:bg-primary-700 disabled:bg-slate-400 text-white px-4 py-2 text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer"
                >
                  {updating ? 'Saving...' : 'Save Requisition'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Main Grid: Job Specifications vs Ranked Candidate Matches */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Job Requirements */}
        <div className="space-y-6">
          
          {/* Required Skills */}
          <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-2xs space-y-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles size={16} className="text-primary-500" />
              <span>Required Core Skills</span>
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {job.skills && job.skills.map((skill, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 bg-primary-50 dark:bg-primary-950/40 text-primary-700 dark:text-primary-300 rounded-lg text-xs font-semibold border border-primary-500/20"
                >
                  {skill}
                </span>
              ))}
              {(!job.skills || job.skills.length === 0) && (
                <p className="text-xs text-slate-400 italic">No skill requirements specified.</p>
              )}
            </div>
          </div>

          {/* Preferred Skills */}
          {job.preferred_skills && job.preferred_skills.length > 0 && (
            <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-2xs space-y-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Preferred Additional Assets
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {job.preferred_skills.map((skill, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Core Responsibilities */}
          <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-2xs space-y-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Role Responsibilities
            </h3>
            <ul className="list-disc list-inside text-xs font-normal text-slate-600 dark:text-slate-300 space-y-2 leading-relaxed">
              {job.responsibilities && job.responsibilities.map((resp, idx) => (
                <li key={idx}>{resp}</li>
              ))}
              {(!job.responsibilities || job.responsibilities.length === 0) && (
                <p className="list-none italic text-slate-400">No responsibilities extracted.</p>
              )}
            </ul>
          </div>

        </div>

        {/* Right 2 Columns: Candidate Relevance Rankings */}
        <div className="lg:col-span-2 space-y-6">
          
          <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-2xs space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Sparkles size={18} className="text-primary-500" />
                  Candidate Relevance Rankings
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Semantic section-weighted similarity calculated against active talent pool.
                </p>
              </div>
              {matchingLoading && (
                <span className="animate-spin border-2 border-primary-600 border-t-transparent rounded-full h-4 w-4" />
              )}
            </div>

            {matches.length > 0 ? (
              <div className="space-y-4">
                {matches.map((match, idx) => {
                  const sectionScores = match.section_scores || {};
                  return (
                    <div
                      key={match.candidate_id}
                      className="p-5 border border-slate-200/70 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 hover:border-primary-400/50 rounded-2xl transition-all space-y-4 glow-card"
                    >
                      {/* Candidate Card Header */}
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary-600 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                            #{idx + 1}
                          </div>
                          <div>
                            <Link
                              to={`/resume/${match.candidate_id}`}
                              className="font-bold text-sm text-slate-900 dark:text-white hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                            >
                              {match.name}
                            </Link>
                            <span className="text-xs text-slate-500 dark:text-slate-400 block font-medium">
                              {match.role || 'Role not extracted'}
                            </span>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-xl font-black text-primary-600 dark:text-primary-400">
                            {match.overall_score}%
                          </span>
                          <span className="text-[9px] font-bold text-slate-400 block uppercase tracking-wider">
                            Match Score
                          </span>
                        </div>
                      </div>

                      {/* Section Alignment Sub-Scores */}
                      <div className="grid grid-cols-5 gap-2 text-center text-[10px] font-bold text-slate-500 bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                        <div>
                          <span className="text-slate-400 block mb-0.5 font-semibold text-[9px]">SKILLS</span>
                          <span className="text-slate-800 dark:text-slate-200 font-extrabold">{sectionScores.skills ?? 0}%</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block mb-0.5 font-semibold text-[9px]">EXPERIENCE</span>
                          <span className="text-slate-800 dark:text-slate-200 font-extrabold">{sectionScores.experience ?? 0}%</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block mb-0.5 font-semibold text-[9px]">PROJECTS</span>
                          <span className="text-slate-800 dark:text-slate-200 font-extrabold">{sectionScores.projects ?? 0}%</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block mb-0.5 font-semibold text-[9px]">EDUCATION</span>
                          <span className="text-slate-800 dark:text-slate-200 font-extrabold">{sectionScores.education ?? 0}%</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block mb-0.5 font-semibold text-[9px]">SUMMARY</span>
                          <span className="text-slate-800 dark:text-slate-200 font-extrabold">{sectionScores.summary ?? 0}%</span>
                        </div>
                      </div>

                      {/* Actions Bar */}
                      <div className="flex flex-wrap items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 gap-3 text-xs">
                        <Link
                          to={`/resume/${match.candidate_id}`}
                          className="inline-flex items-center space-x-1 text-primary-600 dark:text-primary-400 font-bold hover:underline"
                        >
                          <span>Evaluate Profile & AI Insights</span>
                          <ArrowRight size={13} />
                        </Link>

                        {!isHiringManager && (
                          <div className="flex items-center space-x-1.5">
                            <button
                              onClick={() => handleFeedbackClick(match, 'Shortlisted')}
                              className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 font-bold hover:bg-blue-100 text-[11px] transition-colors cursor-pointer"
                            >
                              Shortlist
                            </button>
                            <button
                              onClick={() => handleFeedbackClick(match, 'Hired')}
                              className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 font-bold hover:bg-emerald-100 text-[11px] transition-colors flex items-center space-x-1 cursor-pointer"
                            >
                              <Check size={12} />
                              <span>Hire</span>
                            </button>
                            <button
                              onClick={() => handleFeedbackClick(match, 'Rejected')}
                              className="px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 font-bold hover:bg-rose-100 text-[11px] transition-colors flex items-center space-x-1 cursor-pointer"
                            >
                              <X size={12} />
                              <span>Reject</span>
                            </button>
                          </div>
                        )}
                      </div>

                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-slate-400 text-center py-12">
                No matching candidates in the talent pool yet. Ingest resumes to calculate rankings.
              </p>
            )}

          </div>

        </div>

      </div>

      {/* Recruiter Feedback Dialog Modal */}
      {!isHiringManager && selectedCandidate && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            
            <div className="flex items-center space-x-2.5 text-primary-600 dark:text-primary-400">
              <UserCheck size={22} />
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                Record Recruiter Decision
              </h3>
            </div>
            
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Mark <strong>{selectedCandidate.name}</strong> as <strong className="text-primary-600">{feedbackStatus}</strong> for {job.title}.
            </p>

            <form onSubmit={handleFeedbackSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Reviewer Notes (Optional)
                </label>
                <textarea
                  placeholder="e.g. Verified experience with microservices and Python async stack..."
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  className="w-full h-24 p-3 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 rounded-xl text-xs focus:outline-none focus:border-primary-500 font-medium resize-none leading-relaxed"
                />
              </div>

              {feedbackSuccessMsg && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300 text-xs font-bold rounded-xl border border-emerald-500/20 flex items-center space-x-2">
                  <CheckCircle2 size={16} />
                  <span>{feedbackSuccessMsg}</span>
                </div>
              )}

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedCandidate(null)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-800 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingFeedback}
                  className="bg-primary-600 hover:bg-primary-700 disabled:bg-slate-400 text-white px-4 py-2 text-xs font-bold rounded-xl transition-all shadow-sm"
                >
                  {submittingFeedback ? 'Saving...' : 'Register Decision'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default JobDetails;
