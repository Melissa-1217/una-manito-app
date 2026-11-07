import { useEffect, useState } from 'react';

// Keep the saved spelling so neighbors select the same community identifier.
export default function NeighborhoodField({ client, value, onChange }) {
  const [choices, setChoices] = useState(['Barrio Demo']);
  const [custom, setCustom] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const { data, error } = await client.from('perfiles').select('barrio');
        if (error || !Array.isArray(data)) throw new Error('catalog');
        if (active) setChoices([...new Set(['Barrio Demo', ...data.map(p => p.barrio?.trim()).filter(Boolean)])].sort((a, b) => a.localeCompare(b, 'es')));
      } catch {
        if (active) setError(true);
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => { active = false; };
  }, [client]);

  const options = [...new Set([...choices, ...(value ? [value] : [])])];
  return <>
    <label>Barrio o sector
      <select required value={custom ? '__other' : value} onChange={event => {
        const other = event.target.value === '__other';
        setCustom(other);
        onChange(other ? '' : event.target.value);
      }}>
        <option value="" disabled>Selecciona tu barrio</option>
        {options.map(option => <option key={option} value={option}>{option}</option>)}
        <option value="__other">Mi barrio no está en la lista</option>
      </select>
    </label>
    {loading && <p className="ai-hint" role="status">Cargando barrios…</p>}
    {error && <p className="ai-hint" role="status">No pudimos cargar todos los barrios. Puedes escribir el tuyo.</p>}
    {custom && <label>Nombre de tu barrio<input required minLength={2} maxLength={120} value={value} onChange={event => onChange(event.target.value)} placeholder="Ej.: San Miguel · Parque Media Luna" /></label>}
    <p className="ai-hint">Elige el mismo nombre que tus vecinos. No incluyas tu dirección exacta.</p>
  </>;
}
