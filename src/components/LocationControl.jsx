import { useEffect, useRef, useState } from 'react';
import { MapPin, X } from 'lucide-react';
import { approximateLocation, hasCoordinates } from '../lib/location.js';

export default function LocationControl({ value, onChange, forPublication = false }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const active = useRef(true);
  useEffect(() => {
    active.current = true;
    return () => { active.current = false; };
  }, []);

  function locate() {
    setError('');
    if (!navigator.geolocation) { setError('Este navegador no ofrece ubicación. Puedes continuar usando tu barrio.'); return; }
    setPending(true);
    navigator.geolocation.getCurrentPosition(position => {
      if (!active.current) return;
      setPending(false);
      if (position.coords.accuracy > 2000) {
        setError('La ubicación es demasiado imprecisa. Intenta desde tu celular o continúa con tu barrio.');
        return;
      }
      onChange(approximateLocation(position.coords.latitude, position.coords.longitude));
    }, failure => {
      if (!active.current) return;
      setPending(false);
      setError(failure.code === 1 ? 'Permiso de ubicación denegado. Puedes continuar usando tu barrio.' : 'No pudimos obtener la ubicación. Intenta nuevamente o continúa con tu barrio.');
    }, { enableHighAccuracy: false, timeout: 12000, maximumAge: 60000 });
  }

  return <div className="location-control">
    <div><button type="button" className="text-button" disabled={pending} onClick={locate}><MapPin size={17} />
      {pending ? 'Obteniendo ubicación…' : hasCoordinates(value) ? 'Actualizar ubicación aproximada' : forPublication ? 'Añadir ubicación aproximada' : 'Ordenar cerca de mí'}
    </button>
    {hasCoordinates(value) && <button type="button" aria-label="Quitar ubicación" onClick={() => { onChange(null); setError(''); }}><X size={17}/></button>}</div>
    {forPublication && <small>Opcional. Al publicar se compartirá un punto redondeado de tu zona. Úsalo cuando estés cerca del lugar del pedido.</small>}
    <span role="status">{pending ? 'Consultando ubicación.' : hasCoordinates(value) ? forPublication ? 'Ubicación aproximada añadida.' : 'Publicaciones ordenadas por cercanía dentro de tu barrio.' : ''}</span>
    {error && <p role="alert">{error}</p>}
  </div>;
}
