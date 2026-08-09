import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Building, 
  Clock, 
  Briefcase, 
  Award, 
  GraduationCap, 
  FolderGit2, 
  Globe2, 
  FileText, 
  BookmarkCheck, 
  ChevronRight, 
  Sparkles, 
  Link2, 
  Code2, 
  Globe, 
  ExternalLink, 
  ShieldCheck, 
  CheckCircle2, 
  AlertTriangle, 
  Copy, 
  Check, 
  X, 
  UserCheck 
} from 'lucide-react';
import { resumeApi, jobApi, recommendationApi, feedbackApi } from '../services/api';
import { useRole } from '../context/RoleContext';
import { Lock } from 'lucide-react';

const CandidateDetails = () => {
  const { isHiringManager } = useRole();
  const { id } = useParams();
  const [candidate, setCandidate] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [selectedJobId, setSelectedJobId] = useState('');
  const [aiReport, setAiReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reportLoading, setReportLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('profile'); // 'profile', 'resume', 'evaluation'
  const [copiedRawText, setCopiedRawText] = useState(false);

  // Recruiter action state inside evaluation tab
  const [feedbackStatus, setFeedbackStatus] = useState('');
  const [feedbackNote, setFeedbackNote] = useState('');
  const [feedbackSuccess, setFeedbackSuccess] = useState('');
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [candRes, jobsRes] = await Promise.all([
          resumeApi.getById(id),
          jobApi.getAll()
        ]);
        setCandidate(candRes.data);
        setJobs(jobsRes.data || []);
        if (jobsRes.data && jobsRes.data.length > 0) {
          setSelectedJobId(jobsRes.data[0].id);
        }
      } catch (err) {
        console.error('Failed to load candidate details:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const loadAiReport = async (jobId) => {
    const jId = jobId || selectedJobId;
    if (!jId) return;
    setReportLoading(true);
    setAiReport(null);
    setFeedbackSuccess('');
    try {
      const res = await recommendationApi.getReport(id, jId);
      setAiReport(res.data);
    } catch (err) {
      console.error('Failed to fetch recommendation report:', err);
    } finally {
      setReportLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'evaluation' && selectedJobId) {
      loadAiReport(selectedJobId);
    }
  }, [activeTab, selectedJobId]);

  const handleCopyRawText = () => {
    if (!candidate?.raw_text) return;
    navigator.clipboard.writeText(candidate.raw_text);
    setCopiedRawText(true);
    setTimeout(() => setCopiedRawText(false), 2000);
  };

  const handleFeedbackSubmit = async (status) => {
    if (!selectedJobId) return;
    setSubmittingFeedback(true);
    try {
      await feedbackApi.submit(id, selectedJobId, status, feedbackNote);
      setFeedbackStatus(status);
      setFeedbackSuccess(`Decision registered as '${status}'!`);
      setTimeout(() => setFeedbackSuccess(''), 3000);
    } catch (err) {
      console.error('Failed to submit feedback:', err);
    } finally {
      setSubmittingFeedback(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" />
      </div>
    );
  }

  if (!candidate) {
    return (
      <div className="text-center p-12 max-w-md mx-auto my-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-md">
        <p className="text-slate-500 dark:text-slate-400">Candidate profile not found.</p>
        <Link
          to="/resumes"
          className="mt-4 inline-flex items-center px-4 py-2 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold transition-colors"
        >
          Back to Candidates
        </Link>
      </div>
    );
  }

  // Parse nested properties defensively
  const personalInfo = candidate.personal_information || {};
  const linkedinUrl = personalInfo.linkedin || candidate.linkedin;
  const githubUrl = personalInfo.github || candidate.github;
  const portfolioUrl = personalInfo.portfolio || candidate.portfolio;
  const categorizedSkills = candidate.categorized_skills || {};
  const confidenceScores = candidate.confidence || {};

  // Standard skills list
  const allSkills = Array.isArray(candidate.skills)
    ? candidate.skills.map((s) => (typeof s === 'string' ? s : s.skill?.name || '')).filter(Boolean)
    : [];

  return (
    <div className="space-y-6">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center space-x-2 text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
        <Link to="/resumes" className="hover:text-primary-600 dark:hover:text-primary-400">
          Talent Pool
        </Link>
        <ChevronRight size={13} />
        <span className="text-slate-800 dark:text-white font-bold">Candidate #{candidate.id}</span>
      </div>

      {/* Candidate Profile Header Card */}
      <div className="p-6 sm:p-8 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-2xs flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex items-start space-x-5">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-primary-600 via-primary-500 to-indigo-600 text-white flex items-center justify-center font-extrabold text-xl shadow-lg shadow-primary-500/20 ring-4 ring-primary-500/10 flex-shrink-0">
            {(candidate.name || 'C')
              .split(' ')
              .map((n) => n[0])
              .slice(0, 2)
              .join('')
              .toUpperCase()}
          </div>

          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white leading-tight">
                {candidate.name}
              </h2>
              {candidate.profession?.seniority && (
                <span className="px-2 py-0.5 rounded-full bg-primary-50 dark:bg-primary-950/50 text-primary-700 dark:text-primary-300 text-[10px] font-bold uppercase tracking-wider border border-primary-500/20">
                  {candidate.profession.seniority}
                </span>
              )}
            </div>

            <p className="text-sm font-bold text-primary-600 dark:text-primary-400">
              {candidate.role || candidate.profession?.target_roles?.[0] || 'Role Undefined'}
            </p>

            <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-xs text-slate-500 dark:text-slate-400 font-medium pt-1">
              <span className="flex items-center space-x-1">
                <Mail size={13} />
                <span>{candidate.email}</span>
              </span>
              {candidate.phone && (
                <span className="flex items-center space-x-1">
                  <Phone size={13} />
                  <span>{candidate.phone}</span>
                </span>
              )}
              {candidate.location && (
                <span className="flex items-center space-x-1">
                  <MapPin size={13} />
                  <span>{candidate.location}</span>
                </span>
              )}
              <span className="flex items-center space-x-1 font-semibold text-slate-700 dark:text-slate-300">
                <Clock size={13} />
                <span>{candidate.experience_years} Yrs Exp</span>
              </span>
            </div>

            {/* Social / Portfolio Links */}
            {(linkedinUrl || githubUrl || portfolioUrl) && (
              <div className="flex flex-wrap items-center gap-2 pt-2">
                {linkedinUrl && (
                  <a
                    href={linkedinUrl.startsWith('http') ? linkedinUrl : `https://${linkedinUrl}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 hover:bg-blue-100 text-[11px] font-semibold border border-blue-500/20 transition-colors"
                  >
                    <Link2 size={12} />
                    <span>LinkedIn</span>
                    <ExternalLink size={10} />
                  </a>
                )}
                {githubUrl && (
                  <a
                    href={githubUrl.startsWith('http') ? githubUrl : `https://${githubUrl}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 text-[11px] font-semibold border border-slate-300 dark:border-slate-700 transition-colors"
                  >
                    <Code2 size={12} />
                    <span>GitHub</span>
                    <ExternalLink size={10} />
                  </a>
                )}
                {portfolioUrl && (
                  <a
                    href={portfolioUrl.startsWith('http') ? portfolioUrl : `https://${portfolioUrl}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 text-[11px] font-semibold border border-indigo-500/20 transition-colors"
                  >
                    <Globe size={12} />
                    <span>Portfolio</span>
                    <ExternalLink size={10} />
                  </a>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Quick parameters */}
        <div className="grid grid-cols-2 sm:grid-cols-2 gap-3 border-t lg:border-t-0 pt-4 lg:pt-0 border-slate-100 dark:border-slate-800 text-xs">
          <div className="p-3.5 bg-slate-50 dark:bg-slate-950/50 rounded-xl border border-slate-100 dark:border-slate-800">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-0.5">
              Notice Period
            </span>
            <span className="text-slate-800 dark:text-slate-200 font-bold">
              {candidate.notice_period || 'Immediate'}
            </span>
          </div>
          <div className="p-3.5 bg-slate-50 dark:bg-slate-950/50 rounded-xl border border-slate-100 dark:border-slate-800">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-0.5">
              Expected Salary
            </span>
            <span className="text-slate-800 dark:text-slate-200 font-bold">
              {candidate.expected_salary || 'Negotiable'}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="border-b border-slate-200 dark:border-slate-800 flex space-x-6 text-sm font-semibold">
        {[
          { id: 'profile', label: 'Structured Profile', icon: User },
          { id: 'evaluation', label: 'AI Evaluation & Match', icon: Sparkles },
          { id: 'resume', label: 'Original Resume Text', icon: FileText }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-3 flex items-center space-x-2 border-b-2 transition-all cursor-pointer ${
                isActive
                  ? 'border-primary-600 text-primary-600 dark:text-primary-400 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tabs Viewport */}
      <div>
        {/* Tab 1: Profile */}
        {activeTab === 'profile' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left 2 Columns: Summary, Work History, Projects, Achievements */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Summary */}
              <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-2xs space-y-3">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                  <FileText size={16} className="text-primary-500" />
                  <span>Executive Professional Summary</span>
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
                  {candidate.summary || 'No professional summary extracted.'}
                </p>
              </div>

              {/* Work Experience Timeline */}
              <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-2xs space-y-6">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                  <Briefcase size={16} className="text-primary-500" />
                  <span>Work History & Experience</span>
                </h3>

                <div className="space-y-6 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
                  {candidate.experience && candidate.experience.length > 0 ? (
                    candidate.experience.map((exp, idx) => (
                      <div key={idx} className="pl-8 relative space-y-1.5">
                        <div className="absolute left-1.5 top-1.5 w-3.5 h-3.5 bg-primary-600 rounded-full border-4 border-white dark:border-slate-900 shadow-xs" />
                        <div className="flex flex-wrap items-center justify-between gap-1">
                          <h4 className="font-bold text-sm text-slate-900 dark:text-white leading-tight">
                            {exp.title}
                          </h4>
                          {exp.duration && (
                            <span className="text-[11px] font-bold text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-950/40 px-2 py-0.5 rounded-full">
                              {exp.duration}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold flex items-center space-x-1.5">
                          <Building size={12} />
                          <span>{exp.company}</span>
                          {exp.location && <span>• {exp.location}</span>}
                        </p>
                        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed pt-1">
                          {exp.description}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-400 italic pl-8">No formal work experience records found.</p>
                  )}
                </div>
              </div>

              {/* Projects */}
              <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-2xs space-y-4">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                  <FolderGit2 size={16} className="text-primary-500" />
                  <span>Key Projects</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {candidate.projects && candidate.projects.length > 0 ? (
                    candidate.projects.map((proj, idx) => (
                      <div
                        key={idx}
                        className="p-4 border border-slate-200/70 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30 rounded-xl space-y-2"
                      >
                        <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                          {proj.name}
                        </h4>
                        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                          {proj.description}
                        </p>
                        {proj.technologies_used && proj.technologies_used.length > 0 && (
                          <div className="flex flex-wrap gap-1 pt-1">
                            {proj.technologies_used.map((tech, i) => (
                              <span
                                key={i}
                                className="px-1.5 py-0.5 bg-primary-50 dark:bg-primary-950/40 text-primary-700 dark:text-primary-300 rounded text-[10px] font-bold"
                              >
                                {tech}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-400 italic col-span-2">No projects documented.</p>
                  )}
                </div>
              </div>

              {/* Achievements & Awards */}
              {candidate.achievements && candidate.achievements.length > 0 && (
                <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-2xs space-y-3">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                    <Award size={16} className="text-primary-500" />
                    <span>Notable Achievements & Honors</span>
                  </h3>
                  <ul className="list-disc list-inside text-xs text-slate-700 dark:text-slate-300 space-y-1.5 font-medium leading-relaxed">
                    {candidate.achievements.map((ach, idx) => (
                      <li key={idx}>{typeof ach === 'string' ? ach : ach.title || JSON.stringify(ach)}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Right 1 Column: Categorized Skills, Education, Certifications, AI Extraction Certainty */}
            <div className="space-y-6">
              
              {/* Categorized Skills */}
              <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-2xs space-y-4">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                  <Award size={16} className="text-primary-500" />
                  <span>Technical & Domain Skills</span>
                </h3>

                {/* If categorized skills exist, render by category */}
                {Object.keys(categorizedSkills).length > 0 ? (
                  <div className="space-y-3">
                    {Object.entries(categorizedSkills).map(([category, skillsArr]) => {
                      if (!Array.isArray(skillsArr) || skillsArr.length === 0) return null;
                      return (
                        <div key={category} className="space-y-1.5">
                          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                            {category.replace('_', ' ')}
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {skillsArr.map((sk, i) => (
                              <span
                                key={i}
                                className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-lg text-xs font-semibold"
                              >
                                {sk}
                              </span>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {allSkills.map((sk, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-lg text-xs font-semibold"
                      >
                        {sk}
                      </span>
                    ))}
                    {allSkills.length === 0 && (
                      <p className="text-xs text-slate-400 italic">No skills listed.</p>
                    )}
                  </div>
                )}
              </div>

              {/* Education */}
              <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-2xs space-y-4">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                  <GraduationCap size={16} className="text-primary-500" />
                  <span>Academic Education</span>
                </h3>
                <div className="space-y-4">
                  {candidate.education && candidate.education.length > 0 ? (
                    candidate.education.map((edu, idx) => (
                      <div
                        key={idx}
                        className="text-xs border-b border-slate-100 dark:border-slate-800/80 pb-3 last:border-b-0 last:pb-0 space-y-0.5"
                      >
                        <h4 className="font-bold text-slate-900 dark:text-white">{edu.degree}</h4>
                        <p className="text-slate-600 dark:text-slate-400">{edu.field_of_study}</p>
                        <p className="text-[11px] text-slate-400 font-medium">
                          {edu.institution} {edu.graduation_year && `(${edu.graduation_year})`}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-400 italic">No education records found.</p>
                  )}
                </div>
              </div>

              {/* Certifications & Licenses */}
              {(candidate.certifications?.length > 0 || candidate.licenses?.length > 0) && (
                <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-2xs space-y-4">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                    <ShieldCheck size={16} className="text-primary-500" />
                    <span>Certifications & Credentials</span>
                  </h3>
                  <div className="space-y-2.5">
                    {candidate.certifications?.map((cert, idx) => {
                      const certName = typeof cert === 'string' ? cert : cert.name;
                      const certIssuer = typeof cert === 'object' ? cert.issuer : null;
                      return (
                        <div
                          key={idx}
                          className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800 text-xs"
                        >
                          <span className="font-bold text-slate-800 dark:text-slate-200 block">
                            {certName}
                          </span>
                          {certIssuer && (
                            <span className="text-[10px] text-slate-400 block mt-0.5">
                              Issuer: {certIssuer}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* AI Extraction Confidence */}
              {Object.keys(confidenceScores).length > 0 && (
                <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-2xs space-y-3">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles size={14} className="text-primary-500" />
                    Extraction Confidence
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(confidenceScores).map(([key, val]) => {
                      const scoreNum = typeof val === 'number' ? Math.round(val <= 1 ? val * 100 : val) : 95;
                      return (
                        <div key={key} className="p-2 bg-slate-50 dark:bg-slate-950/40 rounded-lg text-center">
                          <span className="text-[10px] text-slate-400 uppercase font-semibold block truncate">
                            {key}
                          </span>
                          <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400">
                            {scoreNum}%
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

            </div>
          </div>
        )}

        {/* Tab 2: AI Evaluation Cockpit */}
        {activeTab === 'evaluation' && (
          <div className="space-y-6">
            {/* Job Requisition Selection Card */}
            <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <Sparkles size={16} className="text-primary-500" />
                  Target Position Evaluation
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Select a job description to trigger FAISS section matching & Gemini AI recommendation.
                </p>
              </div>

              <div className="flex items-center space-x-3">
                <select
                  value={selectedJobId}
                  onChange={(e) => setSelectedJobId(e.target.value)}
                  className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-semibold px-3 py-2.5 rounded-xl focus:outline-none focus:border-primary-500 min-w-[200px]"
                >
                  <option value="" disabled>Select Job Position</option>
                  {jobs.map((job) => (
                    <option key={job.id} value={job.id}>
                      {job.title} (#{job.id})
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => loadAiReport(selectedJobId)}
                  disabled={!selectedJobId || reportLoading}
                  className="px-4 py-2.5 bg-primary-600 hover:bg-primary-700 disabled:bg-slate-300 dark:disabled:bg-slate-800 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  {reportLoading ? 'Analyzing...' : 'Re-Evaluate'}
                </button>
              </div>
            </div>

            {/* Evaluation Display */}
            {reportLoading ? (
              <div className="p-16 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-3">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600 mx-auto" />
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Computing Section Embeddings & AI Analysis...
                </p>
                <p className="text-[11px] text-slate-400">Evaluating candidate suitability against role parameters.</p>
              </div>
            ) : aiReport ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left 2 Columns: Strengths, Weaknesses, Consultation Summary */}
                <div className="lg:col-span-2 space-y-6">
                  
                  {/* Strengths and Gaps */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Strengths */}
                    <div className="p-6 bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-500/30 rounded-2xl space-y-3">
                      <h4 className="font-bold text-xs uppercase tracking-wider text-emerald-800 dark:text-emerald-300 flex items-center space-x-2">
                        <CheckCircle2 size={16} className="text-emerald-500" />
                        <span>Key Strengths</span>
                      </h4>
                      <ul className="text-xs space-y-2 text-emerald-900 dark:text-emerald-300 font-medium list-disc list-inside">
                        {aiReport.strengths && aiReport.strengths.length > 0 ? (
                          aiReport.strengths.map((str, idx) => (
                            <li key={idx} className="leading-relaxed">{str}</li>
                          ))
                        ) : (
                          <li className="list-none italic">No specific strengths parsed.</li>
                        )}
                      </ul>
                    </div>

                    {/* Weaknesses / Gaps */}
                    <div className="p-6 bg-rose-50/40 dark:bg-rose-950/20 border border-rose-500/30 rounded-2xl space-y-3">
                      <h4 className="font-bold text-xs uppercase tracking-wider text-rose-800 dark:text-rose-300 flex items-center space-x-2">
                        <AlertTriangle size={16} className="text-rose-500" />
                        <span>Skill Gaps & Risks</span>
                      </h4>
                      <ul className="text-xs space-y-2 text-rose-900 dark:text-rose-300 font-medium list-disc list-inside">
                        {aiReport.weaknesses && aiReport.weaknesses.length > 0 ? (
                          aiReport.weaknesses.map((wk, idx) => (
                            <li key={idx} className="leading-relaxed">{wk}</li>
                          ))
                        ) : (
                          <li className="list-none italic">No critical gap identified.</li>
                        )}
                      </ul>
                    </div>
                  </div>

                  {/* AI Consultation Narrative */}
                  <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-2xs space-y-3">
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                      <Sparkles size={16} className="text-primary-500" />
                      AI Consultation Synthesis
                    </h4>
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-normal whitespace-pre-wrap">
                      {aiReport.recommendation_text || 'Recommendation synthesis available.'}
                    </p>
                  </div>

                  {/* Recruiter Action Decision Box */}
                  {!isHiringManager ? (
                    <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-2xs space-y-4">
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                        <UserCheck size={16} className="text-primary-500" />
                        Take Recruiter Action
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Record an immediate decision to update candidate status in the hiring pipeline.
                      </p>

                      <div className="space-y-3">
                        <textarea
                          placeholder="Add optional reviewer notes (e.g. Strong system design interview candidate)..."
                          value={feedbackNote}
                          onChange={(e) => setFeedbackNote(e.target.value)}
                          className="w-full h-20 p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:border-primary-500 resize-none font-medium leading-relaxed"
                        />

                        {feedbackSuccess && (
                          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300 rounded-xl text-xs font-bold border border-emerald-500/20">
                            {feedbackSuccess}
                          </div>
                        )}

                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => handleFeedbackSubmit('Shortlisted')}
                            disabled={submittingFeedback}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                          >
                            Shortlist
                          </button>
                          <button
                            onClick={() => handleFeedbackSubmit('Hired')}
                            disabled={submittingFeedback}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center space-x-1 cursor-pointer"
                          >
                            <Check size={14} />
                            <span>Mark Hired</span>
                          </button>
                          <button
                            onClick={() => handleFeedbackSubmit('Rejected')}
                            disabled={submittingFeedback}
                            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center space-x-1 cursor-pointer"
                          >
                            <X size={14} />
                            <span>Reject</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-500/20 rounded-2xl text-amber-800 dark:text-amber-300 text-xs font-bold flex items-center space-x-2">
                      <Lock size={16} className="text-amber-500 flex-shrink-0" />
                      <span>Viewing candidate evaluation in Read Only mode. Candidate status modification is disabled for Hiring Managers.</span>
                    </div>
                  )}

                </div>

                {/* Right 1 Column: Match Gauge, Interview Status & Missing Skills */}
                <div className="space-y-6">
                  
                  {/* Match Score Card */}
                  <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl text-center space-y-4 shadow-2xs">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      OVERALL MATCH SCORE
                    </span>
                    <div className="text-5xl font-black text-primary-600 dark:text-primary-400 tracking-tight">
                      {aiReport.match_score}%
                    </div>
                    
                    <div className="pt-2">
                      {aiReport.interview_ready ? (
                        <div className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400 rounded-full text-xs font-bold uppercase tracking-wider">
                          <CheckCircle2 size={14} />
                          <span>Interview Ready</span>
                        </div>
                      ) : (
                        <div className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400 rounded-full text-xs font-bold uppercase tracking-wider">
                          <AlertTriangle size={14} />
                          <span>Hold / Match Gap</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Missing Skills Pill Box */}
                  <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-2xs space-y-3">
                    <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Missing Role Requirements
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {aiReport.missing_skills && aiReport.missing_skills.length > 0 ? (
                        aiReport.missing_skills.map((sk, idx) => (
                          <span
                            key={idx}
                            className="px-2.5 py-1 bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400 rounded-lg text-xs font-bold border border-rose-500/20"
                          >
                            {sk}
                          </span>
                        ))
                      ) : (
                        <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                          Candidate matches all primary requested skills!
                        </p>
                      )}
                    </div>
                  </div>

                </div>
              </div>
            ) : (
              <div className="p-12 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-500 text-xs">
                Please select an active job requisition to trigger evaluation.
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Raw Document Text */}
        {activeTab === 'resume' && (
          <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                <FileText size={16} />
                <span>Extracted Document Text</span>
              </h3>
              <button
                onClick={handleCopyRawText}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-all cursor-pointer"
              >
                {copiedRawText ? (
                  <>
                    <Check size={14} className="text-emerald-600" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy size={14} />
                    <span>Copy Text</span>
                  </>
                )}
              </button>
            </div>

            <pre className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200/70 dark:border-slate-800 rounded-xl text-xs text-slate-700 dark:text-slate-300 overflow-x-auto whitespace-pre-wrap font-mono leading-relaxed max-h-[65vh]">
              {candidate.raw_text || 'No raw document text available.'}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};

export default CandidateDetails;
