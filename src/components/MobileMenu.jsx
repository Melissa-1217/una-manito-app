import { useEffect, useRef } from 'react';
import { AlertTriangle, CircleHelp, X, MapPin, ChevronRight, LogOut, HandHeart } from 'lucide-react';

export default function MobileMenu({ items, view, name, neighborhood, onNavigate, onClose, onTutorial, onExit, exitLabel, onWelcome }) {
  const dialog = useRef(null);
  const close = useRef(null);
  useEffect(() => {
    const node = dialog.current;
    const previous = document.activeElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    node.showModal();
    close.current?.focus();
    return () => { node.close(); document.body.style.overflow = overflow; if (previous instanceof HTMLElement && previous.isConnected) previous.focus(); };
  }, []);
  return <dialog id="mobile-menu" ref={dialog} className="app-menu" aria-labelledby="app-menu-title" onCancel={event => { event.preventDefault(); onClose(); }} onClick={event => {
    const rect = event.currentTarget.getBoundingClientRect();
    if (event.target === event.currentTarget && (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom)) onClose();
  }}>
    <header><h2 id="app-menu-title">Menú</h2><button ref={close} aria-label="Cerrar menú" onClick={onClose}><X size={23}/></button></header>
    <div className="menu-profile"><span className="avatar">{name?.[0]}</span><div><strong>{name}</strong><span><MapPin size={14} aria-hidden="true"/>{neighborhood}</span></div></div>
    <nav aria-label="Navegación móvil">{items.map(({ id, label, icon: Icon }) => <button key={id} aria-current={view === id ? 'page' : undefined} onClick={() => onNavigate(id)}><span className="menu-icon"><Icon size={23} aria-hidden="true"/></span><strong>{label}</strong><ChevronRight size={18} aria-hidden="true"/></button>)}
      <button className="menu-emergency" aria-current={view === 'emergencia' ? 'page' : undefined} onClick={() => onNavigate('emergencia')}><span className="menu-icon"><AlertTriangle size={23} aria-hidden="true"/></span><strong>Apoyo en emergencia</strong><ChevronRight size={18} aria-hidden="true"/></button>
    </nav>
    <section className="menu-help" aria-label="Ayuda para usar Una Manito"><h3>Te damos una manito</h3><button onClick={onWelcome}><HandHeart size={20} aria-hidden="true"/>Ver bienvenida<ChevronRight size={17} aria-hidden="true"/></button><button onClick={onTutorial}><CircleHelp size={20} aria-hidden="true"/>Cómo usar la app<ChevronRight size={17} aria-hidden="true"/></button></section>
    <button className="menu-exit" onClick={onExit}><LogOut size={19} aria-hidden="true"/>{exitLabel}</button>
  </dialog>;
}
