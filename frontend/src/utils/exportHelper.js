/**
 * Utility functions for flattening and formatting nested Candidate records
 * for Excel spreadsheet and PDF report export.
 */

export const flattenCandidateRecord = (cand) => {
  if (!cand) return {};

  const pi = cand.personal_information || {};
  const prof = cand.profession || {};
  const catSkills = cand.categorized_skills || {};
  const confidence = cand.confidence || {};

  // Extract skills
  const skillsList = Array.isArray(cand.skills)
    ? cand.skills.map((s) => (typeof s === 'string' ? s : s.skill?.name || '')).filter(Boolean)
    : [];

  const techSkills = Array.isArray(catSkills.technical) ? catSkills.technical : [];
  const softSkills = Array.isArray(catSkills.soft) ? catSkills.soft : [];
  const toolSkills = Array.isArray(catSkills.tools) ? catSkills.tools : [];
  const frameworkSkills = Array.isArray(catSkills.frameworks) ? catSkills.frameworks : [];
  const languagesList = Array.isArray(cand.languages) ? cand.languages : (catSkills.languages || []);

  // Format Experience
  const expEntries = Array.isArray(cand.experience)
    ? cand.experience
        .map((e) => {
          const titleCompany = `${e.title || 'Role'} at ${e.company || 'Company'}`;
          const duration = e.duration ? ` (${e.duration})` : '';
          const desc = e.description ? `: ${e.description}` : '';
          return `${titleCompany}${duration}${desc}`;
        })
        .join(' | ')
    : '';

  // Format Education
  const eduEntries = Array.isArray(cand.education)
    ? cand.education
        .map((e) => {
          const degreeField = `${e.degree || 'Degree'}${e.field_of_study ? ` in ${e.field_of_study}` : ''}`;
          const inst = e.institution ? ` from ${e.institution}` : '';
          const yr = e.graduation_year ? ` (${e.graduation_year})` : '';
          return `${degreeField}${inst}${yr}`;
        })
        .join(' | ')
    : '';

  // Format Projects
  const projEntries = Array.isArray(cand.projects)
    ? cand.projects
        .map((p) => {
          const tech = Array.isArray(p.technologies_used) && p.technologies_used.length > 0
            ? ` [Tech: ${p.technologies_used.join(', ')}]`
            : '';
          return `${p.name || 'Project'}${p.description ? `: ${p.description}` : ''}${tech}`;
        })
        .join(' | ')
    : '';

  // Format Certifications
  const certsList = Array.isArray(cand.certifications_nested) && cand.certifications_nested.length > 0
    ? cand.certifications_nested
        .map((c) => `${c.name || 'Cert'}${c.issuer ? ` (${c.issuer})` : ''}`)
        .join(', ')
    : Array.isArray(cand.certifications)
    ? cand.certifications.join(', ')
    : '';

  // Format Achievements
  const achList = Array.isArray(cand.achievements)
    ? cand.achievements
        .map((a) => (typeof a === 'string' ? a : `${a.title || 'Achievement'}${a.description ? `: ${a.description}` : ''}${a.metrics ? ` (${a.metrics})` : ''}`))
        .join(' | ')
    : '';

  // Format Licenses
  const licList = Array.isArray(cand.licenses)
    ? cand.licenses
        .map((l) => (typeof l === 'string' ? l : `${l.name || 'License'}${l.issuing_authority ? ` (${l.issuing_authority})` : ''}`))
        .join(', ')
    : '';

  // Recruiter Feedbacks / Actions
  const latestFeedback = Array.isArray(cand.feedbacks) && cand.feedbacks.length > 0
    ? cand.feedbacks[cand.feedbacks.length - 1]
    : null;
  const statusStr = latestFeedback ? latestFeedback.status : 'Pending Review';
  const notesStr = latestFeedback ? (latestFeedback.feedback || '') : '';

  // Evaluation Recommendation Data
  const latestRec = Array.isArray(cand.recommendations) && cand.recommendations.length > 0
    ? cand.recommendations[cand.recommendations.length - 1]
    : null;
  const matchScoreStr = latestRec ? `${latestRec.match_score}%` : 'N/A';
  const interviewReadyStr = latestRec ? (latestRec.interview_ready ? 'Yes (Interview Ready)' : 'No (Hold / Gap)') : 'N/A';
  const strengthsStr = latestRec && Array.isArray(latestRec.strengths) ? latestRec.strengths.join('; ') : '';
  const gapsStr = latestRec && Array.isArray(latestRec.missing_skills) ? latestRec.missing_skills.join(', ') : '';

  // Average confidence score
  const confValues = Object.values(confidence).filter((v) => typeof v === 'number');
  const avgConf = confValues.length > 0
    ? `${Math.round((confValues.reduce((a, b) => a + b, 0) / confValues.length) * (confValues[0] <= 1 ? 100 : 1))}%`
    : 'N/A';

  return {
    'Candidate ID': `CAND_${cand.id}`,
    'Full Name': cand.name || pi.name || 'N/A',
    'Email Address': cand.email || pi.email || 'N/A',
    'Phone Number': cand.phone || pi.phone || 'N/A',
    'Location': cand.location || pi.location || 'N/A',
    'Experience (Years)': cand.experience_years ?? 0,
    'Current Role': cand.role || prof.current_role || 'N/A',
    'Target Roles': Array.isArray(prof.target_roles) ? prof.target_roles.join(', ') : 'N/A',
    'Current Company': cand.current_company || prof.current_company || 'N/A',
    'Seniority Level': prof.seniority || 'N/A',
    'Industry': prof.industry || prof.category || 'N/A',
    'Notice Period': cand.notice_period || 'Immediate',
    'Expected Salary': cand.expected_salary || 'Negotiable',
    'Preferred Location': cand.preferred_location || 'N/A',
    'Technical Skills': techSkills.join(', ') || skillsList.join(', ') || 'N/A',
    'Soft Skills': softSkills.join(', ') || 'N/A',
    'Tools & Frameworks': [...toolSkills, ...frameworkSkills].join(', ') || 'N/A',
    'Languages': languagesList.join(', ') || 'N/A',
    'All Combined Skills': skillsList.join(', ') || 'N/A',
    'Work Experience Details': expEntries || 'N/A',
    'Education Details': eduEntries || 'N/A',
    'Projects Details': projEntries || 'N/A',
    'Certifications': certsList || 'N/A',
    'Licenses': licList || 'N/A',
    'Achievements': achList || 'N/A',
    'LinkedIn Profile': pi.linkedin || cand.linkedin || 'N/A',
    'GitHub Profile': pi.github || cand.github || 'N/A',
    'Portfolio Website': pi.portfolio || cand.portfolio || 'N/A',
    'Nationality': pi.nationality || 'N/A',
    'Recruiter Action Status': statusStr,
    'Recruiter Review Notes': notesStr,
    'AI Match Score': matchScoreStr,
    'Interview Ready Status': interviewReadyStr,
    'AI Key Strengths': strengthsStr,
    'AI Skill Gaps': gapsStr,
    'Extraction Certainty Score': avgConf,
    'Executive Summary': cand.summary || 'N/A',
    'Upload Date': cand.upload_date ? new Date(cand.upload_date).toLocaleString() : 'N/A'
  };
};

export const generateExcelFile = async (candidates) => {
  const XLSX = await import('xlsx');
  
  const rows = candidates.map(flattenCandidateRecord);
  const worksheet = XLSX.utils.json_to_sheet(rows);

  // Auto-size columns based on maximum length
  if (rows.length > 0) {
    const colWidths = Object.keys(rows[0]).map((key) => {
      let maxLen = key.length;
      rows.forEach((row) => {
        const val = String(row[key] || '');
        if (val.length > maxLen) maxLen = Math.min(val.length, 50); // cap max width at 50 for readability
      });
      return { wch: maxLen + 4 };
    });
    worksheet['!cols'] = colWidths;
  }

  // Freeze header row
  worksheet['!views'] = [{ state: 'frozen', xSplit: 0, ySplit: 1, activePane: 'bottomRight' }];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Candidates');

  const timestamp = new Date().toISOString().split('T')[0];
  XLSX.writeFile(workbook, `RecruitAI_Candidates_Export_${timestamp}.xlsx`);
};

export const generatePDFReport = async (candidates) => {
  const { jsPDF } = await import('jspdf');
  const autoTableModule = await import('jspdf-autotable');
  const autoTable = autoTableModule.default || autoTableModule;

  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  const timestamp = new Date().toLocaleString();
  const dateStr = new Date().toISOString().split('T')[0];

  // Header Banner
  doc.setFillColor(8, 47, 73); // Dark Primary #082f49
  doc.rect(0, 0, 297, 22, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('RecruitAI — Talent Repository Export Report', 14, 14);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Export Timestamp: ${timestamp}  |  Total Candidate Records: ${candidates.length}`, 297 - 14, 14, { align: 'right' });

  // Prepare table data
  const flattened = candidates.map(flattenCandidateRecord);

  const columns = [
    { header: 'ID', dataKey: 'Candidate ID' },
    { header: 'Name', dataKey: 'Full Name' },
    { header: 'Email & Contact', dataKey: 'Email Address' },
    { header: 'Role', dataKey: 'Current Role' },
    { header: 'Exp', dataKey: 'Experience (Years)' },
    { header: 'Location', dataKey: 'Location' },
    { header: 'Technical Skills', dataKey: 'Technical Skills' },
    { header: 'Education', dataKey: 'Education Details' },
    { header: 'Status', dataKey: 'Recruiter Action Status' }
  ];

  const tableRows = flattened.map((item) => ({
    ...item,
    'Experience (Years)': `${item['Experience (Years)']} Yrs`
  }));

  autoTable(doc, {
    startY: 28,
    head: [columns.map((c) => c.header)],
    body: tableRows.map((row) => columns.map((col) => row[col.dataKey] || 'N/A')),
    styles: {
      fontSize: 8,
      cellPadding: 3,
      overflow: 'linebreak',
      textColor: [30, 41, 59]
    },
    headStyles: {
      fillColor: [2, 132, 199], // Primary 600
      textColor: [255, 255, 255],
      fontStyle: 'bold'
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    },
    margin: { top: 28, bottom: 18, left: 14, right: 14 },
    didDrawPage: (data) => {
      // Footer page numbering
      const totalPages = doc.internal.getNumberOfPages();
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text(
        `Page ${data.pageNumber} of ${totalPages}  •  RecruitAI Intelligent ATS Platform`,
        14,
        210 - 8
      );
      doc.text(
        `Confidential Candidate Data  •  Generated ${dateStr}`,
        297 - 14,
        210 - 8,
        { align: 'right' }
      );
    }
  });

  doc.save(`RecruitAI_Talent_Pool_Report_${dateStr}.pdf`);
};
