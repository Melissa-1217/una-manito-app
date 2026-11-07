export function registerSW({ onNeedRefresh, onRegisterError } = {}) {
  let registration;
  let reloadRequested = false;
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return async () => {};
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (reloadRequested) { reloadRequested = false; window.location.reload(); }
  });
  const ready = navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' }).then(value => {
    registration = value;
    if (value.waiting) onNeedRefresh?.();
    value.addEventListener('updatefound', () => {
      const worker = value.installing;
      worker?.addEventListener('statechange', () => {
        if (worker.state === 'installed' && navigator.serviceWorker.controller) onNeedRefresh?.();
      });
    });
  }).catch(() => { if (navigator.onLine) onRegisterError?.(); });
  return async () => {
    await ready;
    if (!registration?.waiting) return;
    reloadRequested = true;
    registration.waiting.postMessage({ type: 'SKIP_WAITING' });
  };
}
