import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';

const steps = [
  { title: 'Hola, soy Manolito', image: '/manolito-barrio.png', text: 'Pide ayuda, comparte y encuentra servicios. Practiquemos sin publicar nada.' },
  { title: 'Pide una manito', image: '/manolito-ayuda.png', text: 'Cuenta qué necesitas y para cuándo. Revisa el borrador y los cupos antes de confirmar.', question: 'Necesitas una escalera prestada. ¿Qué eliges?', options: ['Pedir una manito', 'Dar una manito', 'Buscar un servicio'], answer: 0, feedback: '¡Eso es! Pides ayuda. Después decides qué respuesta aceptar.' },
  { title: 'Da una manito', image: '/manolito-ayuda.png', text: 'Ofrece tu tiempo o habilidades sin cobrar. Para compartir objetos, entra a Productos.', question: 'Puedes acompañar a un vecino con sus compras. ¿Qué eliges?', options: ['Pedir una manito', 'Dar una manito', 'Buscar un servicio'], answer: 1, feedback: '¡Bien! Cuenta cómo puedes ayudar y cuándo estás disponible.' },
  { title: 'Encuentra un servicio', image: '/manolito-barrio.png', text: 'Describe el problema. Te ayudo a buscar en las publicaciones existentes; tú revisas las valoraciones y coordinas con el prestador.', question: 'Sale agua debajo del lavadero. ¿Qué oficio buscarías?', options: ['Gasfitería', 'Clases', 'Electricidad'], answer: 0, feedback: '¡Correcto! Consulta al gasfitero. Enviar un mensaje no reserva un horario.' },
  { title: 'Tú tienes la última palabra', image: '/manolito-avatar.png', text: 'Revisa antes de publicar. Los mensajes son privados; los participantes aceptados aparecen por nombre. Coordina desde Mi actividad.', note: 'Evita publicar tu dirección exacta o documentos. En Apoyo en emergencia puedes coordinar recursos vecinales; no sustituye a los servicios de emergencia.' },
];

export default function ManolitoTutorial({ name, onClose }) {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const body = useRef(null);
  useEffect(() => { if (body.current) body.current.scrollTop = 0; }, [index]);
  const step = steps[index];
  const selected = answers[index];
  const correct = selected === step.answer;
  const ready = !step.question || correct;
  return <section className="manolito-tutorial" aria-label="Tutorial con Manolito">
    <div className="tutorial-progress"><span>Paso {index + 1} de {steps.length}</span><progress aria-label="Progreso del tutorial" value={index + 1} max={steps.length} /></div>
    <div className="tutorial-body" ref={body}>
    <img key={index} className={`tutorial-mascot ${index === 4 ? 'portrait' : ''}`} src={step.image} alt="Manolito, el cuy que te acompaña" />
    <div className="tutorial-speech" aria-live="polite">
      <h2>{step.title}</h2>
      {index === 0 && <p>¡Hola, {name}!</p>}
      <p>{step.text}</p>
      {step.note && <p className="ai-hint">{step.note}</p>}
    </div>
    {step.question && <fieldset className="tutorial-exercise"><legend>{step.question}</legend>
      {step.options.map((option, i) => <button key={option} type="button" aria-pressed={selected === i} onClick={() => setAnswers({ ...answers, [index]: i })}>{option}{selected === i && correct && <Check size={18}/>}</button>)}
      {selected !== undefined && <p role="status">{correct ? step.feedback : 'Probemos otra opción. Mira el ejemplo y vuelve a elegir.'}</p>}
    </fieldset>}
    </div><div className="tutorial-controls"><div className="tutorial-navigation">
      {index > 0 && <button className="button secondary" onClick={() => setIndex(index - 1)}><ArrowLeft size={16}/>Anterior</button>}
      <button className="button primary" disabled={!ready} onClick={() => index === steps.length - 1 ? onClose() : setIndex(index + 1)}>{index === steps.length - 1 ? 'Terminar tutorial' : 'Siguiente'}<ArrowRight size={16}/></button>
    </div>
    <button className="text-button" onClick={onClose}>Omitir tutorial</button>
    </div>
  </section>;
}
