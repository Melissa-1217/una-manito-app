import { Shield, Flame, Droplets, Zap, Check } from 'lucide-react';

export const emergencyTopics = [
 {id:'seguridad',label:'Seguridad',detail:'Incidente en el barrio',Icon:Shield,tone:'sand'},
 {id:'incendio',label:'Incendio o siniestro',detail:'Apoyo frente a un siniestro',Icon:Flame,tone:'orange'},
 {id:'agua',label:'Fuga de agua o aniego',detail:'Apoyo por agua o daños en la vía',Icon:Droplets,tone:'green'},
 {id:'electricidad',label:'Incidente eléctrico',detail:'Apoyo por un corte o daño eléctrico',Icon:Zap,tone:'slate'},
];

// Adaptado de posibles-cambios: los tipos son opcionales dentro del mismo formulario.
export default function EmergencyTopics({value,onChange,disabled}) {
 return <details className="emergency-topic-picker"><summary>Elegir tipo de incidente · opcional</summary><div className="emergency-topic-grid" role="group" aria-label="Tipo de incidente">{emergencyTopics.map(({id,label,detail,Icon,tone})=><button key={id} type="button" className="emergency-topic" data-tone={tone} aria-pressed={value===id} disabled={disabled} onClick={()=>onChange(value===id?null:id)}><Icon size={22} aria-hidden="true"/><span><strong>{label}</strong><small>{detail}</small></span>{value===id&&<Check size={17} aria-hidden="true"/>}</button>)}</div><p className="ai-hint">Describe el apoyo que necesitas u ofreces. Esta selección no envía una alerta ni contacta a servicios de emergencia.</p></details>;
}
