import { useState } from 'react';
import { hasCoordinates } from '../lib/location.js';

export default function PublicationMap({ publication }) {
  const [visible, setVisible] = useState(false);
  if (!hasCoordinates(publication)) return null;
  const lat = publication.latitud;
  const lon = publication.longitud;
  const bounds = [Math.max(-180, lon - 0.012), Math.max(-90, lat - 0.008), Math.min(180, lon + 0.012), Math.min(90, lat + 0.008)];
  const query = new URLSearchParams({ bbox: bounds.join(','), layer: 'mapnik', marker: `${lat},${lon}` });
  return <div className="publication-map">
    <button type="button" className="text-button" aria-expanded={visible} onClick={() => setVisible(!visible)}>{visible ? 'Ocultar mapa' : 'Ver ubicación aproximada en el mapa'}</button>
    {visible && <><iframe title="Mapa de la ubicación aproximada" src={`https://www.openstreetmap.org/export/embed.html?${query}`} loading="lazy" referrerPolicy="no-referrer" />
      <small>Zona de referencia · <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">© OpenStreetMap</a></small></>}
  </div>;
}
