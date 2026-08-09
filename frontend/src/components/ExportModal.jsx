import React, { useState } from 'react';
import { 
  X, 
  FileSpreadsheet, 
  FileText, 
  Download, 
  Eye, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle,
  Table as TableIcon,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Layers,
  Check
} from 'lucide-react';
import { flattenCandidateRecord, generateExcelFile, generatePDFReport } from '../utils/exportHelper';

const ExportModal = ({ isOpen, onClose, candidates = [] }) => {
  const [activeView, setActiveView] = useState('excel_preview'); // 'excel_preview', 'pdf_preview'
  const [isGenerating, setIsGenerating] = useState(false);
  const [notification, setNotification] = useState(null);
  const [pdfPage, setPdfPage] = useState(1);

  if (!isOpen) return null;

  const flattenedData = candidates.map(flattenCandidateRecord);
  const headers = flattenedData.length > 0 ? Object.keys(flattenedData[0]) : [];

  const handleDownloadExcel = async () => {
    setIsGenerating(true);
    setNotification(null);
    try {
      await generateExcelFile(candidates);
      setNotification({
        type: 'success',
        message: `Successfully downloaded Microsoft Excel spreadsheet (${candidates.length} candidate records exported)!`
      });
    } catch (err) {
      console.error('Excel export error:', err);
      setNotification({
        type: 'error',
        message: 'Failed to generate Excel spreadsheet. Please try again.'
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadPDF = async () => {
    setIsGenerating(true);
    setNotification(null);
    try {
      await generatePDFReport(candidates);
      setNotification({
        type: 'success',
        message: `Successfully downloaded PDF report (${candidates.length} candidate records exported)!`
      });
    } catch (err) {
      console.error('PDF export error:', err);
      setNotification({
        type: 'error',
        message: 'Failed to generate PDF report. Please try again.'
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Helper to generate column excel lettering (A, B, C... Z, AA, AB...)
  const getColLetter = (index) => {
    let letter = '';
    while (index >= 0) {
      letter = String.fromCharCode((index % 26) + 65) + letter;
      index = Math.floor(index / 26) - 1;
    }
    return letter;
  };

  // Pagination for PDF preview cards (2 candidates per page preview)
  const itemsPerPagePdf = 2;
  const totalPdfPages = Math.max(1, Math.ceil(candidates.length / itemsPerPagePdf));
  const currentPdfCandidates = candidates.slice((pdfPage - 1) * itemsPerPagePdf, pdfPage * itemsPerPagePdf);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl w-full max-w-6xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-950/50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary-600 to-indigo-600 text-white flex items-center justify-center shadow-md">
              <Download size={20} />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Export Talent Repository
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-primary-100 dark:bg-primary-950 text-primary-700 dark:text-primary-300">
                  {candidates.length} Records
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Interactive preview and download of complete candidate records in Excel (.xlsx) and PDF formats.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-xl transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Action Controls & Tab Switcher Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900">
          {/* Tab Selection */}
          <div className="inline-flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 text-xs font-semibold">
            <button
              onClick={() => setActiveView('excel_preview')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg transition-all cursor-pointer ${
                activeView === 'excel_preview'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <FileSpreadsheet size={15} className="text-emerald-600 dark:text-emerald-400" />
              <span>Preview as Excel</span>
            </button>

            <button
              onClick={() => setActiveView('pdf_preview')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg transition-all cursor-pointer ${
                activeView === 'pdf_preview'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <FileText size={15} className="text-rose-600 dark:text-rose-400" />
              <span>Preview as PDF</span>
            </button>
          </div>

          {/* Download Buttons */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            <button
              onClick={handleDownloadExcel}
              disabled={isGenerating || candidates.length === 0}
              className="flex items-center space-x-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-sm hover:shadow-md cursor-pointer disabled:cursor-not-allowed"
            >
              {isGenerating ? (
                <span className="animate-spin border-2 border-white border-t-transparent rounded-full h-3.5 w-3.5" />
              ) : (
                <FileSpreadsheet size={15} />
              )}
              <span>Download Excel</span>
            </button>

            <button
              onClick={handleDownloadPDF}
              disabled={isGenerating || candidates.length === 0}
              className="flex items-center space-x-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-sm hover:shadow-md cursor-pointer disabled:cursor-not-allowed"
            >
              {isGenerating ? (
                <span className="animate-spin border-2 border-white border-t-transparent rounded-full h-3.5 w-3.5" />
              ) : (
                <FileText size={15} />
              )}
              <span>Download PDF</span>
            </button>
          </div>
        </div>

        {/* Notification Toast */}
        {notification && (
          <div className={`px-6 py-3 text-xs font-bold flex items-center justify-between border-b ${
            notification.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-500/20'
              : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border-rose-500/20'
          }`}>
            <div className="flex items-center space-x-2">
              {notification.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
              <span>{notification.message}</span>
            </div>
            <button onClick={() => setNotification(null)} className="text-slate-400 hover:text-slate-600">
              <X size={14} />
            </button>
          </div>
        )}

        {/* Modal Viewport Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-100 dark:bg-slate-950/60">
          {/* View 1: Excel Spreadsheet Interactive Grid */}
          {activeView === 'excel_preview' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium gap-2">
                <div className="flex items-center space-x-3">
                  <span className="font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                    <TableIcon size={14} className="text-emerald-500" />
                    Worksheet: Candidates
                  </span>
                  <span>•</span>
                  <span>{candidates.length} Rows</span>
                  <span>•</span>
                  <span>{headers.length} Columns</span>
                </div>
                <span className="text-[11px] font-mono text-slate-400">
                  Auto-formatted .XLSX OpenXML grid
                </span>
              </div>

              {/* Spreadsheet Grid Wrapper */}
              <div className="border border-slate-300 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 shadow-md overflow-x-auto max-h-[52vh]">
                <table className="w-full text-left text-xs border-collapse font-sans min-w-[1400px]">
                  <thead>
                    {/* Excel Column Letters Row (A, B, C...) */}
                    <tr className="bg-slate-100 dark:bg-slate-950 text-slate-400 font-mono text-[10px] text-center border-b border-slate-300 dark:border-slate-800">
                      <th className="py-1 px-2 border-r border-slate-300 dark:border-slate-800 bg-slate-200 dark:bg-slate-900 w-12 sticky left-0 z-20"></th>
                      {headers.map((_, idx) => (
                        <th key={idx} className="py-1 px-3 border-r border-slate-200 dark:border-slate-800 font-normal">
                          {getColLetter(idx)}
                        </th>
                      ))}
                    </tr>

                    {/* Column Headers Row (1) */}
                    <tr className="bg-slate-200/80 dark:bg-slate-850 text-slate-800 dark:text-slate-100 font-bold border-b-2 border-slate-300 dark:border-slate-700 sticky top-0 z-10">
                      <th className="py-2.5 px-2 border-r border-slate-300 dark:border-slate-800 text-center font-mono text-[10px] text-slate-500 bg-slate-200 dark:bg-slate-900 sticky left-0 z-20">
                        1
                      </th>
                      {headers.map((h, idx) => (
                        <th key={idx} className="py-2.5 px-3 border-r border-slate-200 dark:border-slate-800 whitespace-nowrap bg-emerald-500/10 text-emerald-900 dark:text-emerald-300">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-medium">
                    {flattenedData.map((row, rIdx) => (
                      <tr
                        key={rIdx}
                        className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        {/* Excel Row Index Header */}
                        <td className="py-2 px-2 border-r border-slate-300 dark:border-slate-800 text-center font-mono text-[10px] text-slate-400 bg-slate-100 dark:bg-slate-950/80 sticky left-0 z-10">
                          {rIdx + 2}
                        </td>

                        {headers.map((h, cIdx) => {
                          const val = row[h];
                          return (
                            <td
                              key={cIdx}
                              className="py-2 px-3 border-r border-slate-100 dark:border-slate-800/60 max-w-xs truncate text-slate-700 dark:text-slate-300"
                              title={String(val || '')}
                            >
                              {String(val ?? '')}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                    {flattenedData.length === 0 && (
                      <tr>
                        <td colSpan={headers.length + 1} className="text-center py-12 text-slate-400">
                          No candidate records available to export.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* View 2: PDF Document Page Preview */}
          {activeView === 'pdf_preview' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span className="font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                  <FileText size={14} className="text-rose-500" />
                  PDF Multi-Page Report Layout
                </span>

                {/* PDF Page Navigation */}
                {totalPdfPages > 1 && (
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setPdfPage((p) => Math.max(p - 1, 1))}
                      disabled={pdfPage === 1}
                      className="p-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded disabled:opacity-40"
                    >
                      <ChevronLeft size={14} />
                    </button>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      Page {pdfPage} of {totalPdfPages}
                    </span>
                    <button
                      onClick={() => setPdfPage((p) => Math.min(p + 1, totalPdfPages))}
                      disabled={pdfPage === totalPdfPages}
                      className="p-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded disabled:opacity-40"
                    >
                      <ChevronRight size={14} />
                    </button>
                  </div>
                )}
              </div>

              {/* PDF Document Sheet Canvas Simulation */}
              <div className="bg-white text-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl shadow-xl p-8 max-w-4xl mx-auto space-y-6 min-h-[500px]">
                {/* PDF Banner Header */}
                <div className="bg-slate-900 text-white p-4 rounded-xl flex items-center justify-between">
                  <div>
                    <h3 className="font-extrabold text-base tracking-tight flex items-center gap-2">
                      <Sparkles size={16} className="text-sky-400" />
                      RecruitAI — Talent Repository Export Report
                    </h3>
                    <p className="text-[10px] text-slate-300 mt-0.5">
                      Confidential Candidate Records & AI Evaluation Metrics
                    </p>
                  </div>
                  <div className="text-right text-[10px] text-slate-400">
                    <div>Generated: {new Date().toLocaleString()}</div>
                    <div>Total Records: {candidates.length}</div>
                  </div>
                </div>

                {/* PDF Document Body Cards */}
                <div className="space-y-4">
                  {currentPdfCandidates.map((cand) => {
                    const flattened = flattenCandidateRecord(cand);
                    return (
                      <div
                        key={cand.id}
                        className="p-4 border border-slate-200 rounded-xl space-y-3 bg-slate-50/50"
                      >
                        <div className="flex items-start justify-between border-b border-slate-200 pb-2">
                          <div>
                            <span className="text-[10px] font-mono text-slate-400 font-bold">CAND_{cand.id}</span>
                            <h4 className="font-bold text-sm text-slate-900">{flattened['Full Name']}</h4>
                            <p className="text-xs text-sky-600 font-semibold">{flattened['Current Role']}</p>
                          </div>
                          <div className="text-right text-xs">
                            <span className="font-extrabold text-slate-800">{flattened['Experience (Years)']} Yrs Exp</span>
                            <span className="block text-[10px] text-slate-500">{flattened['Location']}</span>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-[11px]">
                          <div>
                            <span className="text-slate-400 font-bold uppercase text-[9px] block">Contact</span>
                            <span className="text-slate-700 block font-medium">{flattened['Email Address']}</span>
                            <span className="text-slate-700 block font-medium">{flattened['Phone Number']}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 font-bold uppercase text-[9px] block">Technical Stack</span>
                            <span className="text-slate-800 font-semibold leading-relaxed block">
                              {flattened['Technical Skills']}
                            </span>
                          </div>
                        </div>

                        {flattened['Education Details'] && (
                          <div className="text-[11px]">
                            <span className="text-slate-400 font-bold uppercase text-[9px] block">Education</span>
                            <span className="text-slate-700 font-medium">{flattened['Education Details']}</span>
                          </div>
                        )}

                        <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[10px]">
                          <span className="font-bold text-slate-600">
                            Recruiter Status: <span className="text-emerald-600">{flattened['Recruiter Action Status']}</span>
                          </span>
                          <span className="font-bold text-slate-600">
                            AI Match Score: <span className="text-sky-600">{flattened['AI Match Score']}</span>
                          </span>
                        </div>
                      </div>
                    );
                  })}
                  {candidates.length === 0 && (
                    <div className="text-center py-12 text-slate-400 text-xs">
                      No candidate records to render in PDF report.
                    </div>
                  )}
                </div>

                {/* PDF Page Footer */}
                <div className="pt-4 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                  <span>Page {pdfPage} of {totalPdfPages} • RecruitAI Platform</span>
                  <span>Confidential Talent Report</span>
                </div>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default ExportModal;
