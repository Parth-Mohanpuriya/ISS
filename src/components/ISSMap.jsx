import { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';

/**
 * Component to recenter the map when ISS position changes
 */
const RecenterMap = ({ position }) => {
  const map = useMap();
  useEffect(() => {
    if (position) {
      map.setView(position, map.getZoom(), { animate: true, duration: 1 });
    }
  }, [position, map]);
  return null;
};

/**
 * Custom ISS icon for the map marker
 */
const issIcon = new L.DivIcon({
  className: 'iss-marker',
  html: `
    <div style="
      position: relative;
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
    ">
      <div style="
        position: absolute;
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: rgba(99, 102, 241, 0.3);
        animation: pulse-ring 2s ease-out infinite;
      "></div>
      <div style="
        font-size: 24px;
        z-index: 2;
        filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
      ">🛰️</div>
    </div>
  `,
  iconSize: [40, 40],
  iconAnchor: [20, 20],
  popupAnchor: [0, -20],
});

/**
 * ISSMap Component
 * Interactive Leaflet map showing ISS position with trajectory path
 */
const ISSMap = ({ positions, darkMode }) => {
  // Get current (latest) position
  const currentPos = positions.length > 0 ? positions[positions.length - 1] : null;
  const center = currentPos
    ? [currentPos.latitude, currentPos.longitude]
    : [0, 0];

  // Build trajectory path from stored positions
  const trajectoryPath = useMemo(() => {
    return positions.map((p) => [p.latitude, p.longitude]);
  }, [positions]);

  // Choose tile layer based on dark/light mode
  const tileUrl = darkMode
    ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
    : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

  const tileAttribution = darkMode
    ? '&copy; <a href="https://carto.com/">CARTO</a>'
    : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

  return (
    <div className={`rounded-2xl overflow-hidden shadow-xl border transition-theme ${
      darkMode ? 'border-gray-700/50' : 'border-gray-200'
    }`} style={{ height: '400px' }}>
      <MapContainer
        center={center}
        zoom={3}
        scrollWheelZoom={true}
        style={{ height: '100%', width: '100%' }}
        worldCopyJump={true}
      >
        <TileLayer url={tileUrl} attribution={tileAttribution} />

        {/* Recenter map on ISS */}
        {currentPos && <RecenterMap position={center} />}

        {/* ISS Marker */}
        {currentPos && (
          <Marker position={center} icon={issIcon}>
            <Popup>
              <div style={{ fontFamily: 'Inter, sans-serif', padding: '4px' }}>
                <strong>🛰️ International Space Station</strong>
                <br />
                <span>Lat: {currentPos.latitude.toFixed(4)}</span>
                <br />
                <span>Lng: {currentPos.longitude.toFixed(4)}</span>
                <br />
                <span style={{ fontSize: '11px', color: '#888' }}>
                  {new Date(currentPos.timestamp).toLocaleTimeString()}
                </span>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Trajectory Path */}
        {trajectoryPath.length > 1 && (
          <Polyline
            positions={trajectoryPath}
            pathOptions={{
              color: '#6366f1',
              weight: 3,
              opacity: 0.7,
              dashArray: '10, 6',
            }}
          />
        )}
      </MapContainer>
    </div>
  );
};

export default ISSMap;
