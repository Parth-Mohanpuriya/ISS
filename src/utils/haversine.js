/**
 * Haversine Formula Utility
 * Calculates the great-circle distance between two points on Earth
 * Used to compute ISS speed based on consecutive position readings
 */

/**
 * Convert degrees to radians
 * @param {number} deg - Angle in degrees
 * @returns {number} Angle in radians
 */
const toRad = (deg) => (deg * Math.PI) / 180;

/**
 * Calculate distance between two lat/lng coordinates using Haversine formula
 * @param {number} lat1 - Latitude of first point
 * @param {number} lon1 - Longitude of first point
 * @param {number} lat2 - Latitude of second point
 * @param {number} lon2 - Longitude of second point
 * @returns {number} Distance in kilometers
 */
export const haversineDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in kilometers

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
};

/**
 * Calculate speed in km/h given two positions and time difference
 * @param {object} pos1 - { latitude, longitude, timestamp }
 * @param {object} pos2 - { latitude, longitude, timestamp }
 * @returns {number} Speed in km/h
 */
export const calculateSpeed = (pos1, pos2) => {
  if (!pos1 || !pos2) return 0;

  const distance = haversineDistance(
    pos1.latitude,
    pos1.longitude,
    pos2.latitude,
    pos2.longitude
  );

  // Time difference in hours
  const timeDiff = (pos2.timestamp - pos1.timestamp) / (1000 * 60 * 60);

  // Avoid division by zero
  if (timeDiff === 0) return 0;

  return Math.abs(distance / timeDiff);
};
