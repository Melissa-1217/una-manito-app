export function capacityOf(publication) {
  if (publication.tipo === 'servicio') return null;
  const value = Number(publication.cupos ?? 1);
  return Number.isInteger(value) && value >= 1 && value <= 100 ? value : 1;
}

export function confirmedParticipants(publication, responses = []) {
  if (publication.tipo === 'servicio') return [];
  const members = new Map();
  for (const participant of publication.participantes || []) members.set(participant.vecino_id, participant);
  for (const response of responses) {
    if (response.publicacion_id === publication.id && response.estado === 'aceptado') {
      members.set(response.vecino_id, { vecino_id: response.vecino_id, nombre: response.perfiles?.nombre });
    }
  }
  return [...members.values()];
}

export function availableSlots(publication, responses = []) {
  const capacity = capacityOf(publication);
  return capacity === null ? null : Math.max(0, capacity - confirmedParticipants(publication, responses).length);
}

export function validateCapacity(draft) {
  if (draft.tipo === 'servicio') return 1;
  const value = Number(draft.cupos ?? 1);
  if (!Number.isInteger(value) || value < 1 || value > 100) throw new Error('Indica entre 1 y 100 cupos.');
  return value;
}
