import { availableSlots, capacityOf, confirmedParticipants } from '../lib/participation.js';
import { isActive } from '../lib/lifecycle.js';

export default function Participants({ publication, responses, people }) {
  if (publication.tipo === 'servicio') return <p className="privacy">Las consultas son privadas y no reservan un horario. Coordínalo con el prestador.</p>;
  const members = confirmedParticipants(publication, responses);
  const remaining = availableSlots(publication, responses);
  return <section className="panel" aria-label="Participantes confirmados">
    <h2>Participantes confirmados</h2>
    <p className="muted">{members.length} de {capacityOf(publication)} cupos ocupados · {!isActive(publication) ? 'Publicación inactiva' : remaining ? `${remaining} disponibles` : 'Cupos completos'}</p>
    {members.length ? <ul>{members.map(member => <li key={member.vecino_id}>{member.nombre || people[member.vecino_id] || 'Vecino'}</li>)}</ul> : <p className="muted">Aún no hay participantes.</p>}
  </section>;
}
