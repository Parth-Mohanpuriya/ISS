import { useState } from 'react';

/**
 * Navbar Component
 * Top navigation bar with app title, astronaut count, and dark/light mode toggle
 */
const Navbar = ({ darkMode, setDarkMode, astronauts }) => {
  const [showAstronauts, setShowAstronauts] = useState(false);

  return (
    <nav className={`sticky top-0 z-50 transition-theme ${
      darkMode
        ? 'bg-gray-900/90 border-b border-gray-700/50'
        : 'bg-white/90 border-b border-gray-200/50'
    } backdrop-blur-xl`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
        {/* Logo & Title */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <span className="text-white text-lg">🛰️</span>
          </div>
          <div>
            <h1 className={`text-lg sm:text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              ISS & News Dashboard
            </h1>
            <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Real-Time Intelligence
            </p>
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-3">
          {/* Astronaut Count Badge */}
          <div className="relative">
            <button
              onClick={() => setShowAstronauts(!showAstronauts)}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                darkMode
                  ? 'bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30'
                  : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
              }`}
            >
              <span>👨‍🚀</span>
              <span>{astronauts.number || 0} in Space</span>
            </button>

            {/* Astronaut Dropdown */}
            {showAstronauts && astronauts.people && (
              <div className={`absolute right-0 mt-2 w-64 rounded-xl shadow-2xl border p-4 z-50 ${
                darkMode
                  ? 'bg-gray-800 border-gray-700'
                  : 'bg-white border-gray-200'
              }`}>
                <h3 className={`text-sm font-semibold mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  🚀 Astronauts in Space
                </h3>
                <ul className="space-y-2 max-h-60 overflow-y-auto">
                  {astronauts.people.map((person, i) => (
                    <li
                      key={i}
                      className={`text-sm flex items-center gap-2 px-2 py-1.5 rounded-lg ${
                        darkMode
                          ? 'text-gray-300 bg-gray-700/50'
                          : 'text-gray-600 bg-gray-50'
                      }`}
                    >
                      <span className="text-xs">👤</span>
                      <span>{person.name}</span>
                      <span className={`ml-auto text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                        {person.craft}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Dark/Light Mode Toggle */}
          <button
            id="theme-toggle"
            onClick={() => setDarkMode(!darkMode)}
            className={`p-2.5 rounded-xl transition-all ${
              darkMode
                ? 'bg-yellow-500/20 text-yellow-300 hover:bg-yellow-500/30'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            aria-label="Toggle dark mode"
          >
            {darkMode ? (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
