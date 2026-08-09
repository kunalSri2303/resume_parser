import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Search as SearchIcon, 
  MapPin, 
  Clock, 
  Sparkles, 
  ArrowRight,
  TrendingUp,
  History,
  X,
  SlidersHorizontal,
  CheckCircle2
} from 'lucide-react';
import { searchApi } from '../services/api';

const SEARCH_HISTORY_KEY = 'recruitai_search_history';

const Search = () => {
  const [query, setQuery] = useState('');
  const [topK, setTopK] = useState(10);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(SEARCH_HISTORY_KEY);
      if (saved) setHistory(JSON.parse(saved));
    } catch (e) {}
  }, []);

  const saveHistory = (q) => {
    if (!q.trim()) return;
    setHistory((prev) => {
      const updated = [q, ...prev.filter((item) => item.toLowerCase() !== q.toLowerCase())].slice(0, 5);
      localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem(SEARCH_HISTORY_KEY);
  };

  const sampleQueries = [
    'Python backend developer with FastAPI and Docker',
    'Senior React developer with TypeScript and Tailwind',
    'Machine Learning Engineer with PyTorch experience',
    'Full Stack Engineer with 3+ years experience in Node.js',
    'Data Scientist who knows SQL and Pandas'
  ];

  const handleSearch = async (searchQuery) => {
    const q = searchQuery !== undefined ? searchQuery : query;
    if (!q.trim()) return;
    
    if (searchQuery !== undefined) {
      setQuery(searchQuery);
    }
    
    saveHistory(q);
    setLoading(true);
    setSearched(true);
    try {
      const res = await searchApi.search(q, topK);
      setResults(res.data || []);
    } catch (err) {
      console.error('Failed to run natural language search:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
          Natural Language Talent Search
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-primary-100 dark:bg-primary-950 text-primary-700 dark:text-primary-300 font-semibold font-mono">
            FAISS Vector Index
          </span>
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Query candidate profiles using conversational descriptions, technical requirements, or role seniority.
        </p>
      </div>

      {/* Query Bar Panel */}
      <div className="p-6 sm:p-8 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-2xs space-y-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <SearchIcon className="absolute left-4 top-3.5 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="e.g. Senior Machine Learning Engineer from Stanford with PyTorch..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs sm:text-sm focus:outline-none focus:border-primary-500 font-semibold leading-relaxed transition-all shadow-inner"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={topK}
              onChange={(e) => setTopK(Number(e.target.value))}
              className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-semibold px-3 py-3 rounded-2xl focus:outline-none"
              title="Number of candidate matches to return"
            >
              <option value={5}>Top 5</option>
              <option value={10}>Top 10</option>
              <option value={20}>Top 20</option>
            </select>

            <button
              onClick={() => handleSearch()}
              disabled={loading || !query.trim()}
              className="bg-primary-600 hover:bg-primary-700 disabled:bg-slate-300 dark:disabled:bg-slate-800 text-white px-6 py-3 rounded-2xl text-xs sm:text-sm font-bold transition-all flex items-center space-x-2 shadow-md hover:shadow-lg cursor-pointer disabled:cursor-not-allowed flex-shrink-0"
            >
              {loading ? (
                <>
                  <span className="animate-spin border-2 border-white border-t-transparent rounded-full h-4 w-4 mr-1" />
                  <span>Searching...</span>
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  <span>Query Pool</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Suggested Queries */}
        <div className="space-y-2">
          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
            Suggested Search Phrases:
          </span>
          <div className="flex flex-wrap gap-2">
            {sampleQueries.map((sample, idx) => (
              <button
                key={idx}
                onClick={() => handleSearch(sample)}
                className="px-3 py-1.5 border border-slate-200/70 dark:border-slate-800 bg-slate-50/70 hover:bg-primary-50/70 dark:bg-slate-950/30 dark:hover:bg-primary-950/30 text-slate-600 dark:text-slate-300 hover:text-primary-600 dark:hover:text-primary-400 rounded-xl text-xs font-medium transition-all cursor-pointer"
              >
                {sample}
              </button>
            ))}
          </div>
        </div>

        {/* Search History */}
        {history.length > 0 && (
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                <History size={12} />
                Recent:
              </span>
              {history.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSearch(item)}
                  className="text-xs text-slate-500 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-300 underline decoration-slate-300 cursor-pointer"
                >
                  {item}
                </button>
              ))}
            </div>
            <button
              onClick={clearHistory}
              className="text-[10px] text-slate-400 hover:text-rose-500 transition-colors"
            >
              Clear History
            </button>
          </div>
        )}
      </div>

      {/* Search Results */}
      {searched && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles size={18} className="text-primary-500" />
              Search Matches ({results.length} Profiles)
            </h3>
            <span className="text-xs text-slate-400">
              Ranked by 384-d Cosine Similarity
            </span>
          </div>

          {loading ? (
            <div className="p-16 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-3">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600 mx-auto" />
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Searching FAISS Index...
              </p>
            </div>
          ) : results.length > 0 ? (
            <div className="space-y-4">
              {results.map((res) => {
                const cand = res.candidate;
                const initials = (cand.name || 'C')
                  .split(' ')
                  .map((n) => n[0])
                  .slice(0, 2)
                  .join('')
                  .toUpperCase();
                
                const skills = Array.isArray(cand.skills)
                  ? cand.skills.map((s) => (typeof s === 'string' ? s : s.skill?.name || '')).filter(Boolean)
                  : [];

                return (
                  <div
                    key={cand.id}
                    className="p-5 sm:p-6 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-2xs hover:shadow-lg dark:hover:shadow-primary-950/30 glow-card transition-all flex flex-col md:flex-row md:items-center justify-between gap-5"
                  >
                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-primary-600 to-indigo-600 text-white font-extrabold text-sm flex items-center justify-center shadow-md flex-shrink-0">
                        {initials}
                      </div>

                      <div className="space-y-1.5">
                        <div>
                          <Link
                            to={`/resume/${cand.id}`}
                            className="font-bold text-base text-slate-900 dark:text-white hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                          >
                            {cand.name}
                          </Link>
                          <p className="text-xs text-primary-600 dark:text-primary-400 font-semibold">
                            {cand.role || 'Role not extracted'}
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400 font-medium">
                          <span className="flex items-center space-x-1">
                            <Clock size={12} />
                            <span>{cand.experience_years} Yrs Exp</span>
                          </span>
                          {cand.location && (
                            <span className="flex items-center space-x-1">
                              <MapPin size={12} />
                              <span>{cand.location}</span>
                            </span>
                          )}
                          <span className="text-slate-400">{cand.email}</span>
                        </div>

                        {/* Skills preview */}
                        <div className="flex flex-wrap gap-1 pt-1">
                          {skills.slice(0, 5).map((sk, i) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded text-[10px] font-bold"
                            >
                              {sk}
                            </span>
                          ))}
                          {skills.length > 5 && (
                            <span className="text-slate-400 text-[10px] font-bold self-center">
                              +{skills.length - 5}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center border-t md:border-t-0 pt-3 md:pt-0 border-slate-100 dark:border-slate-800 gap-3 flex-shrink-0">
                      <div className="text-left md:text-right">
                        <span className="text-2xl font-black text-primary-600 dark:text-primary-400">
                          {res.score}%
                        </span>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
                          Relevance Match
                        </span>
                      </div>

                      <Link
                        to={`/resume/${cand.id}`}
                        className="inline-flex items-center space-x-1 bg-primary-50 dark:bg-primary-950/40 hover:bg-primary-100 text-primary-700 dark:text-primary-300 border border-primary-500/20 px-4 py-2 rounded-xl text-xs font-bold transition-all"
                      >
                        <span>Inspect Profile</span>
                        <ArrowRight size={13} className="ml-1" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-16 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-500 text-xs">
              No matching talent profiles found in FAISS for your query. Try different keywords.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Search;
