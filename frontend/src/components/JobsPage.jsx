import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { 
  Plus, 
  Briefcase, 
  MapPin, 
  GraduationCap, 
  Eye, 
  Upload, 
  FileText, 
  Sparkles,
  CheckCircle2,
  AlertCircle,
  X,
  RefreshCw,
  Search
} from 'lucide-react';
import { jobApi } from '../services/api';

const JobsPage = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Job Upload / Creation fields
  const [uploadFile, setUploadFile] = useState(null);
  const [rawText, setRawText] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [uploadSuccess, setUploadSuccess] = useState(null);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  const fileInputRef = useRef(null);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const res = await jobApi.getAll();
      setJobs(res.data || []);
    } catch (err) {
      console.error('Failed to fetch job description list:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setUploadFile(e.target.files[0]);
    }
  };

  const handleJobSubmit = async (e) => {
    e.preventDefault();
    if (!uploadFile && !rawText.trim()) return;
    
    setUploading(true);
    setUploadError(null);
    setUploadSuccess(null);
    try {
      const res = await jobApi.upload(uploadFile, rawText);
      setUploadSuccess('Job position successfully created and parsed!');
      setUploadFile(null);
      setRawText('');
      if (fileInputRef.current) fileInputRef.current.value = '';
      setTimeout(() => {
        setShowUploadForm(false);
        setUploadSuccess(null);
      }, 1500);
      fetchJobs();
    } catch (err) {
      console.error('Failed to upload job description:', err);
      setUploadError(err.response?.data?.detail || 'Failed to upload and parse job description.');
    } finally {
      setUploading(false);
    }
  };

  const filteredJobs = jobs.filter((job) => {
    const q = searchFilter.toLowerCase().trim();
    if (!q) return true;
    const titleMatch = (job.title || '').toLowerCase().includes(q);
    const locMatch = (job.location || '').toLowerCase().includes(q);
    const skillsMatch = (job.skills || []).some((s) => s.toLowerCase().includes(q));
    return titleMatch || locMatch || skillsMatch;
  });

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            Job Requisitions & Openings
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-primary-100 dark:bg-primary-950 text-primary-700 dark:text-primary-300 font-semibold font-mono">
              {jobs.length} Positions
            </span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Define requirements, extract core competencies, and rank matching talent profiles.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowUploadForm(!showUploadForm)}
            className="flex items-center space-x-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold shadow-md hover:shadow-lg transition-all cursor-pointer"
          >
            {showUploadForm ? <X size={16} /> : <Plus size={16} />}
            <span>{showUploadForm ? 'Cancel Creation' : 'New Job Position'}</span>
          </button>
        </div>
      </div>

      {/* Creation Modal / Form */}
      {showUploadForm && (
        <div className="p-6 sm:p-8 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-xl space-y-6 animate-fade-in">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Briefcase size={18} className="text-primary-600 dark:text-primary-400" />
                Add New Job Requisition
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Upload a job specification document (PDF/DOCX) or paste raw job description text.
              </p>
            </div>
            <button
              onClick={() => setShowUploadForm(false)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
            >
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleJobSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Document Upload Option */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                  Option 1: Upload Job Specification (PDF / DOCX)
                </label>
                <div
                  onClick={() => fileInputRef.current && fileInputRef.current.click()}
                  className="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-6 text-center bg-slate-50/60 dark:bg-slate-950/20 hover:border-primary-400 transition-all cursor-pointer h-44 flex flex-col items-center justify-center space-y-2"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.docx"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-slate-800 text-primary-600 dark:text-primary-400 flex items-center justify-center">
                    <Upload size={20} />
                  </div>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    {uploadFile ? uploadFile.name : 'Select Job File'}
                  </p>
                  <p className="text-[11px] text-slate-400">PDF or DOCX format</p>
                </div>
              </div>

              {/* Raw Text Option */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                  Option 2: Paste Job Description Text
                </label>
                <textarea
                  placeholder="Paste responsibilities, required qualifications, technical stack (e.g. Senior Python Developer with 4+ years in FastAPI and Docker)..."
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  className="w-full h-44 p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs focus:outline-none focus:border-primary-500 font-medium resize-none leading-relaxed"
                />
              </div>

            </div>

            {uploadError && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-500/20 text-rose-800 dark:text-rose-300 text-xs rounded-xl font-bold flex items-center space-x-2">
                <AlertCircle size={16} />
                <span>{uploadError}</span>
              </div>
            )}

            {uploadSuccess && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 text-xs rounded-xl font-bold flex items-center space-x-2">
                <CheckCircle2 size={16} />
                <span>{uploadSuccess}</span>
              </div>
            )}

            <div className="flex justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => { setShowUploadForm(false); setUploadFile(null); setRawText(''); }}
                className="px-4 py-2.5 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={(!uploadFile && !rawText.trim()) || uploading}
                className="bg-primary-600 hover:bg-primary-700 disabled:bg-slate-300 dark:disabled:bg-slate-800 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 shadow-md"
              >
                {uploading ? (
                  <>
                    <span className="animate-spin border-2 border-white border-t-transparent rounded-full h-4 w-4 mr-1" />
                    <span>Extracting Entities...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={15} />
                    <span>Create & Parse Position</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Jobs Search Filter */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-3 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Filter jobs by title, skills, location..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:border-primary-500 shadow-2xs"
          />
        </div>
      </div>

      {/* Jobs Grid */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredJobs.map((job) => (
            <div
              key={job.id}
              className="p-6 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-2xs hover:shadow-lg dark:hover:shadow-primary-950/30 glow-card transition-all flex flex-col justify-between space-y-4 group"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-950/40 text-primary-600 dark:text-primary-400 flex items-center justify-center font-bold">
                    <Briefcase size={20} />
                  </div>
                  <span className="text-[10px] font-mono font-bold text-slate-400 px-2 py-0.5 rounded bg-slate-50 dark:bg-slate-800">
                    JOB #{job.id}
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors leading-snug">
                    {job.title}
                  </h3>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400 font-medium mt-1.5">
                    <span className="flex items-center space-x-1">
                      <MapPin size={12} />
                      <span>{job.location || 'Remote'}</span>
                    </span>
                    <span>•</span>
                    <span className="flex items-center space-x-1">
                      <GraduationCap size={12} />
                      <span>{job.experience || 'Any Exp'}</span>
                    </span>
                  </div>
                </div>

                {/* Skills tags */}
                <div className="flex flex-wrap gap-1 pt-1">
                  {(job.skills || []).slice(0, 4).map((skill, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-md text-[10px] font-bold"
                    >
                      {skill}
                    </span>
                  ))}
                  {(job.skills || []).length > 4 && (
                    <span className="text-[10px] font-bold text-slate-400 self-center">
                      +{job.skills.length - 4}
                    </span>
                  )}
                </div>
              </div>

              {/* Card Footer Link */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Active Matching
                </span>
                <Link
                  to={`/job/${job.id}`}
                  className="inline-flex items-center space-x-1 text-primary-600 dark:text-primary-400 hover:text-primary-700 text-xs font-bold"
                >
                  <span>Candidate Cockpit</span>
                  <Eye size={13} className="ml-0.5" />
                </Link>
              </div>
            </div>
          ))}

          {filteredJobs.length === 0 && (
            <div className="col-span-full text-center py-16 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-500 text-xs">
              No job positions match your filter. Click 'New Job Position' to create one.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default JobsPage;
