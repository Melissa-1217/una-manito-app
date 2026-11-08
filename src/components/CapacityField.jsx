export default function CapacityField({ type, value, onChange }) {
  if (type === 'servicio') return <p className="ai-hint">Recibes consultas privadas. El horario se acuerda con cada vecino.</p>;
  return <label>Cupos disponibles
    <input type="number" min="1" max="100" step="1" required value={value ?? 1} onChange={event => onChange(event.target.value)} />
    <small className="ai-hint">Cuántas personas puedes aceptar. Para un préstamo individual, deja 1.</small>
  </label>;
}
