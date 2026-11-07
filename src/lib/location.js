export function hasCoordinates(point) {
  return Number.isFinite(point?.latitud) && Math.abs(point.latitud) <= 90 &&
    Number.isFinite(point?.longitud) && Math.abs(point.longitud) <= 180;
}

export function approximateLocation(latitude, longitude) {
  const point = { latitud: latitude, longitud: longitude };
  if (!hasCoordinates(point)) throw new Error('Ubicación inválida.');
  return { latitud: Number(latitude.toFixed(3)), longitud: Number(longitude.toFixed(3)) };
}

export function distanceKm(origin, destination) {
  if (!hasCoordinates(origin) || !hasCoordinates(destination)) return Infinity;
  const radians = value => value * Math.PI / 180;
  const dLat = radians(destination.latitud - origin.latitud);
  const dLon = radians(destination.longitud - origin.longitud);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(radians(origin.latitud)) *
    Math.cos(radians(destination.latitud)) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(Math.max(0, 1 - a)));
}

export function formatDistance(km) {
  if (!Number.isFinite(km)) return null;
  if (km < 0.2) return 'Menos de 200 m aprox.';
  return km < 1 ? `${Math.round(km * 10) * 100} m aprox.` : `${km.toFixed(1)} km aprox.`;
}
