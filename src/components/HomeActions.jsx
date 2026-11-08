import { HandHeart, Gift, Wrench, MessageCircle } from 'lucide-react';
export default function HomeActions({ onRequest, onOffer, onServices, onPublishService, onChat }) {
  return <section className="home-compact" aria-label="Acciones del barrio">
    <h1>Publicaciones del barrio</h1>
    <div className="quick-actions">
      <button onClick={onRequest}><HandHeart size={20} aria-hidden="true"/><span>Pedir una manito</span></button>
      <button onClick={onOffer}><Gift size={20} aria-hidden="true"/><span>Ofrece una manito</span></button>
      <button onClick={onServices}><Wrench size={20} aria-hidden="true"/><span>Busca un servicio</span></button>
    </div>
    <div className="home-shortcuts"><button className="text-button" onClick={onChat}><MessageCircle size={17} aria-hidden="true"/>Chat con Manolito</button><button className="text-button" onClick={onPublishService}>Publicar mi servicio</button></div>
  </section>;
}
