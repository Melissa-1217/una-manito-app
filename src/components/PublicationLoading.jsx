import { useEffect, useState } from 'react';

export default function PublicationLoading() {
  const [slow, setSlow] = useState(false);
  useEffect(() => { const timer = setTimeout(() => setSlow(true), 5000); return () => clearTimeout(timer); }, []);
  return <div className="publication-loading" role="status" aria-live="polite">
    <p>{slow ? 'Está tardando un poco. Seguimos buscando las publicaciones de tu barrio…' : 'Cargando publicaciones…'}</p>
    <div className="loading-rows" aria-hidden="true">{[1,2,3].map(id => <div className="loading-row" key={id}><span/><span/><span/></div>)}</div>
  </div>;
}
