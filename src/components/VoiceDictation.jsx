import { useEffect, useRef, useState } from 'react';
import { Mic, Square } from 'lucide-react';

const failures = {
  'not-allowed': 'No se permitió usar el micrófono. Puedes escribir o revisar los permisos del navegador.',
  'service-not-allowed': 'El navegador no permite el servicio de voz. Puedes escribir tu mensaje.',
  'no-speech': 'No se detectó voz. Puedes intentarlo otra vez o escribir.',
  'audio-capture': 'No encontramos un micrófono disponible. Puedes escribir.',
  network: 'No se pudo conectar al servicio de voz. Revisa tu conexión o escribe.',
  'language-not-supported': 'El servicio no admite el idioma seleccionado. Puedes escribir.',
};

export default function VoiceDictation({ onTranscript, onListeningChange, disabled = false, maxLength = 2000 }) {
  const recognition = useRef(null);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState('');
  const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  useEffect(() => () => {
    const instance = recognition.current;
    recognition.current = null;
    if (instance) { instance.onresult = null; instance.onerror = null; instance.onend = null; instance.onstart = null; instance.abort(); }
    onListeningChange?.(false);
  }, [onListeningChange]);

  function start() {
    if (!Recognition || disabled || recognition.current) return;
    setError(''); setTranscript('');
    const instance = new Recognition();
    recognition.current = instance;
    instance.lang = 'es-PE';
    instance.continuous = false;
    instance.interimResults = true;
    instance.maxAlternatives = 1;
    instance.onresult = event => {
      if (recognition.current !== instance) return;
      const text = Array.from(event.results).map(result => result[0].transcript).join(' ').trim();
      if (text.length > maxLength) {
        setError(`El dictado supera ${maxLength} caracteres. Acorta el texto antes de usarlo.`);
      }
      setTranscript(text);
    };
    instance.onerror = event => {
      if (recognition.current !== instance) return;
      setError(failures[event.error] || 'No se pudo completar el dictado. Puedes volver a intentarlo o escribir.');
      setListening(false); onListeningChange?.(false);
      recognition.current = null;
      instance.abort();
    };
    instance.onend = () => {
      if (recognition.current !== instance) return;
      recognition.current = null;
      setListening(false); onListeningChange?.(false);
    };
    try {
      setListening(true); onListeningChange?.(true);
      instance.start();
    } catch {
      recognition.current = null;
      setListening(false); onListeningChange?.(false);
      setError('No se pudo iniciar el micrófono. Puedes escribir tu mensaje.');
    }
  }

  function discard() {
    const instance = recognition.current;
    recognition.current = null;
    if (instance) instance.abort();
    setListening(false); onListeningChange?.(false);
    setTranscript(''); setError('');
  }

  if (!Recognition) return <small className="voice-unavailable">Este navegador no admite dictado por voz. Puedes escribir.</small>;
  return <section className="voice-dictation" aria-label="Dictado por voz">
    <button className="text-button" type="button" disabled={disabled} aria-pressed={listening} onClick={() => {
      if (!listening) start();
      else { try { recognition.current?.stop(); } catch { discard(); } }
    }}>{listening ? <Square size={17}/> : <Mic size={17}/>} {listening ? 'Detener dictado' : 'Dictar por voz'}</button>
    <small>El navegador puede enviar el audio a su servicio de voz. Tú revisas el texto antes de usarlo.</small>
    {listening && <p role="status">Escuchando… Habla con calma y pulsa detener al terminar.</p>}
    {transcript && <div className="voice-review">
      <label>Revisa el dictado<textarea disabled={listening || disabled} value={transcript} onChange={event => setTranscript(event.target.value)} /></label>
      <div><button type="button" className="button secondary" disabled={listening || disabled || !transcript.trim() || transcript.length > maxLength} onClick={() => {
        if (onTranscript(transcript.trim()) !== false) { setTranscript(''); setError(''); }
      }}>Usar este texto</button><button type="button" className="text-button" disabled={disabled} onClick={discard}>Descartar dictado</button></div>
    </div>}
    {error && <p role="alert">{error}</p>}
  </section>;
}
