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
  Search,
  Building2,
  Calendar,
  Phone,
  Mail,
  User,
  ShieldCheck,
  Award,
  DollarSign,
  Clock,
  Globe,
  Trash2,
  FileSearch,
  Check,
  Pencil
} from 'lucide-react';
import { jobApi } from '../services/api';

const JobsPage = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Job Creation Modal State
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [creationMode, setCreationMode] = useState('demand_letter'); // 'demand_letter', 'standard_jd'
  
  // Standard Upload State
  const [uploadFile, setUploadFile] = useState(null);
  const [rawText, setRawText] = useState('');
  const [standardInterviewDate, setStandardInterviewDate] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [uploadSuccess, setUploadSuccess] = useState(null);

  // Edit Job State
  const [editingJob, setEditingJob] = useState(null);
  const [editFormData, setEditFormData] = useState({
    title: '',
    location: '',
    experience: '',
    education: '',
    interview_date: '',
    skills: '',
    responsibilities: ''
  });
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState(null);

  // Demand Letter AI Extraction State
  const [dlFile, setDlFile] = useState(null);
  const [extracting, setExtracting] = useState(false);
  const [extractionSuccess, setExtractionSuccess] = useState(false);
  const [extractionSnippet, setExtractionSnippet] = useState('');

  // Extracted Header Requisition Fields
  const [headerData, setHeaderData] = useState({
    company_name: '',
    client_name: '',
    country: '',
    demand_letter_number: '',
    working_hours: '',
    contract_years: '',
    received_date: '',
    expiry_date: '',
    interview_date: '',
    interview_type: '',
    interview_location: '',
    received_from: '',
    contact_person: '',
    contact_phone: '',
    contact_email: '',
    accommodation_provided: '',
    transport_provided: '',
    food_provided: ''
  });

  // Extracted Positions Cards
  const [positions, setPositions] = useState([]);
  const [headerConfidence, setHeaderConfidence] = useState({});

  const [searchFilter, setSearchFilter] = useState('');
  const fileInputRef = useRef(null);
  const dlFileInputRef = useRef(null);

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

  // Handle Standard File Selection
  const handleStandardFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setUploadFile(e.target.files[0]);
    }
  };

  // Handle Demand Letter File Selection
  const handleDlFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setDlFile(e.target.files[0]);
    }
  };

  // Trigger AI Demand Letter Extraction
  const handleExtractDemandLetter = async () => {
    if (!dlFile) return;
    setExtracting(true);
    setUploadError(null);
    setExtractionSuccess(false);

    try {
      const res = await jobApi.extractVacancy(dlFile);
      const data = res.data?.data || {};

      setHeaderData({
        company_name: data.company_name || '',
        client_name: data.client_name || '',
        country: data.country || '',
        demand_letter_number: data.demand_letter_number || '',
        working_hours: data.working_hours || '',
        contract_years: data.contract_years || '',
        received_date: data.received_date || '',
        expiry_date: data.expiry_date || '',
        interview_date: data.interview_date || '',
        interview_type: data.interview_type || '',
        interview_location: data.interview_location || '',
        received_from: data.received_from || '',
        contact_person: data.contact_person || '',
        contact_phone: data.contact_phone || '',
        contact_email: data.contact_email || '',
        accommodation_provided: data.accommodation_provided || '',
        transport_provided: data.transport_provided || '',
        food_provided: data.food_provided || ''
      });

      setHeaderConfidence(data.confidence || {});

      // Format positions array
      if (Array.isArray(data.positions) && data.positions.length > 0) {
        setPositions(data.positions.map((p) => ({
          title: p.title || 'Position',
          quantity: p.quantity || 1,
          salary: p.salary || '',
          currency: p.currency || 'USD',
          experience_required: p.experience_required || '',
          education_required: p.education_required || '',
          interview_date: p.interview_date || data.interview_date || '',
          skills_required: Array.isArray(p.skills_required) ? p.skills_required.join(', ') : '',
          job_description: p.job_description || '',
          benefits: p.benefits || '',
          notes: p.notes || '',
          confidence: p.confidence || {}
        })));
      } else {
        // Fallback default position card
        setPositions([{
          title: 'Required Role',
          quantity: 1,
          salary: '',
          currency: 'USD',
          experience_required: '',
          education_required: '',
          interview_date: data.interview_date || '',
          skills_required: '',
          job_description: '',
          benefits: '',
          notes: '',
          confidence: {}
        }]);
      }

      setExtractionSuccess(true);
      setExtractionSnippet(res.data?.extracted_text_snippet || '');
    } catch (err) {
      console.error('Demand Letter Extraction error:', err);
      setUploadError(err.response?.data?.detail || 'Failed to extract vacancy document. Please check file formatting.');
    } finally {
      setExtracting(false);
    }
  };

  // Handle Position Card Changes
  const handlePositionChange = (idx, field, val) => {
    setPositions((prev) => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], [field]: val };
      return updated;
    });
  };

  // Add New Position Card
  const addPositionCard = () => {
    setPositions((prev) => [
      ...prev,
      {
        title: `Position #${prev.length + 1}`,
        quantity: 1,
        salary: '',
        currency: 'USD',
        experience_required: '',
        education_required: '',
        interview_date: headerData.interview_date || '',
        skills_required: '',
        job_description: '',
        benefits: '',
        notes: '',
        confidence: {}
      }
    ]);
  };

  // Remove Position Card
  const removePositionCard = (idx) => {
    setPositions((prev) => prev.filter((_, i) => i !== idx));
  };

  // Save Extracted Demand Letter Requisitions
  const handleSaveVacancyRequisition = async () => {
    if (positions.length === 0) return;
    setUploading(true);
    setUploadError(null);
    setUploadSuccess(null);

    try {
      // Save each extracted position as a job requisition in system
      for (const pos of positions) {
        const interviewDateToUse = pos.interview_date || headerData.interview_date || null;
        const skillsArray = pos.skills_required ? pos.skills_required.split(',').map(s => s.trim()).filter(Boolean) : [];
        const respArray = pos.job_description ? pos.job_description.split('\n').map(r => r.trim()).filter(Boolean) : [];

        await jobApi.create({
          title: pos.title,
          location: headerData.country || null,
          experience: pos.experience_required || null,
          education: pos.education_required || null,
          interview_date: interviewDateToUse,
          skills: skillsArray,
          responsibilities: respArray
        });
      }

      setUploadSuccess(`Successfully saved ${positions.length} vacancy position(s) to system!`);
      setTimeout(() => {
        setShowUploadForm(false);
        setUploadSuccess(null);
        setDlFile(null);
        setExtractionSuccess(false);
      }, 1500);
      fetchJobs();
    } catch (err) {
      console.error('Failed saving vacancy requisition:', err);
      setUploadError('Failed to save extracted vacancy positions.');
    } finally {
      setUploading(false);
    }
  };

  // Standard Job Upload Submit
  const handleStandardJobSubmit = async (e) => {
    e.preventDefault();
    if (!uploadFile && !rawText.trim()) return;

    setUploading(true);
    setUploadError(null);
    setUploadSuccess(null);

    try {
      await jobApi.upload(uploadFile, rawText, standardInterviewDate || null);
      setUploadSuccess('Job position successfully created and parsed!');
      setUploadFile(null);
      setRawText('');
      setStandardInterviewDate('');
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

  // Edit Job Click & Save Handlers
  const handleEditJobClick = (job) => {
    setEditingJob(job);
    setEditFormData({
      title: job.title || '',
      location: job.location || '',
      experience: job.experience || '',
      education: job.education || '',
      interview_date: job.interview_date || '',
      skills: Array.isArray(job.skills) ? job.skills.join(', ') : '',
      responsibilities: Array.isArray(job.responsibilities) ? job.responsibilities.join('\n') : ''
    });
    setEditError(null);
  };

  const handleSaveEditedJob = async (e) => {
    e.preventDefault();
    if (!editingJob) return;
    setSavingEdit(true);
    setEditError(null);

    try {
      const skillsArray = editFormData.skills ? editFormData.skills.split(',').map((s) => s.trim()).filter(Boolean) : [];
      const respArray = editFormData.responsibilities ? editFormData.responsibilities.split('\n').map((r) => r.trim()).filter(Boolean) : [];

      await jobApi.update(editingJob.id, {
        title: editFormData.title,
        location: editFormData.location,
        experience: editFormData.experience,
        education: editFormData.education,
        interview_date: editFormData.interview_date || null,
        skills: skillsArray,
        responsibilities: respArray
      });

      setEditingJob(null);
      fetchJobs();
    } catch (err) {
      console.error('Failed to update job details:', err);
      setEditError(err.response?.data?.detail || 'Failed to update vacancy details.');
    } finally {
      setSavingEdit(false);
    }
  };

  // Filter Jobs list
  const filteredJobs = jobs.filter((job) => {
    const q = searchFilter.toLowerCase().trim();
    if (!q) return true;
    const titleMatch = (job.title || '').toLowerCase().includes(q);
    const locMatch = (job.location || '').toLowerCase().includes(q);
    const skillsMatch = (job.skills || []).some((s) => s.toLowerCase().includes(q));
    return titleMatch || locMatch || skillsMatch;
  });

  // Confidence Pill Badge Component
  const ConfidenceBadge = ({ val }) => {
    if (val === undefined || val === null) return null;
    const score = typeof val === 'number' ? val : 0.8;
    const pct = Math.round(score <= 1 ? score * 100 : score);

    let colorClass = 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-500/20';
    if (pct < 60) colorClass = 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border-rose-500/20';
    else if (pct < 85) colorClass = 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-500/20';

    return (
      <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border ml-1.5 ${colorClass}`}>
        {pct}% Confidence
      </span>
    );
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            Job Requisitions & Openings
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-primary-100 dark:bg-primary-950 text-primary-700 dark:text-primary-300 font-semibold font-mono">
              {jobs.length} Openings
            </span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            AI Demand Letter extraction, position card auto-population, and candidate relevance ranking.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowUploadForm(!showUploadForm)}
            className="flex items-center space-x-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold shadow-md hover:shadow-lg transition-all cursor-pointer"
          >
            {showUploadForm ? <X size={16} /> : <Plus size={16} />}
            <span>{showUploadForm ? 'Cancel Requisition' : 'Add Vacancy / Position'}</span>
          </button>
        </div>
      </div>

      {/* Requisition Creation Modal / Form */}
      {showUploadForm && (
        <div className="p-6 sm:p-8 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-xl space-y-6 animate-fade-in">
          
          {/* Header & Creation Mode Tabs */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Briefcase size={18} className="text-primary-600 dark:text-primary-400" />
                Add New Vacancy Requisition
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Extract Demand Letters via AI OCR or paste a standard job description.
              </p>
            </div>

            {/* Mode Switcher */}
            <div className="inline-flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setCreationMode('demand_letter')}
                className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg transition-all ${
                  creationMode === 'demand_letter'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs font-bold'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Sparkles size={14} className="text-primary-500" />
                <span>AI Demand Letter (PDF / Image)</span>
              </button>

              <button
                type="button"
                onClick={() => setCreationMode('standard_jd')}
                className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg transition-all ${
                  creationMode === 'standard_jd'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs font-bold'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <FileText size={14} />
                <span>Standard JD (Text / PDF)</span>
              </button>
            </div>
          </div>

          {/* MODE 1: AI DEMAND LETTER EXTRACTION */}
          {creationMode === 'demand_letter' && (
            <div className="space-y-6">
              
              {/* Document Dropzone */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                  Select Demand Letter Document (PDF, JPG, JPEG, PNG)
                </label>
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <div
                    onClick={() => dlFileInputRef.current && dlFileInputRef.current.click()}
                    className="flex-1 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-5 text-center bg-slate-50/60 dark:bg-slate-950/20 hover:border-primary-400 transition-all cursor-pointer flex flex-col items-center justify-center space-y-1.5"
                  >
                    <input
                      ref={dlFileInputRef}
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={handleDlFileChange}
                      className="hidden"
                    />
                    <div className="w-9 h-9 rounded-xl bg-primary-50 dark:bg-slate-800 text-primary-600 dark:text-primary-400 flex items-center justify-center">
                      <Upload size={18} />
                    </div>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {dlFile ? dlFile.name : 'Select or Drop Demand Letter File'}
                    </p>
                    <p className="text-[11px] text-slate-400">Supported: PDF, JPG, JPEG, PNG</p>
                  </div>

                  <button
                    type="button"
                    onClick={handleExtractDemandLetter}
                    disabled={!dlFile || extracting}
                    className="w-full sm:w-auto px-6 py-4 bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-700 hover:to-indigo-700 text-white font-bold rounded-2xl text-xs sm:text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
                  >
                    {extracting ? (
                      <>
                        <span className="animate-spin border-2 border-white border-t-transparent rounded-full h-4 w-4" />
                        <span>Running AI OCR & Extraction...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles size={16} />
                        <span>Extract with AI</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Extraction Success Banner */}
              {extractionSuccess && (
                <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 text-xs rounded-xl font-bold flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 size={18} className="text-emerald-500" />
                    <span>Demand Letter successfully extracted! {positions.length} position card(s) auto-populated below.</span>
                  </div>
                  <span className="text-[10px] bg-emerald-200 dark:bg-emerald-900 px-2 py-0.5 rounded font-mono">
                    AI Auto-Filled
                  </span>
                </div>
              )}

              {/* Extracted Header Requisition Fields Form */}
              {(extractionSuccess || dlFile) && (
                <div className="space-y-6 pt-2">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                    <Building2 size={14} className="text-primary-500" />
                    Header Requisition Details
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                    <div>
                      <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        Company Name
                        <ConfidenceBadge val={headerConfidence.company_name} />
                      </label>
                      <input
                        type="text"
                        value={headerData.company_name}
                        onChange={(e) => setHeaderData({ ...headerData, company_name: e.target.value })}
                        placeholder="e.g. Al-Futtaim Engineering"
                        className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-medium"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        Client / End Client
                      </label>
                      <input
                        type="text"
                        value={headerData.client_name}
                        onChange={(e) => setHeaderData({ ...headerData, client_name: e.target.value })}
                        placeholder="e.g. ADNOC Refinery Project"
                        className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-medium"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        Country
                      </label>
                      <input
                        type="text"
                        value={headerData.country}
                        onChange={(e) => setHeaderData({ ...headerData, country: e.target.value })}
                        placeholder="e.g. UAE / Saudi Arabia"
                        className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-medium"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        Demand Letter No.
                        <ConfidenceBadge val={headerConfidence.demand_letter_number} />
                      </label>
                      <input
                        type="text"
                        value={headerData.demand_letter_number}
                        onChange={(e) => setHeaderData({ ...headerData, demand_letter_number: e.target.value })}
                        placeholder="e.g. DL-2026-904"
                        className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-medium"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        Interview Date
                        <ConfidenceBadge val={headerConfidence.interview_date} />
                      </label>
                      <input
                        type="date"
                        value={headerData.interview_date}
                        onChange={(e) => setHeaderData({ ...headerData, interview_date: e.target.value })}
                        className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-medium"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        Working Hours
                      </label>
                      <input
                        type="text"
                        value={headerData.working_hours}
                        onChange={(e) => setHeaderData({ ...headerData, working_hours: e.target.value })}
                        placeholder="e.g. 8 Hours / Day"
                        className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-medium"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        Contract Period
                      </label>
                      <input
                        type="text"
                        value={headerData.contract_years}
                        onChange={(e) => setHeaderData({ ...headerData, contract_years: e.target.value })}
                        placeholder="e.g. 2 Years"
                        className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-medium"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        Contact Person
                      </label>
                      <input
                        type="text"
                        value={headerData.contact_person}
                        onChange={(e) => setHeaderData({ ...headerData, contact_person: e.target.value })}
                        placeholder="HR / Contact Manager"
                        className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-medium"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        Contact Phone
                      </label>
                      <input
                        type="text"
                        value={headerData.contact_phone}
                        onChange={(e) => setHeaderData({ ...headerData, contact_phone: e.target.value })}
                        placeholder="+971 50 123 4567"
                        className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-medium"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        Contact Email
                      </label>
                      <input
                        type="text"
                        value={headerData.contact_email}
                        onChange={(e) => setHeaderData({ ...headerData, contact_email: e.target.value })}
                        placeholder="recruitment@company.com"
                        className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-medium"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        Accommodation
                      </label>
                      <input
                        type="text"
                        value={headerData.accommodation_provided}
                        onChange={(e) => setHeaderData({ ...headerData, accommodation_provided: e.target.value })}
                        placeholder="Provided / Allowance"
                        className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-medium"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        Transport
                      </label>
                      <input
                        type="text"
                        value={headerData.transport_provided}
                        onChange={(e) => setHeaderData({ ...headerData, transport_provided: e.target.value })}
                        placeholder="Provided by company"
                        className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-medium"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        Food Benefits
                      </label>
                      <input
                        type="text"
                        value={headerData.food_provided}
                        onChange={(e) => setHeaderData({ ...headerData, food_provided: e.target.value })}
                        placeholder="Duty meals / Allowance"
                        className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-medium"
                      />
                    </div>
                  </div>

                  {/* Extracted Position Cards Section */}
                  <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                        <Briefcase size={14} className="text-indigo-500" />
                        Extracted Positions / Roles ({positions.length})
                      </h4>

                      <button
                        type="button"
                        onClick={addPositionCard}
                        className="flex items-center space-x-1 px-3 py-1 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 text-xs font-bold rounded-lg border border-indigo-500/20 hover:bg-indigo-100 cursor-pointer"
                      >
                        <Plus size={14} />
                        <span>Add Position Card</span>
                      </button>
                    </div>

                    <div className="space-y-4">
                      {positions.map((pos, idx) => (
                        <div
                          key={idx}
                          className="p-5 border border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/70 dark:bg-slate-950/40 space-y-4 relative"
                        >
                          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                            <span className="text-xs font-bold text-primary-600 dark:text-primary-400 flex items-center gap-1.5">
                              <Sparkles size={14} />
                              Position Card #{idx + 1}
                              <ConfidenceBadge val={pos.confidence?.title} />
                            </span>
                            {positions.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removePositionCard(idx)}
                                className="text-slate-400 hover:text-rose-600 p-1"
                              >
                                <Trash2 size={16} />
                              </button>
                            )}
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                            <div>
                              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                                Position Title *
                              </label>
                              <input
                                type="text"
                                value={pos.title}
                                onChange={(e) => handlePositionChange(idx, 'title', e.target.value)}
                                placeholder="e.g. Quality Engineer"
                                className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-bold"
                              />
                            </div>

                            <div>
                              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                                Vacancy Quantity
                              </label>
                              <input
                                type="number"
                                value={pos.quantity}
                                onChange={(e) => handlePositionChange(idx, 'quantity', parseInt(e.target.value) || 1)}
                                className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-medium"
                              />
                            </div>

                            <div>
                              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                                Salary & Currency
                              </label>
                              <div className="flex space-x-2">
                                <input
                                  type="text"
                                  value={pos.salary}
                                  onChange={(e) => handlePositionChange(idx, 'salary', e.target.value)}
                                  placeholder="2500"
                                  className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-medium"
                                />
                                <input
                                  type="text"
                                  value={pos.currency}
                                  onChange={(e) => handlePositionChange(idx, 'currency', e.target.value)}
                                  placeholder="AED"
                                  className="w-20 p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-medium uppercase text-center"
                                />
                              </div>
                            </div>

                            <div>
                              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                                Required Experience
                              </label>
                              <input
                                type="text"
                                value={pos.experience_required}
                                onChange={(e) => handlePositionChange(idx, 'experience_required', e.target.value)}
                                placeholder="e.g. 3-5 Years"
                                className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-medium"
                              />
                            </div>

                            <div>
                              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                                Required Education
                              </label>
                              <input
                                type="text"
                                value={pos.education_required}
                                onChange={(e) => handlePositionChange(idx, 'education_required', e.target.value)}
                                placeholder="e.g. Diploma / B.E."
                                className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-medium"
                              />
                            </div>

                            <div>
                              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                                Interview Date
                              </label>
                              <input
                                type="date"
                                value={pos.interview_date || headerData.interview_date || ''}
                                onChange={(e) => handlePositionChange(idx, 'interview_date', e.target.value)}
                                className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-medium"
                              />
                            </div>

                            <div>
                              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                                Core Required Skills
                              </label>
                              <input
                                type="text"
                                value={pos.skills_required}
                                onChange={(e) => handlePositionChange(idx, 'skills_required', e.target.value)}
                                placeholder="Piping Inspection, NDT Level II, ISO 9001"
                                className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-medium"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1 text-xs">
                              Job Description & Key Responsibilities
                            </label>
                            <textarea
                              value={pos.job_description}
                              onChange={(e) => handlePositionChange(idx, 'job_description', e.target.value)}
                              placeholder="Responsibilities, site safety guidelines, machinery operations..."
                              className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium h-20 resize-none"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Save Positions Requisition Button */}
                  <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => setShowUploadForm(false)}
                      className="px-4 py-2.5 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold rounded-xl"
                    >
                      Cancel
                    </button>

                    <button
                      type="button"
                      onClick={handleSaveVacancyRequisition}
                      disabled={uploading || positions.length === 0}
                      className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-6 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 shadow-md cursor-pointer"
                    >
                      {uploading ? (
                        <>
                          <span className="animate-spin border-2 border-white border-t-transparent rounded-full h-4 w-4 mr-1" />
                          <span>Saving Vacancies...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 size={16} />
                          <span>Save {positions.length} Vacancy Position(s)</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* MODE 2: STANDARD JD TEXT/PDF UPLOAD */}
          {creationMode === 'standard_jd' && (
            <form onSubmit={handleStandardJobSubmit} className="space-y-6">
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
                      onChange={handleStandardFileChange}
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

              {/* Interview Date Input */}
              <div className="space-y-1 max-w-xs">
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                  Interview Date (Optional)
                </label>
                <input
                  type="date"
                  value={standardInterviewDate}
                  onChange={(e) => setStandardInterviewDate(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium"
                />
              </div>

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
          )}

          {uploadError && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-500/20 text-rose-800 dark:text-rose-300 text-xs rounded-xl font-bold flex items-center space-x-2">
              <AlertCircle size={16} />
              <span>{uploadError}</span>
            </div>
          )}

          {uploadSuccess && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-500/20 text-emerald-500/20 text-emerald-800 dark:text-emerald-300 text-xs rounded-xl font-bold flex items-center space-x-2">
              <CheckCircle2 size={16} />
              <span>{uploadSuccess}</span>
            </div>
          )}
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
              className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between space-y-4 group"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-slate-800 text-primary-600 dark:text-primary-400 flex items-center justify-center font-bold">
                    <Briefcase size={20} />
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => handleEditJobClick(job)}
                      className="p-1.5 text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                      title="Edit Vacancy Position"
                    >
                      <Pencil size={15} />
                    </button>
                    <span className="text-[10px] font-mono text-slate-400 font-bold">
                      REQS_{job.id}
                    </span>
                  </div>
                </div>

                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-primary-600 transition-colors">
                    {job.title}
                  </h3>
                  <div className="flex flex-wrap items-center gap-y-1 gap-x-2 text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
                    <span className="flex items-center gap-1">
                      <MapPin size={12} />
                      {job.location || 'Not specified'}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <GraduationCap size={12} />
                      {job.experience || 'Not specified'}
                    </span>
                    {job.interview_date && (
                      <>
                        <span>•</span>
                        <span className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded-md border border-indigo-500/20">
                          <Calendar size={12} />
                          <span>Interview: {job.interview_date}</span>
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Skills tags */}
                {Array.isArray(job.skills) && job.skills.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {job.skills.slice(0, 5).map((skill, sIdx) => (
                      <span
                        key={sIdx}
                        className="text-[11px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium"
                      >
                        {skill}
                      </span>
                    ))}
                    {job.skills.length > 5 && (
                      <span className="text-[10px] text-slate-400 font-bold self-center">
                        +{job.skills.length - 5}
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-400 text-[11px]">
                  Posted {job.upload_date ? new Date(job.upload_date).toLocaleDateString() : 'Recent'}
                </span>

                <div className="flex items-center space-x-3">
                  <button
                    type="button"
                    onClick={() => handleEditJobClick(job)}
                    className="text-slate-500 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 font-semibold"
                  >
                    Edit
                  </button>
                  <Link
                    to={`/job/${job.id}`}
                    className="inline-flex items-center space-x-1 text-primary-600 dark:text-primary-400 hover:underline font-bold"
                  >
                    <span>Rank Candidates</span>
                    <Eye size={14} />
                  </Link>
                </div>
              </div>
            </div>
          ))}

          {filteredJobs.length === 0 && (
            <div className="col-span-full py-16 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
              <Briefcase size={36} className="mx-auto text-slate-300 dark:text-slate-700 mb-3" />
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                No job requisitions found matching your filter.
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Click "Add Vacancy / Position" to upload a Demand Letter or create a new job opening.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Edit Vacancy Modal */}
      {editingJob && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Pencil size={18} className="text-primary-600 dark:text-primary-400" />
                Edit Vacancy Position #{editingJob.id}
              </h3>
              <button
                type="button"
                onClick={() => setEditingJob(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveEditedJob} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Job Position Title *
                </label>
                <input
                  type="text"
                  required
                  value={editFormData.title}
                  onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-bold"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Required Core Skills (comma-separated)
                </label>
                <input
                  type="text"
                  value={editFormData.skills}
                  onChange={(e) => setEditFormData({ ...editFormData, skills: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-medium"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Responsibilities (one per line)
                </label>
                <textarea
                  value={editFormData.responsibilities}
                  onChange={(e) => setEditFormData({ ...editFormData, responsibilities: e.target.value })}
                  rows={3}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-medium resize-none"
                />
              </div>

              {editError && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/20 text-rose-800 dark:text-rose-300 text-xs font-bold rounded-xl border border-rose-500/20 flex items-center space-x-2">
                  <AlertCircle size={16} />
                  <span>{editError}</span>
                </div>
              )}

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingJob(null)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-800 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="bg-primary-600 hover:bg-primary-700 disabled:bg-slate-400 text-white px-4 py-2 text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer"
                >
                  {savingEdit ? 'Saving Changes...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobsPage;
