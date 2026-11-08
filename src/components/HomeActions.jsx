import { ArrowRight, HandHeart, Gift, Wrench } from 'lucide-react';

export default function HomeActions({ name, onRequest, onOffer, onServices, onPublishService, onChat }) {
  return <section className="home-intro">
    <div className="home-welcome"><h1>Hola, {name}</h1><p className="brand-promise">Entre vecinos, nos damos una <strong>manito.</strong></p><p className="home-purpose">Encuentra un servicio, pide ayuda o comparte lo que puedes cerca de casa.</p></div>
    <div className="home-actions" aria-label="¿Qué quieres hacer hoy?">
      <button className="home-action request-action" aria-labelledby="home-request-title" aria-describedby="home-request-description" onClick={onRequest}><span className="home-action-icon"><HandHeart aria-hidden="true" size={25}/></span><span className="home-action-copy"><strong id="home-request-title">Pedir una manito</strong><small id="home-request-description">Cuéntale al barrio qué necesitas.</small></span><ArrowRight aria-hidden="true" size={19}/></button>
      <button className="home-action" aria-labelledby="home-offer-title" aria-describedby="home-offer-description" onClick={onOffer}><span className="home-action-icon peach"><Gift aria-hidden="true" size={25}/></span><span className="home-action-copy"><strong id="home-offer-title">Ofrece una manito</strong><small id="home-offer-description">Presta, comparte o ayuda con tu tiempo.</small></span><ArrowRight aria-hidden="true" size={19}/></button>
      <button className="home-action" aria-labelledby="home-services-title" aria-describedby="home-services-description" onClick={onServices}><span className="home-action-icon sand"><Wrench aria-hidden="true" size={25}/></span><span className="home-action-copy"><strong id="home-services-title">Busca un servicio</strong><small id="home-services-description">Encuentra oficios y revisa sus experiencias.</small></span><ArrowRight aria-hidden="true" size={19}/></button>
    </div>
    <div className="home-support"><div className="home-provider"><span>¿Tienes un oficio para ofrecer?</span><button className="text-button" onClick={onPublishService}>Publicar mi servicio<ArrowRight size={16} aria-hidden="true"/></button></div><button className="manito-launch" aria-label="Chat con Manolito" onClick={onChat}><img src="/manolito-avatar.png" alt=""/><span><strong>Chat con Manolito</strong><small>Cuéntaselo con tus palabras</small></span></button></div>
  </section>;
}
