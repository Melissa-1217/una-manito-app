export default function DetailGuidance({ publication, own, response }) {
  if (['resuelta','cancelada','vencida'].includes(publication.estado)) return null;
  const service = publication.tipo === 'servicio';
  let text;
  if (response) text = response.estado === 'aceptado'
    ? 'Tu respuesta fue aceptada. Abre Conversar para acordar los detalles con tu vecino.'
    : response.estado === 'rechazado' ? 'Esta respuesta no fue aceptada. Puedes explorar otras publicaciones de tu barrio.'
    : service ? 'Tu consulta está enviada. Puedes conversar con el prestador para acordar los detalles; todavía no hay un horario reservado.' : 'Tu respuesta está enviada. Puedes conversar con el autor; tu participación se confirma cuando te acepta.';
  else if (own) text = publication.estado === 'en_coordinacion'
    ? 'Abre Conversar para acordar los detalles. Marca como resuelta cuando termine la ayuda o la atención.'
    : 'Tu publicación está visible. Revisa aquí los mensajes de tus vecinos y elige con quién coordinar.';
  else text = service ? 'Revisa el perfil y las experiencias antes de solicitar el servicio. El horario se acuerda con el prestador.' : 'Lee el pedido y responde si puedes dar una manito. La participación se confirma cuando el autor te acepta.';
  return <p className="detail-guidance">{text}</p>;
}
