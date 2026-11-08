import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

export default function SidePanel({ id, title, closeLabel, onClose, children }) {
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
  return <dialog id={id} ref={dialog} className="app-menu" aria-labelledby={id + "-title"} onCancel={event => { event.preventDefault(); onClose(); }} onClick={event => {
    const rect = event.currentTarget.getBoundingClientRect();
    if (event.target === event.currentTarget && (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom)) onClose();
  }}>
    <header>
      <h2 id={id + "-title"}>{title}</h2>
      <button ref={close} aria-label={closeLabel} onClick={onClose}><X size={23} aria-hidden="true"/></button>
    </header>
    {children}
  </dialog>;
}
