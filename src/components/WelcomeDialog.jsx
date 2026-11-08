import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

export default function WelcomeDialog({ name, onClose, onTutorial }) {
  const ref = useRef(null);
  const enter = useRef(null);
  useEffect(() => {
    const node = ref.current;
    const previous = document.activeElement;
    node.showModal();
    enter.current?.focus();
    return () => { node.close(); if (previous instanceof HTMLElement && previous.isConnected) previous.focus(); };
  }, []);
  return <dialog ref={ref} className="welcome-dialog" aria-labelledby="welcome-title" aria-describedby="welcome-description" onCancel={event => { event.preventDefault(); onClose(); }}>
    <button className="welcome-close" aria-label="Cerrar bienvenida" onClick={onClose}><X size={21}/></button>
    <img src="/manolito-avatar.png" alt="" width="88" height="88"/>
    <h2 id="welcome-title">¡Hola, {name}!</h2>
    <p id="welcome-description">Soy Manolito. Aquí puedes pedir ayuda, compartir lo que tienes y encontrar servicios cerca de casa.</p>
    <p className="welcome-slogan">Entre vecinos, nos damos una manito.</p>
    <button ref={enter} className="button primary wide" onClick={onClose}>Ver las manitos</button>
    <button className="text-button" onClick={onTutorial}>Ver tutorial</button>
  </dialog>;
}
