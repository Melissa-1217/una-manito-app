import { Boxes, Droplets, Flame, HandHeart, Shield, TriangleAlert, Zap } from 'lucide-react';

const entries = {
  urgente: { label: 'Ayuda urgente', description: 'Pide apoyo vecinal inmediato.', color: 'red', Icon: TriangleAlert, template: 'Necesito apoyo vecinal urgente.' },
  suministros: { label: 'Préstamo de suministros', description: 'Solicita herramientas o insumos prestados.', color: 'green', Icon: Boxes, template: 'Necesito pedir suministros prestados para atender una emergencia.' },
  ofrezco: { label: 'Yo ofrezco', description: 'Comparte recursos, transporte o tiempo.', color: 'sand', Icon: HandHeart, template: 'Puedo ofrecer apoyo al barrio durante esta emergencia.', resource: true },
  centro: { label: 'Centro de auxilio vecinal', description: 'Elige el tipo de incidente.', color: 'orange', Icon: Shield },
  seguridad: { label: 'Seguridad / Delincuencia', description: 'Incidentes de seguridad en el barrio.', color: 'red', Icon: Shield, template: 'Necesito apoyo vecinal por un incidente de seguridad.' },
  incendio: { label: 'Incendio / Siniestro', description: 'Fuego, humo o daños por un siniestro.', color: 'orange', Icon: Flame, template: 'Necesito apoyo vecinal por un posible incendio o siniestro.' },
  agua: { label: 'Fuga de agua / Colapso', description: 'Fugas, aniegos o daños en la vía.', color: 'green', Icon: Droplets, template: 'Necesito apoyo vecinal por una fuga de agua o un colapso.' },
  electricidad: { label: 'Emergencia eléctrica', description: 'Cortes, chispas o cables dañados.', color: 'slate', Icon: Zap, template: 'Necesito apoyo vecinal por una emergencia eléctrica.' },
  asistente: { label: 'Asistente de emergencia', color: 'green', template: 'Necesito coordinar apoyo vecinal por una emergencia.', openAssistant: true },
};

export function getEmergencyOption(id) {
  return Object.hasOwn(entries, id) ? entries[id] : null;
}

export const isAuxilioOption = id => ['seguridad', 'incendio', 'agua', 'electricidad', 'asistente'].includes(id);
