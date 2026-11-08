import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';

const fadeTime = 280;
const readingTime = 5000 - fadeTime;

export default function WelcomeDialog({ name, autoDismiss, onClose, onTutorial }) {
  const ref = useRef(null);
  const enter = useRef(null);
  const [paused, setPaused] = useState(false);
  const [closing, setClosing] = useState(false);
  useEffect(() => {
    const node = ref.current;
    const previous = document.activeElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    node.showModal();
    enter.current?.focus({ preventScroll: true });
    return () => {
      node.close();
      document.body.style.overflow = overflow;
      if (previous instanceof HTMLElement && previous.isConnected) previous.focus();
    };
  }, []);
  useEffect(() => {
    if (!autoDismiss || paused || closing) return;
    const timer = window.setTimeout(() => setClosing(true), readingTime);
    return () => window.clearTimeout(timer);
  }, [autoDismiss, paused, closing]);
  useEffect(() => {
    if (!closing) return;
    const delay = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : fadeTime;
    const timer = window.setTimeout(onClose, delay);
    return () => window.clearTimeout(timer);
  }, [closing, onClose]);

  return <dialog ref={ref} className="welcome-dialog" data-closing={closing} style={{ '--welcome-fade': `${fadeTime}ms` }} aria-labelledby="welcome-title" aria-describedby="welcome-description" onCancel={event => { event.preventDefault(); setClosing(true); }}>
    <button className="welcome-close" aria-label="Cerrar bienvenida" onClick={() => setClosing(true)}><X size={21} aria-hidden="true"/></button>
    <div className="welcome-content">
      <img src="/manolito-avatar.png" alt="" width="192" height="192"/>
      <h2 id="welcome-title">¡Hola, {name}!</h2>
      <p id="welcome-description">Soy Manolito. Aquí puedes pedir ayuda, compartir lo que tienes y encontrar servicios cerca de casa.</p>
      <p className="welcome-slogan">Entre vecinos, nos damos una manito.</p>
      <button ref={enter} className="button primary" onClick={() => setClosing(true)}>Ver las manitos</button>
      <div className="welcome-actions">
        <button className="text-button" onClick={onTutorial}>Ver tutorial</button>
        {autoDismiss && <button className="text-button" aria-pressed={paused} onClick={() => setPaused(value => !value)}>Mantener abierta</button>}
      </div>
    </div>
  </dialog>;
}
