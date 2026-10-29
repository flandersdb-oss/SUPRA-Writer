/* SUPRA Office local-first application-shell registration. MIT. */
(()=>{
 'use strict';
 if(!('serviceWorker' in navigator)||!['https:','http:'].includes(location.protocol))return;
 const base=new URL('../',document.currentScript.src);
 const sw=new URL('sw.js',base);
 window.addEventListener('load',()=>{
  navigator.serviceWorker.register(sw.href,{scope:base.pathname}).catch(err=>{
   console.warn('Offline shell installation is optional:',err);
  });
 });
})();