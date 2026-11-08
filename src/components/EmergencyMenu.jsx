import { ArrowLeft, ArrowRight, Bell, Sparkles } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { getEmergencyOption } from '../lib/emergency.js';

export default function EmergencyMenu({ auxiliary = false, onSelect, onBack, onReport }) {
  const heading = useRef(null);
  useEffect(() => { heading.current?.focus(); }, [auxiliary]);
  const ids = auxiliary ? ['seguridad', 'incendio', 'agua', 'electricidad'] : ['urgente', 'suministros', 'ofrezco', 'centro'];
  return <section className="emergency-menu" aria-labelledby="emergency-menu-title">
    {auxiliary && <button className="text-button" onClick={onBack}><ArrowLeft size={17} aria-hidden="true"/>Volver a emergencias</button>}
    <h1 ref={heading} id="emergency-menu-title" tabIndex={-1}>{auxiliary ? 'Centro de auxilio vecinal' : 'Apoyo en emergencia'}</h1>
    <p>{auxiliary ? 'Selecciona el tipo de incidente para preparar tu pedido.' : 'Coordina apoyo con tus vecinos según lo que necesites.'}</p>
    <div className="emergency-options" role="group" aria-label={auxiliary ? 'Tipos de incidente' : 'Opciones de emergencia'}>
      {ids.map(id => {
        const { label, description, color, Icon } = getEmergencyOption(id);
        return <button key={id} className="emergency-tile" data-tone={color} onClick={() => onSelect(id)} aria-label={label} aria-describedby={`emergency-description-${id}`}>
          <Icon size={22} aria-hidden="true"/>
          <span><strong>{label}</strong><span id={`emergency-description-${id}`}>{description}</span></span>
          <ArrowRight size={18} aria-hidden="true"/>
        </button>;
      })}
    </div>
    <div className="emergency-actions">
      {auxiliary && <button className="button primary" onClick={() => onSelect('asistente')}><Sparkles size={17} aria-hidden="true"/>Asistente de emergencia</button>}
      <button className="button secondary" onClick={onReport}><Bell size={17} aria-hidden="true"/>Avisar al barrio</button>
    </div>
  </section>;
}
