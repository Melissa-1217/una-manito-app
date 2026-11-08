export default function DetailGuidance({ publication, own, response }) {
  if (['resuelta','cancelada','vencida'].includes(publication.estado)) return null;
  const service = publication.tipo === 'servicio';
  let text;
  if (response) text = response.estado === 'aceptado'
    ? 'Tu respuesta fue aceptada. Puedes revisar tu mensaje y el estado en Mi actividad.'
    : response.estado === 'rechazado' ? 'Esta respuesta no fue aceptada. Puedes explorar otras publicaciones de tu barrio.'
    : service ? 'Tu consulta está enviada. Falta que el prestador acepte la coordinación; todavía no hay un horario reservado.' : 'Tu respuesta está enviada. El autor debe aceptarla para confirmar tu participación.';
  else if (own) text = publication.estado === 'en_coordinacion'
    ? 'Ya aceptaste una respuesta. Marca como resuelta cuando termine la ayuda o la atención.'
    : 'Tu publicación está visible. Revisa aquí los mensajes de tus vecinos y elige con quién coordinar.';
  else text = service ? 'Revisa el perfil y las experiencias antes de solicitar el servicio. El horario se acuerda con el prestador.' : 'Lee el pedido y responde si puedes dar una manito. La participación se confirma cuando el autor te acepta.';
  return <p className="detail-guidance">{text}</p>;
}
