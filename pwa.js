(()=>{'use strict';
const status=document.getElementById('offline-status'),retry=document.getElementById('retry-offline'),install=document.getElementById('install-app'),panel=document.getElementById('update-panel');
let registration,installPrompt,ready=false,reloading=false,applying=false;
function paint(){status.textContent=ready?(navigator.onLine?'オフライン準備完了 · ネット接続あり':'オフラインで利用中 · 写真の解析ができます'):'オフライン利用の準備中…';}
function fail(){ready=false;status.textContent='オフライン準備が完了していません。オンラインでページを開き直して、再確認してください。';retry.hidden=false;}
async function check(){
 const worker=navigator.serviceWorker.controller;if(!worker)return;
 const channel=new MessageChannel();
 const result=await new Promise(resolve=>{const timeout=setTimeout(()=>{channel.port1.close();resolve(false);},5000);channel.port1.onmessage=e=>{clearTimeout(timeout);channel.port1.close();resolve(e.data?.ready===true);};worker.postMessage({type:'CHECK_READY'},[channel.port2]);});
 ready=result;retry.hidden=result;if(result)paint();else fail();
}
async function showUpdate(){
 const current=await navigator.serviceWorker.getRegistration();
 if(current?.waiting){panel.hidden=false;return;}
 // 'installed' can fire before registration.waiting has been assigned.
 if(registration?.installing?.state==='installed')setTimeout(showUpdate,250);
}
function watch(worker){if(!worker)return;worker.addEventListener('statechange',()=>{if(worker.state==='installed'){showUpdate();setTimeout(showUpdate,500);}if(worker.state==='redundant'&&!ready)fail();});}

async function start(){
 if(!('serviceWorker' in navigator)||!window.isSecureContext){status.textContent='オフライン保存にはHTTPSの公開URLをSafariまたはChromeで開いてください。';return;}
 try{
  registration=await navigator.serviceWorker.register('./sw.js',{scope:'./',updateViaCache:'none'});
  showUpdate();
  watch(registration.installing);registration.addEventListener('updatefound',()=>watch(registration.installing));setTimeout(showUpdate,1000);setTimeout(showUpdate,3000);
  // Do not claim readiness until every required asset is in the active cache.
  navigator.serviceWorker.ready.then(()=>check());
  if(navigator.serviceWorker.controller)await check();
  setTimeout(()=>{if(!ready)fail();},20000);
 }catch{fail();}
}
if('serviceWorker' in navigator)navigator.serviceWorker.addEventListener('controllerchange',()=>{if(applying&&!reloading){reloading=true;location.reload();}else check();});
document.getElementById('apply-update').addEventListener('click',async event=>{
 const button=event.currentTarget;button.disabled=true;
 try{for(let i=0;i<50;i++){const current=await navigator.serviceWorker.getRegistration();if(current?.waiting){applying=true;current.waiting.postMessage({type:'APPLY_UPDATE'});return;}await new Promise(resolve=>setTimeout(resolve,100));}
 status.textContent='更新準備中です。少し待ってからもう一度更新してください。';}finally{button.disabled=false;}
});
retry.addEventListener('click',()=>location.reload());
window.addEventListener('online',()=>{paint();registration?.update().catch(()=>{});});window.addEventListener('offline',paint);
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();installPrompt=e;install.hidden=false;});
install.addEventListener('click',async()=>{if(!installPrompt)return;await installPrompt.prompt();await installPrompt.userChoice;installPrompt=null;install.hidden=true;});
window.addEventListener('appinstalled',()=>{install.hidden=true;installPrompt=null;});
start();
})();
