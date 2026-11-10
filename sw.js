/* Bump VERSION whenever ANY app-shell asset changes. Only app files are cached;
   login pages, user photos and arbitrary requests must never enter this cache. */
const VERSION='pcp-github-v4';
const CACHE='pcp-color-lab-'+VERSION;
const BASE=new URL('./',self.location.href);
const FILES=['./','style.css','color.js','calibration.js','app.js','pwa.js','favicon.svg','manifest.webmanifest','icons/icon-192.png','icons/icon-512.png','icons/apple-touch-icon.png'];
const URLS=FILES.map(p=>new URL(p,BASE).href);
self.addEventListener('install',event=>event.waitUntil((async()=>{
 const entries=await Promise.all(URLS.map(async url=>{
  const response=await fetch(new Request(url,{cache:'reload',credentials:'same-origin',redirect:'error'}));
  if(!response.ok||response.type==='opaque')throw new Error('App file unavailable');
  const type=response.headers.get('content-type')||'';
  if(url===BASE.href){if(!type.includes('text/html')||!(await response.clone().text()).includes('<meta name="pcp-shell" content="'+VERSION+'">'))throw new Error('Not the app shell');}
  else if(type.includes('text/html'))throw new Error('Login page is not an app asset');
  return [url,response];
 }));
 const cache=await caches.open(CACHE);
 try{await Promise.all(entries.map(([url,response])=>cache.put(url,response)));}
 catch(e){await caches.delete(CACHE);throw e;}
})()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{
 await Promise.all((await caches.keys()).filter(k=>k.startsWith('pcp-color-lab-')&&k!==CACHE).map(k=>caches.delete(k)));
 await self.clients.claim();
})()));
self.addEventListener('message',event=>{
 if(event.data?.type==='APPLY_UPDATE')event.waitUntil(self.skipWaiting());
 if(event.data?.type==='CHECK_READY')event.waitUntil((async()=>{
  const cache=await caches.open(CACHE);
  const complete=(await Promise.all(URLS.map(url=>cache.match(url)))).every(Boolean);
  event.ports[0]?.postMessage({ready:complete,version:VERSION});
 })());
});
self.addEventListener('fetch',event=>{
 const request=event.request,url=new URL(request.url);
 if(request.method!=='GET'||url.origin!==BASE.origin)return;
 let key=url.href;
 // Never substitute the shell for authentication or other routes.
 if(request.mode==='navigate'&&(url.pathname===BASE.pathname||url.pathname===new URL('index.html',BASE).pathname))key=BASE.href;
 if(!URLS.includes(key))return;
 event.respondWith((async()=>{const hit=await (await caches.open(CACHE)).match(key);return hit||fetch(request);})());
});
