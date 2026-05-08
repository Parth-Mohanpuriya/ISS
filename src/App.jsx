import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import Navbar from './components/Navbar';
import ISSMap from './components/ISSMap';
import ISSChart from './components/ISSChart';
import NewsSection from './components/NewsSection';
import Chatbot from './components/Chatbot';
import { calculateSpeed } from './utils/haversine';

/**
 * App Component
 * Main dashboard layout combining ISS tracking, news, charts, and AI chatbot
 */
function App() {
  // ===== Dark Mode State =====
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : true; // Default to dark mode
  });

  // ===== ISS Tracking State =====
  const [issPositions, setIssPositions] = useState([]); // Last 15 positions
  const [speedHistory, setSpeedHistory] = useState([]); // Last 30 speeds
  const [currentSpeed, setCurrentSpeed] = useState(0);
  const [issLoading, setIssLoading] = useState(true);
  const [issError, setIssError] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // ===== Astronauts State =====
  const [astronauts, setAstronauts] = useState({ number: 0, people: [] });

  // ===== News State =====
  const [articles, setArticles] = useState([]);

  // ===== Persist dark mode =====
  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  /**
   * Fetch current ISS position with fallback support
   */
  const fetchISSPosition = useCallback(async () => {
    setIssError(null);
    let success = false;
    let positionData = null;

    // Try Primary API (WhereTheISS.at - HTTPS Native)
    try {
      const response = await axios.get('https://api.wheretheiss.at/v1/satellites/25544');
      positionData = {
        latitude: parseFloat(response.data.latitude),
        longitude: parseFloat(response.data.longitude),
        velocity: response.data.velocity,
      };
      success = true;
    } catch (err) {
      console.warn('Primary ISS API failed, trying fallback...', err);
    }

    // Try Fallback API (Open Notify - via CORS proxy)
    if (!success) {
      try {
        const response = await axios.get('/api/iss/iss-now.json');
        positionData = {
          latitude: parseFloat(response.data.iss_position.latitude),
          longitude: parseFloat(response.data.iss_position.longitude),
          velocity: null, // Open Notify doesn't provide velocity
        };
        success = true;
      } catch (err) {
        console.error('All ISS APIs failed:', err);
      }
    }

    if (success && positionData) {
      const newPosition = {
        latitude: positionData.latitude,
        longitude: positionData.longitude,
        timestamp: Date.now(),
      };

      setIssPositions((prev) => {
        const updated = [...prev, newPosition].slice(-15);

        const speed = positionData.velocity || (updated.length >= 2 ? calculateSpeed(
          updated[updated.length - 2],
          updated[updated.length - 1]
        ) : 0);

        if (speed > 0) {
          setCurrentSpeed(speed);
          setSpeedHistory((prevSpeeds) =>
            [...prevSpeeds, { speed, timestamp: newPosition.timestamp }].slice(-30)
          );
        }
        return updated;
      });
      setIssLoading(false);
    } else {
      setIssError('Failed to fetch ISS data from all sources.');
      setIssLoading(false);
    }
  }, []);

  /**
   * Fetch astronaut data
   */
  const fetchAstronauts = useCallback(async () => {
    try {
      const response = await axios.get('/api/iss/astros.json');
      setAstronauts({
        number: response.data.number,
        people: response.data.people,
      });
    } catch (err) {
      console.error('Astronauts fetch error:', err);
    }
  }, []);

  // ===== Initial fetch on mount =====
  useEffect(() => {
    fetchISSPosition();
    fetchAstronauts();
  }, [fetchISSPosition, fetchAstronauts]);

  // ===== Auto-refresh ISS every 15 seconds =====
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchISSPosition();
    }, 15000);

    return () => clearInterval(interval);
  }, [autoRefresh, fetchISSPosition]);

  // Get the latest ISS position for display
  const latestPosition = issPositions.length > 0 ? issPositions[issPositions.length - 1] : null;

  // Build ISS data object for chatbot context
  const issDataForChat = latestPosition
    ? { ...latestPosition, speed: currentSpeed }
    : null;

  /**
   * Determine approximate region based on lat/lng
   */
  const getRegion = (lat, lng) => {
    if (!lat && lat !== 0) return 'Unknown';
    // Simple region detection based on coordinates
    if (lat > 66.5) return '🧊 Arctic Region';
    if (lat < -66.5) return '🧊 Antarctic Region';
    if (Math.abs(lat) < 23.5 && lng > -30 && lng < 60) return '🌍 Africa / Atlantic';
    if (Math.abs(lat) < 23.5 && lng >= 60 && lng < 150) return '🌏 Indian Ocean / Asia';
    if (Math.abs(lat) < 23.5 && lng >= 150 || lng < -120) return '🌊 Pacific Ocean';
    if (lat > 23.5 && lat < 66.5 && lng > -130 && lng < -60) return '🌎 North America';
    if (lat > 23.5 && lat < 66.5 && lng > -30 && lng < 60) return '🌍 Europe / Middle East';
    if (lat > 23.5 && lat < 66.5 && lng >= 60) return '🌏 Asia';
    if (lat < -23.5 && lng > -80 && lng < -30) return '🌎 South America';
    if (lat < -23.5 && lng > 100 && lng < 180) return '🌏 Oceania';
    return '🌊 Over Ocean';
  };

  return (
    <div className={`min-h-screen transition-theme ${
      darkMode
        ? 'bg-gradient-to-br from-gray-950 via-gray-900 to-indigo-950'
        : 'bg-gradient-to-br from-gray-50 via-white to-indigo-50'
    }`}>
      {/* Navbar */}
      <Navbar darkMode={darkMode} setDarkMode={setDarkMode} astronauts={astronauts} />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">

        {/* ===== ISS STATUS CARDS ===== */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              🛰️ ISS Live Tracking
            </h2>
            <div className="flex items-center gap-3">
              {/* Auto-Refresh Toggle */}
              <button
                id="auto-refresh-toggle"
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                  autoRefresh
                    ? 'bg-green-500/20 text-green-400'
                    : darkMode
                      ? 'bg-gray-700 text-gray-400'
                      : 'bg-gray-200 text-gray-500'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${autoRefresh ? 'bg-green-400 animate-pulse' : 'bg-gray-500'}`} />
                {autoRefresh ? 'Live' : 'Paused'}
              </button>

              {/* Manual Refresh */}
              <button
                id="iss-refresh"
                onClick={fetchISSPosition}
                className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl text-sm font-medium hover:shadow-lg hover:shadow-indigo-500/30 transition-all active:scale-95"
              >
                🔄 Refresh
              </button>
            </div>
          </div>

          {/* ISS Stats Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            {/* Latitude */}
            <div className={`rounded-2xl p-4 shadow-lg border transition-theme ${
              darkMode ? 'bg-gray-800/50 border-gray-700/50' : 'bg-white border-gray-200'
            }`}>
              <p className={`text-xs font-medium mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                📍 Latitude
              </p>
              <p className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {issLoading ? '---' : latestPosition?.latitude.toFixed(4) || 'N/A'}
              </p>
            </div>

            {/* Longitude */}
            <div className={`rounded-2xl p-4 shadow-lg border transition-theme ${
              darkMode ? 'bg-gray-800/50 border-gray-700/50' : 'bg-white border-gray-200'
            }`}>
              <p className={`text-xs font-medium mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                📍 Longitude
              </p>
              <p className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {issLoading ? '---' : latestPosition?.longitude.toFixed(4) || 'N/A'}
              </p>
            </div>

            {/* Speed */}
            <div className={`rounded-2xl p-4 shadow-lg border transition-theme ${
              darkMode ? 'bg-gray-800/50 border-gray-700/50' : 'bg-white border-gray-200'
            }`}>
              <p className={`text-xs font-medium mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                🚀 Speed
              </p>
              <p className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {currentSpeed > 0 ? `${Math.round(currentSpeed).toLocaleString()} km/h` : '---'}
              </p>
            </div>

            {/* Tracked Positions */}
            <div className={`rounded-2xl p-4 shadow-lg border transition-theme ${
              darkMode ? 'bg-gray-800/50 border-gray-700/50' : 'bg-white border-gray-200'
            }`}>
              <p className={`text-xs font-medium mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                📊 Tracked
              </p>
              <p className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {issPositions.length}
                <span className={`text-sm font-normal ml-1 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                  / 15
                </span>
              </p>
            </div>
          </div>

          {/* Region Badge */}
          {latestPosition && (
            <div className={`mb-6 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium ${
              darkMode
                ? 'bg-purple-500/20 text-purple-300'
                : 'bg-purple-50 text-purple-700'
            }`}>
              {getRegion(latestPosition.latitude, latestPosition.longitude)}
            </div>
          )}

          {/* ISS Error Display */}
          {issError && (
            <div className={`mb-4 p-3 rounded-xl border text-sm ${
              darkMode
                ? 'bg-red-500/10 border-red-500/30 text-red-300'
                : 'bg-red-50 border-red-200 text-red-700'
            }`}>
              ⚠️ {issError}
            </div>
          )}

          {/* Map + Chart Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* ISS Map */}
            <ISSMap positions={issPositions} darkMode={darkMode} />

            {/* ISS Speed Chart */}
            <ISSChart speedHistory={speedHistory} darkMode={darkMode} />
          </div>
        </section>

        {/* ===== DIVIDER ===== */}
        <hr className={`border-t ${darkMode ? 'border-gray-800' : 'border-gray-200'}`} />

        {/* ===== NEWS SECTION ===== */}
        <section>
          <NewsSection
            darkMode={darkMode}
            articles={articles}
            setArticles={setArticles}
          />
        </section>
      </main>

      {/* ===== FLOATING CHATBOT ===== */}
      <Chatbot
        darkMode={darkMode}
        issData={issDataForChat}
        astronauts={astronauts}
        articles={articles}
      />

      {/* Footer */}
      <footer className={`text-center py-6 text-sm ${
        darkMode ? 'text-gray-600' : 'text-gray-400'
      }`}>
        <p>ISS & News Intelligence Dashboard • Built with React + Vite</p>
      </footer>
    </div>
  );
}

export default App;
