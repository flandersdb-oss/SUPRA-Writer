/* SUPRA Writer install and offline entrypoint (MIT) */
(() => {
  'use strict';
  // Both browser and Windows Electron renderers load this shared, offline-only feature.
  const quickActionsScript=document.createElement('script');
  quickActionsScript.src='./quick-actions.js';
  quickActionsScript.async=false;
  document.head.appendChild(quickActionsScript);
  if (location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js', {scope:'./'}).catch(error => console.warn('Optional offline installation unavailable:',error)));
    }
  }
  let installPrompt = null;
  const button = document.getElementById('installBtn');
  if (!button) return;
  window.addEventListener('beforeinstallprompt', event => {
    event.preventDefault();
    installPrompt = event;
    button.title = 'Install SUPRA Writer on this device';
  });
  window.addEventListener('appinstalled', () => {
    installPrompt = null;
    button.hidden = true;
  });
  if (window.matchMedia('(display-mode: standalone)').matches) button.hidden = true;
  button.addEventListener('click', async () => {
    if (installPrompt) {
      const prompt = installPrompt;
      installPrompt = null;
      await prompt.prompt();
    } else {
      window.alert('To install SUPRA Writer: in Chrome or Edge, open the browser menu and choose Install app. On iPhone or iPad, use Share → Add to Home Screen. Alternatively, choose Get app to download the offline HTML file.');
    }
  });
})();
