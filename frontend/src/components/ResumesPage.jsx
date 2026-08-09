import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { 
  Upload, 
  FileText, 
  Search, 
  Eye, 
  CheckCircle2, 
  AlertCircle,
  FolderArchive,
  ArrowUpDown,
  Filter,
  X,
  Sparkles,
  Users,
  Briefcase,
  MapPin,
  Clock,
  RefreshCw,
  Download
} from 'lucide-react';
import { resumeApi } from '../services/api';
import ExportModal from './ExportModal';

const ResumesPage = () => {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  
  // Upload states
  const [uploadFiles, setUploadFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const fileInputRef = useRef(null);

  // Table search & filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [expFilter, setExpFilter] = useState('all'); // 'all', 'entry' (0-2), 'mid' (3-5), 'senior' (5+)
  const [sortField, setSortField] = useState('id'); // 'id', 'experience', 'name'
  const [sortDirection, setSortDirection] = useState('desc'); // 'asc', 'desc'
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const fetchCandidates = async () => {
    setLoading(true);
    try {
      const res = await resumeApi.getAll();
      setCandidates(res.data);
    } catch (err) {
      console.error('Failed to retrieve candidates list:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCandidates();
  }, []);

  const handleFileSelect = (files) => {
    if (!files || files.length === 0) return;
    const newFiles = Array.from(files);
    setUploadFiles((prev) => [...prev, ...newFiles]);
  };

  const handleRemoveFile = (index) => {
    setUploadFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files);
    }
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (uploadFiles.length === 0) return;
    
    setUploading(true);
    setUploadResult(null);
    try {
      const res = await resumeApi.upload(uploadFiles);
      setUploadResult({
        status: 'success',
        message: res.data.message || 'Resumes successfully queued for extraction.',
        processed: res.data.processed_files || [],
        skipped: res.data.skipped_files || []
      });
      // Clear files
      setUploadFiles([]);
      if (fileInputRef.current) fileInputRef.current.value = '';
      // Refresh candidates list after background task start
      setTimeout(fetchCandidates, 2000);
    } catch (err) {
      console.error('Resume upload failed:', err);
      setUploadResult({
        status: 'error',
        message: err.response?.data?.detail || 'Resume upload failed. Please verify file formats (PDF, DOCX, ZIP).'
      });
    } finally {
      setUploading(false);
    }
  };

  // Helper to extract skills defensively from candidate
  const getCandidateSkills = (cand) => {
    if (Array.isArray(cand.skills)) {
      return cand.skills.map((s) => (typeof s === 'string' ? s : s.skill?.name || '')).filter(Boolean);
    }
    if (cand.categorized_skills) {
      const all = [];
      Object.values(cand.categorized_skills).forEach((arr) => {
        if (Array.isArray(arr)) all.push(...arr);
      });
      return all;
    }
    return [];
  };

  // Filter candidates
  const filteredCandidates = candidates.filter((cand) => {
    const q = searchQuery.toLowerCase().trim();
    const skills = getCandidateSkills(cand).join(' ').toLowerCase();
    const nameMatch = (cand.name || '').toLowerCase().includes(q);
    const emailMatch = (cand.email || '').toLowerCase().includes(q);
    const roleMatch = (cand.role || '').toLowerCase().includes(q);
    const locMatch = (cand.location || '').toLowerCase().includes(q);
    const skillMatch = skills.includes(q);

    const matchesSearch = !q || nameMatch || emailMatch || roleMatch || locMatch || skillMatch;

    // Experience filter
    const exp = cand.experience_years || 0;
    let matchesExp = true;
    if (expFilter === 'entry') matchesExp = exp <= 2;
    else if (expFilter === 'mid') matchesExp = exp > 2 && exp <= 5;
    else if (expFilter === 'senior') matchesExp = exp > 5;

    return matchesSearch && matchesExp;
  });

  // Sort candidates
  const sortedCandidates = [...filteredCandidates].sort((a, b) => {
    let result = 0;
    if (sortField === 'experience') {
      result = (a.experience_years || 0) - (b.experience_years || 0);
    } else if (sortField === 'name') {
      result = (a.name || '').localeCompare(b.name || '');
    } else {
      result = (a.id || 0) - (b.id || 0);
    }
    return sortDirection === 'asc' ? result : -result;
  });

  // Pagination calculations
  const totalItems = sortedCandidates.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentCandidates = sortedCandidates.slice(indexOfFirstItem, indexOfLastItem);

  const toggleSort = (field) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            Talent Pool Repository
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-primary-100 dark:bg-primary-950 text-primary-700 dark:text-primary-300 font-semibold font-mono">
              {candidates.length} Profiles
            </span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Automated resume parsing, structured entity indexing, and FAISS section embedding.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setIsExportModalOpen(true)}
            className="inline-flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-bold shadow-sm hover:shadow-md transition-all cursor-pointer"
          >
            <Download size={15} />
            <span>Export</span>
          </button>

          <button
            onClick={fetchCandidates}
            className="inline-flex items-center space-x-2 px-3.5 py-2 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold shadow-2xs transition-all self-start"
            title="Refresh repository data"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>Sync Data</span>
          </button>
        </div>
      </div>

      {/* Resume Ingestion Dropzone */}
      <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Upload size={16} className="text-primary-600 dark:text-primary-400" />
            Resume Ingestion Engine
          </h3>
          <span className="text-[11px] text-slate-400">PDF, DOCX, or ZIP</span>
        </div>

        <form onSubmit={handleUploadSubmit} className="space-y-4">
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current && fileInputRef.current.click()}
            className={`
              border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center transition-all cursor-pointer relative
              ${isDragging 
                ? 'border-primary-500 bg-primary-50/50 dark:bg-primary-950/20 scale-[0.99]' 
                : 'border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/20 hover:border-primary-400 hover:bg-slate-50'}
            `}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.docx,.zip"
              onChange={(e) => handleFileSelect(e.target.files)}
              className="hidden"
            />
            <div className="flex flex-col items-center justify-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-primary-50 dark:bg-slate-800 text-primary-600 dark:text-primary-400 flex items-center justify-center shadow-inner">
                <Upload size={24} />
              </div>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                Drag and drop resumes here, or <span className="text-primary-600 dark:text-primary-400 underline">browse files</span>
              </p>
              <p className="text-xs text-slate-400">
                Supports single files, multi-file batches, or compressed .ZIP archives.
              </p>
            </div>
          </div>

          {/* Selected File Chips */}
          {uploadFiles.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-400">
                <span>Selected {uploadFiles.length} file(s) for extraction:</span>
                <button
                  type="button"
                  onClick={() => setUploadFiles([])}
                  className="text-rose-500 hover:underline"
                >
                  Clear All
                </button>
              </div>
              <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto p-2 bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-slate-100 dark:border-slate-800">
                {uploadFiles.map((file, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center space-x-1.5 px-3 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-lg text-xs font-medium shadow-2xs"
                  >
                    <FileText size={12} className="text-primary-500" />
                    <span className="truncate max-w-[180px]">{file.name}</span>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); handleRemoveFile(idx); }}
                      className="text-slate-400 hover:text-rose-500"
                    >
                      <X size={13} />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Submit Action */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={uploadFiles.length === 0 || uploading}
              className="bg-primary-600 hover:bg-primary-700 disabled:bg-slate-300 dark:disabled:bg-slate-800 text-white font-bold px-5 py-2.5 rounded-xl text-xs sm:text-sm shadow-md hover:shadow-lg transition-all flex items-center space-x-2 cursor-pointer disabled:cursor-not-allowed"
            >
              {uploading ? (
                <>
                  <span className="animate-spin border-2 border-white border-t-transparent rounded-full h-4 w-4 mr-1" />
                  <span>Parsing & Indexing...</span>
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  <span>Extract & Index Resumes</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Upload Notification Banner */}
        {uploadResult && (
          <div
            className={`p-4 rounded-xl border text-xs sm:text-sm flex items-start space-x-3 transition-all ${
              uploadResult.status === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-500/30 text-emerald-900 dark:text-emerald-300'
                : 'bg-rose-50 dark:bg-rose-950/20 border-rose-500/30 text-rose-900 dark:text-rose-300'
            }`}
          >
            {uploadResult.status === 'success' ? (
              <CheckCircle2 size={20} className="text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle size={20} className="text-rose-600 dark:text-rose-400 flex-shrink-0 mt-0.5" />
            )}
            <div className="space-y-1">
              <p className="font-bold">{uploadResult.message}</p>
              {uploadResult.processed && uploadResult.processed.length > 0 && (
                <p className="text-xs opacity-90">
                  <strong>Queued:</strong> {uploadResult.processed.join(', ')}
                </p>
              )}
              {uploadResult.skipped && uploadResult.skipped.length > 0 && (
                <p className="text-xs text-amber-700 dark:text-amber-300 font-medium">
                  <strong>Skipped:</strong> {uploadResult.skipped.join(', ')}
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Talent Filter & Table Panel */}
      <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-2xs space-y-6">
        {/* Search & Filter Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Search by name, email, target role, technical skills, location..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:border-primary-500 transition-colors"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Experience Filter Pills */}
            <div className="inline-flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 text-xs font-semibold text-slate-600 dark:text-slate-300">
              {[
                { id: 'all', label: 'All Exp' },
                { id: 'entry', label: '0-2 Yrs' },
                { id: 'mid', label: '3-5 Yrs' },
                { id: 'senior', label: '5+ Yrs' }
              ].map((pill) => (
                <button
                  key={pill.id}
                  onClick={() => { setExpFilter(pill.id); setCurrentPage(1); }}
                  className={`px-3 py-1 rounded-lg transition-all ${
                    expFilter === pill.id
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs font-bold'
                      : 'hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {pill.label}
                </button>
              ))}
            </div>

            {/* Items Per Page */}
            <select
              value={itemsPerPage}
              onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
              className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-semibold px-3 py-2 rounded-xl focus:outline-none"
            >
              <option value={10}>10 / page</option>
              <option value={25}>25 / page</option>
              <option value={50}>50 / page</option>
            </select>
          </div>
        </div>

        {/* Talent Table */}
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="overflow-x-auto rounded-xl border border-slate-100 dark:border-slate-800">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-950/50 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
                    <th className="py-3 px-4 cursor-pointer select-none" onClick={() => toggleSort('id')}>
                      <div className="flex items-center space-x-1">
                        <span>ID</span>
                        <ArrowUpDown size={12} />
                      </div>
                    </th>
                    <th className="py-3 px-4 cursor-pointer select-none" onClick={() => toggleSort('name')}>
                      <div className="flex items-center space-x-1">
                        <span>Candidate</span>
                        <ArrowUpDown size={12} />
                      </div>
                    </th>
                    <th className="py-3 px-4">Role & Seniority</th>
                    <th className="py-3 px-4 cursor-pointer select-none" onClick={() => toggleSort('experience')}>
                      <div className="flex items-center space-x-1">
                        <span>Experience</span>
                        <ArrowUpDown size={12} />
                      </div>
                    </th>
                    <th className="py-3 px-4">Location</th>
                    <th className="py-3 px-4">Technical Skills</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {currentCandidates.map((cand) => {
                    const initials = (cand.name || 'C')
                      .split(' ')
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join('')
                      .toUpperCase();
                    const skills = getCandidateSkills(cand);
                    return (
                      <tr
                        key={cand.id}
                        className="text-slate-700 dark:text-slate-300 hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors"
                      >
                        <td className="py-3.5 px-4 font-mono text-slate-400 text-[11px]">
                          #{cand.id}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary-600/20 to-indigo-600/20 text-primary-600 dark:text-primary-400 font-bold flex items-center justify-center text-[11px] ring-1 ring-primary-500/30">
                              {initials}
                            </div>
                            <div>
                              <Link
                                to={`/resume/${cand.id}`}
                                className="font-bold text-slate-900 dark:text-white hover:text-primary-600 dark:hover:text-primary-400 block"
                              >
                                {cand.name}
                              </Link>
                              <span className="text-[11px] text-slate-400 font-normal truncate block max-w-[170px]">
                                {cand.email}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-medium text-slate-700 dark:text-slate-300">
                          {cand.role || <span className="text-slate-400 italic">Not extracted</span>}
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-slate-800 dark:text-slate-200">
                          {cand.experience_years} Yrs
                        </td>
                        <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400">
                          {cand.location || 'N/A'}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex flex-wrap gap-1 max-w-[240px]">
                            {skills.slice(0, 3).map((sk, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-bold"
                              >
                                {sk}
                              </span>
                            ))}
                            {skills.length > 3 && (
                              <span className="text-slate-400 text-[10px] font-bold self-center">
                                +{skills.length - 3}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <Link
                            to={`/resume/${cand.id}`}
                            className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-primary-50 dark:hover:bg-primary-950/40 text-slate-700 dark:text-slate-200 hover:text-primary-600 dark:hover:text-primary-400 border border-slate-200/80 dark:border-slate-700/80 text-[11px] font-bold transition-all"
                          >
                            <Eye size={13} />
                            <span>View</span>
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                  {currentCandidates.length === 0 && (
                    <tr>
                      <td colSpan="7" className="text-center py-12 text-slate-400 dark:text-slate-500">
                        No candidate profiles match your search criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
                <span className="text-xs text-slate-500">
                  Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, totalItems)} of {totalItems} candidates
                </span>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 disabled:opacity-40 text-xs font-semibold rounded-lg transition-all"
                  >
                    Previous
                  </button>
                  <span className="text-xs font-bold px-2 text-slate-700 dark:text-slate-300">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 disabled:opacity-40 text-xs font-semibold rounded-lg transition-all"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Export Modal Component */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        candidates={candidates}
      />
    </div>
  );
};

export default ResumesPage;
