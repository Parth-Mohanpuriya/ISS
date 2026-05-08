import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';

/**
 * ISSChart Component
 * Real-time line/area chart showing ISS speed over time
 * Displays last 30 speed measurements
 */
const ISSChart = ({ speedHistory, darkMode }) => {
  // Format data for Recharts
  const chartData = speedHistory.map((entry) => ({
    time: new Date(entry.timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }),
    speed: Math.round(entry.speed),
  }));

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div
          className={`px-4 py-3 rounded-xl shadow-lg border ${
            darkMode
              ? 'bg-gray-800 border-gray-700 text-white'
              : 'bg-white border-gray-200 text-gray-900'
          }`}
        >
          <p className="text-xs text-gray-400 mb-1">{label}</p>
          <p className="text-sm font-semibold">
            🚀 {payload[0].value.toLocaleString()} km/h
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div
      className={`rounded-2xl p-5 shadow-xl border transition-theme ${
        darkMode
          ? 'bg-gray-800/50 border-gray-700/50'
          : 'bg-white border-gray-200'
      }`}
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3
            className={`text-lg font-bold ${
              darkMode ? 'text-white' : 'text-gray-900'
            }`}
          >
            📈 ISS Speed History
          </h3>
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Last {chartData.length} measurements
          </p>
        </div>
        {chartData.length > 0 && (
          <div
            className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
              darkMode
                ? 'bg-indigo-500/20 text-indigo-300'
                : 'bg-indigo-50 text-indigo-700'
            }`}
          >
            Latest: {chartData[chartData.length - 1]?.speed?.toLocaleString()} km/h
          </div>
        )}
      </div>

      {chartData.length > 1 ? (
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="speedGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={darkMode ? '#374151' : '#e5e7eb'}
            />
            <XAxis
              dataKey="time"
              tick={{ fontSize: 11, fill: darkMode ? '#9ca3af' : '#6b7280' }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: darkMode ? '#9ca3af' : '#6b7280' }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="speed"
              stroke="#6366f1"
              strokeWidth={2.5}
              fill="url(#speedGradient)"
              dot={false}
              activeDot={{ r: 5, fill: '#6366f1', stroke: '#fff', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      ) : (
        <div className={`flex items-center justify-center h-[280px] rounded-xl ${
          darkMode ? 'bg-gray-700/30' : 'bg-gray-50'
        }`}>
          <p className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
            ⏳ Collecting speed data... ({chartData.length}/2 points needed)
          </p>
        </div>
      )}
    </div>
  );
};

export default ISSChart;
