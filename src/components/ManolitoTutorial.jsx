import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, HandHeart, Package, Wrench, ShieldCheck, Bell, Sparkles, Volume2, VolumeX } from 'lucide-react';

const steps = [
 {title:'Hola, soy Manolito',topic:'Empezar',icon:HandHeart,image:'/manolito-barrio.png',text:'Aquí nos damos una manito entre vecinos. Elige un tema o practica paso a paso, sin publicar nada.',route:'Chat con Manolito → Cómo usar la app'},
 {title:'Pide una manito',topic:'Pedir ayuda',icon:HandHeart,image:'/manolito-ayuda.png',text:'Cuenta qué necesitas y para cuándo. Revisa el pedido antes de publicarlo.',route:'Menú → Pedir una manito',question:'Necesitas una escalera prestada. ¿Qué eliges?',options:['Pedir una manito','Ofrecer una manito','Buscar un servicio'],answer:0,feedback:'¡Eso es! Después revisas las respuestas y eliges a quién aceptar.'},
 {title:'Da una manito',topic:'Dar ayuda',icon:HandHeart,image:'/manolito-ayuda.png',text:'Ofrece tu tiempo o una habilidad sin cobrar. Indica cuándo puedes ayudar.',route:'Menú → Ofrecer una manito',question:'Puedes acompañar a un vecino con sus compras. ¿Qué eliges?',options:['Pedir una manito','Ofrecer una manito','Buscar un servicio'],answer:1,feedback:'¡Bien! Ayuda solidaria para acompañar, enseñar o colaborar. Los objetos van en Productos.'},
 {title:'Encuentra un servicio',topic:'Servicios',icon:Wrench,image:'/manolito-barrio.png',text:'Busca un oficio, revisa el perfil y consulta por privado. ¿Tú brindas un servicio? Usa Publicar un servicio.',route:'Menú → Buscar un servicio → Publicar un servicio',question:'Sale agua debajo del lavadero. ¿Qué oficio buscarías?',options:['Gasfitería','Clases','Electricidad'],answer:0,feedback:'¡Correcto! Consulta al gasfitero. Enviar un mensaje no reserva un horario.'},
 {title:'Comparte lo que tienes',topic:'Productos',icon:Package,image:'/manolito-ayuda.png',text:'Comparte objetos como préstamo, donación o intercambio. Acuerda la entrega y, si corresponde, la devolución.',route:'Publicaciones recientes → Productos → Compartir producto',question:'Prestas tu taladro y esperas que te lo devuelvan. ¿Qué modalidad eliges?',options:['Préstamo','Donación','Intercambio'],answer:0,feedback:'¡Exacto! Deja clara la fecha de devolución en la conversación privada.'},
 {title:'Apoyo y avisos son diferentes',topic:'Emergencias',icon:Bell,image:'/manolito-barrio.png',text:'Ayuda urgente, Préstamo de suministros y Yo ofrezco sirven para coordinar apoyo vecinal. Avisar al barrio envía un reporte a revisión humana.',route:'Menú → Apoyo en emergencia',question:'¿Cuándo ve el barrio un reporte de incidente?',options:['Cuando un revisor lo aprueba','Apenas subes una foto','Cuando la IA lo clasifica'],answer:0,feedback:'¡Eso es! La IA orienta; no confirma la verdad. Los avisos se ven dentro de la app, no son alertas oficiales.',note:'Ante peligro inmediato, contacta a los servicios de emergencia del Directorio de apoyo.'},
 {title:'Conoce con quién coordinas',topic:'Confianza',icon:ShieldCheck,image:'/manolito-avatar.png',text:'Revisa el perfil, las estrellas y los comentarios. El Visto Bueno reúne recomendaciones positivas; no garantiza seguridad.',route:'Publicación → Perfil del vecino',question:'Terminó una ayuda o servicio que coordinaste. ¿Qué corresponde?',options:['Valorar tu experiencia con estrellas y comentario','Calificar sin haber participado','Publicar los datos personales del vecino'],answer:0,feedback:'¡Bien! Una opinión honesta ayuda al barrio. Coordina por privado y comparte solo los datos necesarios.'},
 {title:'Tú tienes la última palabra',topic:'IA y privacidad',icon:Sparkles,image:'/manolito-avatar.png',text:'Manolito prepara un borrador o ayuda a buscar servicios existentes. Tú revisas, corriges y confirmas; también puedes hacerlo sin IA.',route:'Cabecera → Chat con Manolito',note:'Mi actividad reúne tus publicaciones y coordinaciones. Los mensajes son privados; los participantes aceptados aparecen por nombre. Evita direcciones exactas y documentos.'},
];

export default function ManolitoTutorial({name,onClose}) {
 const [index,setIndex]=useState(0),[answers,setAnswers]=useState({}),[speaking,setSpeaking]=useState(false);
 const body=useRef(null),heading=useRef(null),utterance=useRef(null),feedback=useRef(null);
 const step=steps[index],selected=answers[index],correct=selected===step.answer,ready=!step.question||correct;
 const canSpeak=typeof window.speechSynthesis!=='undefined'&&typeof window.SpeechSynthesisUtterance!=='undefined';
 useEffect(()=>{
  if(body.current)body.current.scrollTop=0;
  return()=>{if(utterance.current){window.speechSynthesis?.cancel();utterance.current=null;}};
 },[index]);
 function go(next){if(utterance.current)window.speechSynthesis?.cancel();setSpeaking(false);setIndex(next);requestAnimationFrame(()=>heading.current?.focus({preventScroll:true}));}
 function readStep(){
  if(speaking){window.speechSynthesis.cancel();setSpeaking(false);return;}
  const speech=new SpeechSynthesisUtterance([step.title,step.text,step.question,...(step.options||[]),step.note].filter(Boolean).join('. '));
  speech.lang='es-PE';speech.rate=0.92;speech.onend=()=>setSpeaking(false);speech.onerror=()=>setSpeaking(false);utterance.current=speech;
  window.speechSynthesis.speak(speech);setSpeaking(true);
 }
 const Icon=step.icon;
 return <section className="manolito-tutorial" aria-label="Tutorial con Manolito">
  <div className="tutorial-progress"><span>Paso {index+1} de {steps.length}</span><progress aria-label="Progreso del tutorial" value={index+1} max={steps.length}/></div>
  <details className="tutorial-topics"><summary>Elegir un tema</summary><nav aria-label="Temas de la guía">{steps.map((item,i)=><button key={item.topic} aria-current={i===index?'step':undefined} onClick={event=>{event.currentTarget.closest('details').open=false;go(i);}}>{item.topic}{answers[i]===item.answer&&item.question&&<Check size={14} aria-label="Práctica completada"/>}</button>)}</nav></details>
  <div className="tutorial-body" ref={body}>
   <div className="tutorial-scene"><div className="tutorial-scene-orbit" aria-hidden="true"/><img key={step.image} className={`tutorial-mascot ${step.image.includes('avatar')?'portrait':''}`} src={step.image} alt="" width="280" height="155"/><span className="tutorial-scene-label"><Icon size={16} aria-hidden="true"/>{step.topic}</span></div>
   <div className="tutorial-speech"><h2 ref={heading} tabIndex={-1}>{step.title}</h2>{index===0&&<p>¡Hola, {name}!</p>}<p>{step.text}</p><p className="tutorial-route"><span>Dónde lo encuentras</span>{step.route}</p>{step.note&&<p className="ai-hint">{step.note}</p>}</div>
   {index===0&&<div className="tutorial-start-note"><ShieldCheck size={17} aria-hidden="true"/><span>Práctica segura: las respuestas de esta guía no crean publicaciones.</span></div>}
   {step.question&&<fieldset className="tutorial-exercise"><legend>{step.question}</legend>{step.options.map((option,i)=><button key={option} type="button" aria-pressed={selected===i} onClick={()=>{setAnswers({...answers,[index]:i});requestAnimationFrame(()=>feedback.current?.scrollIntoView({block:'nearest'}));}}>{option}{selected===i&&correct&&<Check size={18} aria-hidden="true"/>}</button>)}{selected!==undefined&&<p ref={feedback} className={correct?'tutorial-feedback success':'tutorial-feedback'} role="status">{correct?step.feedback:'Probemos otra opción. Mira el ejemplo y vuelve a elegir.'}</p>}</fieldset>}
  </div>
  <div className="tutorial-controls"><div className="tutorial-navigation">{index>0&&<button className="button secondary" onClick={()=>go(index-1)}><ArrowLeft size={16}/>Anterior</button>}<button className="button primary" disabled={!ready} onClick={()=>index===steps.length-1?onClose():go(index+1)}>{index===steps.length-1?'Terminar tutorial':'Siguiente'}<ArrowRight size={16}/></button></div><div className="tutorial-utilities">{canSpeak&&<button className="text-button" aria-pressed={speaking} onClick={readStep}>{speaking?<VolumeX size={17}/>:<Volume2 size={17}/>} {speaking?'Detener lectura':'Escuchar este paso'}</button>}<button className="text-button" onClick={onClose}>Omitir tutorial</button></div></div>
 </section>;
}
