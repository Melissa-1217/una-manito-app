import { useEffect, useRef, useState } from 'react';
import { Sparkles, ArrowDown, LoaderCircle } from 'lucide-react';

export default function AiPublicationAssistant({ type, onApply }) {
  const [text, setText] = useState('');
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
    if (text.trim().length < 10) {
      setError('Cuéntanos un poco más. Escribe al menos 10 caracteres.');
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

  return <section className="ai-assistant" aria-labelledby="assistant-title">
    <div className="ai-heading"><Sparkles size={22} /><h2 id="assistant-title">Cuéntanos qué necesitas</h2></div>
    <p>La IA te ayuda a preparar tu publicación. Tú revisas y decides qué compartir.</p>
    <label htmlFor="ai-message">Escribe con tus propias palabras</label>
    <textarea id="ai-message" maxLength={2000} value={text} onChange={(event) => { resetResult(); setText(event.target.value); }} placeholder="Veci, necesito una escalera para esta tarde. La devuelvo hoy mismo." aria-describedby="ai-privacy" />
    <p id="ai-privacy" className="ai-hint">El mensaje se envía a Gemini para organizarlo. Evita incluir tu dirección exacta, DNI o teléfono.</p>
    <button className="button primary wide" type="button" disabled={pending} onClick={prepare}>
      {pending ? <LoaderCircle className="loading-icon" size={18} /> : <Sparkles size={18} />}
      {pending ? 'Preparando tu propuesta…' : 'Preparar con IA'}
    </button>
    {error && <p className="ai-error" role="alert">{error}</p>}
    {proposal && <div className="ai-proposal" aria-live="polite">
      <span className="badge">Propuesta para revisar</span>
      <h3>{proposal.titulo}</h3><p>{proposal.descripcion}</p><p>Categoría sugerida · {proposal.categoria}</p>
      <button className="button secondary wide" type="button" onClick={() => { onApply(proposal); setProposal(null); }}><ArrowDown size={17} />Usar propuesta en los campos</button>
    </div>}
    <p className="ai-hint">También puedes completar directamente los campos de abajo.</p>
  </section>;
}
