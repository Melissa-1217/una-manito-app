import { HandHeart, Gift, Wrench, Plus } from 'lucide-react';
export default function HomeActions({ onRequest, onOffer, onServices, onPublishService }) {
  return <section className="home-compact" aria-label="Acciones del barrio">
    <h1>Publicaciones del barrio</h1>
    <div className="quick-actions intent-actions">
      <button onClick={onRequest}><HandHeart size={20} aria-hidden="true"/><span>Pedir una manito</span></button>
      <button onClick={onOffer}><Gift size={20} aria-hidden="true"/><span>Dar una manito</span></button>
      <button onClick={onServices}><Wrench size={20} aria-hidden="true"/><span>Buscar un servicio</span></button>
      <button onClick={onPublishService}><Plus size={20} aria-hidden="true"/><span>Publicar un servicio</span></button>
    </div>
  </section>;
}
