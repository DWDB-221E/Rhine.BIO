let installPrompt;
const installButton = document.querySelector('#install');
window.addEventListener('beforeinstallprompt', event => {
  event.preventDefault();
  installPrompt = event;
  installButton.hidden = false;
});
installButton.addEventListener('click', async () => {
  if (!installPrompt) return;
  const prompt = installPrompt;
  installPrompt = null;
  installButton.hidden = true;
  await prompt.prompt();
});
window.addEventListener('appinstalled', () => { installButton.hidden = true; installPrompt = null; });
const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
if (isIOS && !navigator.standalone) document.querySelector('#ios-install').hidden = false;

if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('__BASE__sw.js', { scope: '__BASE__' }).catch(() => {});
  });
}
