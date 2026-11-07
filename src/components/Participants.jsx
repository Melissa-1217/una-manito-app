import { availableSlots, capacityOf, confirmedParticipants } from '../lib/participation.js';

export default function Participants({ publication, responses, people }) {
  if (publication.tipo === 'servicio') return <p className="privacy">Enviar una consulta no reserva el servicio. Acuerda la atención y el horario directamente con el prestador. Las consultas son privadas.</p>;
  const members = confirmedParticipants(publication, responses);
  const remaining = availableSlots(publication, responses);
  return <section className="panel" aria-label="Participantes confirmados">
    <h2>Participantes confirmados</h2>
    <p className="muted">{members.length} de {capacityOf(publication)} cupos ocupados · {remaining ? `${remaining} disponibles` : 'Cupos completos'}</p>
    {members.length ? <ul>{members.map(member => <li key={member.vecino_id}>{member.nombre || people[member.vecino_id] || 'Vecino'}</li>)}</ul> : <p className="muted">Todavía no hay participantes aceptados.</p>}
  </section>;
}
