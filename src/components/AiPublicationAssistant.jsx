import { useEffect, useRef, useState } from 'react';
import { Sparkles, ArrowDown, LoaderCircle } from 'lucide-react';

const modes = {
  solicitud: {
    title: 'IA para pedir una manito',
    description: 'Describe tu necesidad. Organizamos qué ayuda buscas y qué detalles conviene completar.',
    placeholder: 'Ej.: necesito dos ayudantes para una mudanza',
    action: 'Preparar mi pedido con IA',
  },
  ofrecimiento: {
    title: 'IA para dar una manito',
    description: 'Cuéntanos qué puedes prestar, donar o hacer. Preparamos tu ofrecimiento para el barrio.',
    placeholder: 'Ej.: presto mi escalera los sábados',
    action: 'Preparar mi ofrecimiento con IA',
  },
  servicio: {
    title: 'IA para publicar mi servicio',
    description: 'Describe tu oficio y qué trabajos realizas. Te ayudamos a presentar tu servicio.',
    placeholder: 'Ej.: hago reparaciones de caños',
    action: 'Preparar mi servicio con IA',
  },
  busqueda: {
    title: 'IA para buscar un servicio',
    description: 'Cuéntanos qué problema tienes. Identificamos el oficio para buscarlo en el directorio.',
    placeholder: 'Ej.: sale agua debajo del lavadero',
    action: 'Interpretar mi búsqueda con IA',
  },
};

export default function AiPublicationAssistant({ type, text, onApply }) {
  const mode = modes[type];
  const isSearch = type === 'busqueda';

  const [proposal, setProposal] = useState(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const controller = useRef(null);
  const requestId = useRef(0);

  useEffect(() => () => controller.current?.abort(), []);

  function resetResult() {
    requestId.current += 1;
    controller.current?.abort();
    setProposal(null);
    setPending(false);
    setError('');
  }

  async function prepare() {
    resetResult();
    if (text.trim().length < 3) {
      setError('Escribe qué necesitas u ofreces. Puedes usar una frase corta.');
      return;
    }
    const currentId = requestId.current;
    controller.current = new AbortController();
    setPending(true);
    try {
      const response = await fetch('/api/prepare-publication', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.current.signal,
        body: JSON.stringify({ texto: text, tipo: type }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'No se pudo preparar la publicación.');
      if (currentId === requestId.current) setProposal(result.propuesta);
    } catch (failure) {
      if (failure.name !== 'AbortError' && currentId === requestId.current) {
        setError(failure.message === 'Failed to fetch' ? 'Revisa tu conexión o completa los campos manualmente.' : failure.message);
      }
    } finally {
      if (currentId === requestId.current) setPending(false);
    }
  }

  if (text.trim().length < 3) return null;
  return <section className="inline-manito">
    <button className="button secondary" type="button" disabled={pending} onClick={prepare}>
      {pending ? <LoaderCircle className="loading-icon" size={18} /> : <Sparkles size={18} />}
      {pending ? 'Interpretando tu mensaje…' : mode.action}
    </button>
    {error && <p className="ai-error" role="alert">{error}</p>}
    {proposal && <div className="ai-proposal" aria-live="polite">
      <span className="badge">{isSearch ? 'Búsqueda interpretada' : 'Propuesta para revisar'}</span>
      <h3>{isSearch ? proposal.interpretacion : proposal.titulo}</h3>{!isSearch && <p>{proposal.descripcion}</p>}<p>Categoría sugerida · {proposal.categoria}</p>
      {proposal.por_confirmar?.length > 0 && <div className="ai-questions"><strong>Detalles que puedes agregar</strong><ul>{proposal.por_confirmar.map((question) => <li key={question}>{question}</li>)}</ul><p>Puedes completarlos al editar la descripción.</p></div>}
      <button className="button secondary wide" type="button" onClick={() => { onApply(isSearch ? proposal : { titulo: proposal.titulo, descripcion: proposal.descripcion, categoria: proposal.categoria }); setProposal(null); }}><ArrowDown size={17} />{isSearch ? 'Buscar en los servicios publicados' : 'Usar propuesta en los campos'}</button>
    </div>}
    <small>Al usar IA, este texto se envía a Gemini.</small>
  </section>;
}
