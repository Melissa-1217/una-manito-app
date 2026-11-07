export default function CapacityField({ type, value, onChange }) {
  if (type === 'servicio') return <p className="ai-hint">Puedes recibir varias consultas. La atención y el horario se acuerdan con cada vecino; enviar una consulta no reserva el servicio.</p>;
  return <label>Cupos disponibles
    <input type="number" min="1" max="100" step="1" required value={value ?? 1} onChange={event => onChange(event.target.value)} />
    <small className="ai-hint">Personas que puedes aceptar en esta publicación. Para un préstamo individual, deja 1.</small>
  </label>;
}
