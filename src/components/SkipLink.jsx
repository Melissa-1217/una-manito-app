export default function SkipLink() {
  return <a className="skip-link" href="#contenido" onClick={event => {
    event.preventDefault();
    document.getElementById('contenido')?.focus();
  }}>Saltar al contenido</a>;
}
