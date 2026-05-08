import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

/**
 * NewsSection Component
 * Fetches and displays news articles with search, sort, and source distribution chart
 */

// Colors for the pie chart segments
const CHART_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e',
  '#f97316', '#eab308', '#22c55e', '#14b8a6',
  '#06b6d4', '#3b82f6',
];

const NewsSection = ({ darkMode, articles, setArticles }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [activeSource, setActiveSource] = useState(null);

  /**
   * Fetch news articles from GNews API
   * Caches results in localStorage for 15 minutes
   */
  const fetchNews = useCallback(async (query = '') => {
    // Check localStorage cache first
    const cacheKey = `news_cache_${query}`;
    const cached = localStorage.getItem(cacheKey);

    if (cached) {
      const { data, timestamp } = JSON.parse(cached);
      const fifteenMinutes = 15 * 60 * 1000;

      // Use cache if less than 15 minutes old
      if (Date.now() - timestamp < fifteenMinutes) {
        setArticles(data);
        return;
      }
    }

    setLoading(true);
    setError(null);

    try {
      const apiKey = import.meta.env.VITE_NEWS_API_KEY;
      const searchParam = query ? `q=${encodeURIComponent(query)}` : 'q=technology';
      const url = `https://gnews.io/api/v4/search?${searchParam}&lang=en&max=10&apikey=${apiKey}`;

      const response = await axios.get(url);
      const fetchedArticles = response.data.articles || [];

      setArticles(fetchedArticles);

      // Cache the results
      localStorage.setItem(
        cacheKey,
        JSON.stringify({ data: fetchedArticles, timestamp: Date.now() })
      );
    } catch (err) {
      console.error('News fetch error:', err);
      setError('Failed to fetch news. Check your API key or try again later.');
      // Try loading from any existing cache as fallback
      if (cached) {
        const { data } = JSON.parse(cached);
        setArticles(data);
      }
    } finally {
      setLoading(false);
    }
  }, [setArticles]);

  // Fetch news on mount
  useEffect(() => {
    if (articles.length === 0) {
      fetchNews();
    }
  }, []);

  // Handle search submit
  const handleSearch = (e) => {
    e.preventDefault();
    fetchNews(searchQuery);
  };

  // Compute source distribution for pie chart
  const sourceDistribution = articles.reduce((acc, article) => {
    const source = article.source?.name || 'Unknown';
    const existing = acc.find((item) => item.name === source);
    if (existing) {
      existing.value += 1;
    } else {
      acc.push({ name: source, value: 1 });
    }
    return acc;
  }, []);

  // Filter articles by active source (clicked from pie chart)
  const filteredArticles = activeSource
    ? articles.filter((a) => (a.source?.name || 'Unknown') === activeSource)
    : articles;

  // Sort articles
  const sortedArticles = [...filteredArticles].sort((a, b) => {
    if (sortBy === 'date') {
      return new Date(b.publishedAt) - new Date(a.publishedAt);
    }
    return (a.source?.name || '').localeCompare(b.source?.name || '');
  });

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            📰 News Dashboard
          </h2>
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Latest headlines from around the world
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Search Form */}
          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              id="news-search"
              type="text"
              placeholder="Search news..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`px-4 py-2 rounded-xl text-sm border transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                darkMode
                  ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500'
                  : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'
              }`}
            />
            <button
              type="submit"
              className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl text-sm font-medium hover:shadow-lg hover:shadow-indigo-500/30 transition-all"
            >
              🔍
            </button>
          </form>

          {/* Sort Dropdown */}
          <select
            id="news-sort"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className={`px-3 py-2 rounded-xl text-sm border transition-all focus:outline-none ${
              darkMode
                ? 'bg-gray-800 border-gray-700 text-white'
                : 'bg-white border-gray-200 text-gray-900'
            }`}
          >
            <option value="date">Sort by Date</option>
            <option value="source">Sort by Source</option>
          </select>

          {/* Refresh Button */}
          <button
            id="news-refresh"
            onClick={() => {
              localStorage.removeItem(`news_cache_${searchQuery}`);
              fetchNews(searchQuery);
            }}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              darkMode
                ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Source Filter Indicator */}
      {activeSource && (
        <div className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm ${
          darkMode ? 'bg-indigo-500/20 text-indigo-300' : 'bg-indigo-50 text-indigo-700'
        }`}>
          <span>Filtering by: <strong>{activeSource}</strong></span>
          <button
            onClick={() => setActiveSource(null)}
            className="ml-2 underline hover:no-underline"
          >
            Clear filter
          </button>
        </div>
      )}

      {/* News Distribution Chart */}
      {sourceDistribution.length > 0 && (
        <div className={`rounded-2xl p-5 shadow-xl border transition-theme ${
          darkMode ? 'bg-gray-800/50 border-gray-700/50' : 'bg-white border-gray-200'
        }`}>
          <h3 className={`text-lg font-bold mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            📊 Source Distribution
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={sourceDistribution}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={3}
                dataKey="value"
                onClick={(data) => setActiveSource(data.name === activeSource ? null : data.name)}
                style={{ cursor: 'pointer' }}
              >
                {sourceDistribution.map((entry, index) => (
                  <Cell
                    key={entry.name}
                    fill={CHART_COLORS[index % CHART_COLORS.length]}
                    stroke="none"
                    opacity={activeSource && activeSource !== entry.name ? 0.4 : 1}
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: darkMode ? '#1f2937' : '#fff',
                  border: darkMode ? '1px solid #374151' : '1px solid #e5e7eb',
                  borderRadius: '12px',
                  color: darkMode ? '#fff' : '#111',
                  fontSize: '13px',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          {/* Legend */}
          <div className="flex flex-wrap gap-3 mt-3 justify-center">
            {sourceDistribution.map((entry, index) => (
              <button
                key={entry.name}
                onClick={() => setActiveSource(entry.name === activeSource ? null : entry.name)}
                className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded-lg transition-all ${
                  activeSource === entry.name
                    ? 'ring-2 ring-indigo-500'
                    : ''
                } ${darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ background: CHART_COLORS[index % CHART_COLORS.length] }}
                />
                {entry.name} ({entry.value})
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <span className={darkMode ? 'text-gray-300' : 'text-gray-600'}>Loading news...</span>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className={`p-4 rounded-xl border text-sm ${
          darkMode
            ? 'bg-red-500/10 border-red-500/30 text-red-300'
            : 'bg-red-50 border-red-200 text-red-700'
        }`}>
          ⚠️ {error}
        </div>
      )}

      {/* Articles Grid */}
      {!loading && sortedArticles.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sortedArticles.map((article, index) => (
            <article
              key={index}
              className={`news-card rounded-2xl overflow-hidden shadow-lg border transition-all duration-300 ${
                darkMode
                  ? 'bg-gray-800/50 border-gray-700/50 hover:border-indigo-500/50'
                  : 'bg-white border-gray-200 hover:border-indigo-300'
              }`}
            >
              {/* Article Image */}
              {article.image && (
                <div className="h-44 overflow-hidden">
                  <img
                    src={article.image}
                    alt={article.title}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                </div>
              )}

              <div className="p-4 space-y-3">
                {/* Source & Date */}
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-medium px-2 py-1 rounded-lg ${
                    darkMode
                      ? 'bg-indigo-500/20 text-indigo-300'
                      : 'bg-indigo-50 text-indigo-700'
                  }`}>
                    {article.source?.name || 'Unknown'}
                  </span>
                  <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                    {new Date(article.publishedAt).toLocaleDateString()}
                  </span>
                </div>

                {/* Title */}
                <h3 className={`font-semibold leading-tight line-clamp-2 ${
                  darkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  {article.title}
                </h3>

                {/* Description */}
                <p className={`text-sm line-clamp-2 ${
                  darkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  {article.description}
                </p>

                {/* Author */}
                {article.author && (
                  <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                    ✍️ {article.author}
                  </p>
                )}

                {/* Read More */}
                <a
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm font-medium text-indigo-500 hover:text-indigo-400 transition-colors"
                >
                  Read More →
                </a>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && sortedArticles.length === 0 && (
        <div className={`text-center py-12 rounded-2xl border ${
          darkMode ? 'bg-gray-800/50 border-gray-700/50 text-gray-400' : 'bg-gray-50 border-gray-200 text-gray-500'
        }`}>
          <p className="text-4xl mb-3">📭</p>
          <p>No articles found. Try a different search term.</p>
        </div>
      )}
    </div>
  );
};

export default NewsSection;
