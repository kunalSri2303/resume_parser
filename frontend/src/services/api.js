import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const resumeApi = {
  upload: (files) => {
    const formData = new FormData();
    // Accept array of files for single, multiple, or zip uploads
    for (let i = 0; i < files.length; i++) {
      formData.append('files', files[i]);
    }
    return api.post('/upload-resume', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  getAll: () => api.get('/candidates'),
  getById: (id) => api.get(`/candidate/${id}`),
};

export const jobApi = {
  upload: (file, rawText, interviewDate) => {
    const formData = new FormData();
    if (file) {
      formData.append('file', file);
    }
    if (rawText) {
      formData.append('raw_text', rawText);
    }
    if (interviewDate) {
      formData.append('interview_date', interviewDate);
    }
    return api.post('/upload-job', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  create: (jobData) => api.post('/job', jobData),
  update: (id, jobData) => api.put(`/job/${id}`, jobData),
  extractVacancy: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/extract-vacancy', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  getAll: () => api.get('/jobs'),
  getById: (id) => api.get(`/job/${id}`),
};

export const searchApi = {
  search: (query, topK = 10) => api.post('/search', { query, top_k: topK }),
};

export const recommendationApi = {
  matchJob: (jobId) => api.post(`/match/${jobId}`),
  getReport: (candidateId, jobId) => api.get(`/recommendation/${candidateId}/${jobId}`),
};

export const feedbackApi = {
  submit: (candidateId, jobId, status, feedback) =>
    api.post('/feedback', {
      candidate_id: candidateId,
      job_id: jobId,
      status,
      feedback,
    }),
};

export const analyticsApi = {
  getMetrics: () => api.get('/analytics'),
};

export default api;
