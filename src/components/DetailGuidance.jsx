export default function DetailGuidance({ publication, own, response }) {
  if (['resuelta','cancelada','vencida'].includes(publication.estado)) return null;
  const service = publication.tipo === 'servicio';
  let text;
  if (response) text = response.estado === 'aceptado'
    ? 'Ayuda aceptada. Abre Conversar para coordinar.'
    : response.estado === 'rechazado' ? 'Tu respuesta no fue aceptada. Explora otras publicaciones.'
    : service ? 'Consulta enviada. Abre Conversar para acordar un horario.' : 'Respuesta enviada. Participas cuando el autor te acepta.';
  else if (own) text = publication.estado === 'en_coordinacion'
    ? 'Coordina en Conversar y marca como resuelta al terminar.'
    : 'Revisa las respuestas y elige con quién coordinar.';
  else text = service ? 'Revisa el perfil y consulta al prestador.' : 'Responde para coordinar. Participas cuando el autor te acepta.';
  return <p className="detail-guidance">{text}</p>;
}
