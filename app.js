(()=>{'use strict';
const $=id=>document.getElementById(id),canvas=$('preview'),ctx=canvas.getContext('2d'),source=document.createElement('canvas'),sc=source.getContext('2d',{willReadFrequently:true,colorSpace:'srgb'});
let ready=false,cx=.5,cy=.5,rect,requestId=0,gesture=null;
const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
function message(text,error=false){$('message').textContent=text;$('message').classList.toggle('error',error);}
function update(){
 if(!ready)return;
 const side=Math.max(1,Math.round(Math.min(source.width,source.height)*Number($('size').value)/100));
 const x=clamp(Math.round(cx*source.width-side/2),0,source.width-side),y=clamp(Math.round(cy*source.height-side/2),0,source.height-side);
 rect={x,y,w:side,h:side};
 ctx.clearRect(0,0,canvas.width,canvas.height);ctx.drawImage(source,0,0);
 positionSelection();
 const a=PCPColor.analyze(sc.getImageData(x,y,side,side).data),e=PCPCalibration.estimate(a.intensity);
 $('rgb').textContent=a.rgb.map(v=>v.toFixed(1)).join(' / ');$('hsv').textContent=a.hsv.map((v,i)=>v===null?'—':v.toFixed(1)+(i===0?'°':'%')).join(' / ');$('lab').textContent=a.lab.map(v=>v.toFixed(1)).join(' / ');
 $('swatch').style.background=`rgb(${a.rgb.join(',')})`;
 $('intensity').textContent=a.intensity.toFixed(3);$('strength').value=a.intensity;
 $('concentration').textContent=e.value===null?'—':e.value.toFixed(2);
 $('estimate-note').textContent=e.value===null?'仮の検量線の範囲外です（外挿しません）。':'選択範囲から算出した仮の換算値';
 $('size-value').textContent=$('size').value+'%';$('dimensions').textContent=`ROI ${side} × ${side} px · ${a.count.toLocaleString()}画素 · 位置 (${x}, ${y})`;
 $('quality').textContent=a.clipped>.1?'白飛び・黒つぶれの可能性があります。露出と測定領域を確認してください。':a.std>25?'領域内の色にばらつきがあります。容器の縁や反射を避けてください。':'色解析完了。撮影条件による色の変化は補正していません。';
}
function display(image,name){
 const originalW=image.naturalWidth||image.width,originalH=image.naturalHeight||image.height;
 const scale=Math.min(1,1600/Math.max(originalW,originalH));source.width=Math.max(1,Math.round(originalW*scale));source.height=Math.max(1,Math.round(originalH*scale));
 sc.fillStyle='#fff';sc.fillRect(0,0,source.width,source.height);sc.drawImage(image,0,0,source.width,source.height);
 canvas.width=source.width;canvas.height=source.height;canvas.hidden=false;$('empty').hidden=true;$('roi-label').hidden=false;$('drop-zone').classList.add('loaded');$('roi-selection').hidden=false;$('photo-tools').hidden=false;$('size').disabled=false;$('center').disabled=false;ready=true;cx=cy=.5;
 $('image-tag').textContent=`${source.width} × ${source.height} px`;
 $('file-info').textContent=`${name} · ${scale<1?'長辺1600pxに縮小':'元の解像度で解析'}`;message('枠を動かして範囲選択 · 右下をドラッグで拡大縮小');selectTab('measure');update();
}
async function load(file){
 if(!file)return;const id=++requestId;selectTab('measure');
 if(file.size>30*1024*1024){message('画像は30MB以下にしてください。',true);return;}
 if(file.type&&!file.type.startsWith('image/')){message('画像ファイルを選んでください。',true);return;}
 message('画像を読み込んでいます…');const url=URL.createObjectURL(file),image=new Image();
 try{await new Promise((resolve,reject)=>{image.onload=resolve;image.onerror=reject;image.src=url;});if(id!==requestId)return;$('sample-label').hidden=true;display(image,file.name);}
 catch{if(id===requestId)message('画像を開けませんでした。JPEG・PNGなどに変換して再度選んでください。前の画像がある場合はその結果を保持しています。',true);}
 finally{URL.revokeObjectURL(url);}
}
['upload','camera'].forEach(id=>$(id).addEventListener('change',e=>{load(e.target.files[0]);e.target.value='';}));
$('demo').addEventListener('click',()=>{requestId++;$('sample-label').hidden=false;const c=document.createElement('canvas');c.width=1000;c.height=700;const d=c.getContext('2d');d.fillStyle='#f2f4f5';d.fillRect(0,0,1000,700);d.fillStyle='rgb(230,150,190)';d.fillRect(150,80,700,540);display(c,'サンプル画像（人工の色見本・実測試料ではありません）');});
$('size').addEventListener('input',update);$('center').addEventListener('click',()=>{cx=cy=.5;update();});
function imageBox(){const bounds=canvas.getBoundingClientRect(),stage=$('drop-zone').getBoundingClientRect();const scale=Math.min(bounds.width/source.width,bounds.height/source.height);return {scale,left:bounds.left+(bounds.width-source.width*scale)/2,top:bounds.top+(bounds.height-source.height*scale)/2,stage};}
function positionSelection(){if(!rect||$('measure').hidden)return;const b=imageBox();if(!b.scale)return;Object.assign($('roi-selection').style,{left:(b.left-b.stage.left+rect.x*b.scale)+'px',top:(b.top-b.stage.top+rect.y*b.scale)+'px',width:(rect.w*b.scale)+'px',height:(rect.h*b.scale)+'px'});}
function movePoint(e){const b=imageBox(),half=rect.w/2;cx=clamp((e.clientX-b.left)/b.scale,half,source.width-half)/source.width;cy=clamp((e.clientY-b.top)/b.scale,half,source.height-half)/source.height;update();}
function begin(e,mode){if(!ready||gesture)return;e.preventDefault();e.stopPropagation();if(mode==='move')movePoint(e);gesture={id:e.pointerId,mode,startX:e.clientX,startY:e.clientY,startSize:Number($('size').value),scale:imageBox().scale};e.currentTarget.setPointerCapture(e.pointerId);}
function motion(e){if(!gesture||gesture.id!==e.pointerId)return;if(gesture.mode==='move')movePoint(e);else{const delta=((e.clientX-gesture.startX)+(e.clientY-gesture.startY))/gesture.scale;setSize(gesture.startSize+delta/Math.min(source.width,source.height)*100);}}
function end(e){if(gesture?.id===e.pointerId)gesture=null;}
function setSize(v){$('size').value=clamp(Math.round(v),5,60);update();}
for(const el of [canvas,$('roi-selection')])el.addEventListener('pointerdown',e=>begin(e,'move'));
$('resize-roi').addEventListener('pointerdown',e=>begin(e,'resize'));
for(const el of [canvas,$('roi-selection'),$('resize-roi')]){el.addEventListener('pointermove',motion);el.addEventListener('pointerup',end);el.addEventListener('pointercancel',end);el.addEventListener('lostpointercapture',end);}
$('smaller').addEventListener('click',()=>setSize(Number($('size').value)-5));$('larger').addEventListener('click',()=>setSize(Number($('size').value)+5));
$('resize-roi').addEventListener('keydown',e=>{const delta={ArrowLeft:-1,ArrowDown:-1,ArrowRight:1,ArrowUp:1}[e.key];if(delta){e.preventDefault();e.stopPropagation();setSize(Number($('size').value)+delta);}});
canvas.addEventListener('keydown',e=>{const d={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]}[e.key];if(!ready||!d)return;e.preventDefault();const step=e.shiftKey?20:2;cx=clamp(cx+d[0]*step/source.width,0,1);cy=clamp(cy+d[1]*step/source.height,0,1);update();});
const tabs=['measure','detail','guide'];
function selectTab(id,focus=false){tabs.forEach(name=>{const active=id===name;$('tab-'+name).setAttribute('aria-selected',String(active));$('tab-'+name).tabIndex=active?0:-1;$(name).hidden=!active;});if(focus)$('tab-'+id).focus();if(id==='measure')requestAnimationFrame(positionSelection);}
tabs.forEach((id,i)=>{$('tab-'+id).addEventListener('click',()=>selectTab(id));$('tab-'+id).addEventListener('keydown',e=>{let j=e.key==='ArrowRight'?(i+1)%3:e.key==='ArrowLeft'?(i+2)%3:e.key==='Home'?0:e.key==='End'?2:null;if(j!==null){e.preventDefault();selectTab(tabs[j],true);}});});
new ResizeObserver(()=>positionSelection()).observe($('drop-zone'));
['dragenter','dragover'].forEach(type=>$('drop-zone').addEventListener(type,e=>{e.preventDefault();$('drop-zone').classList.add('dragover');}));$('drop-zone').addEventListener('dragleave',()=>$('drop-zone').classList.remove('dragover'));$('drop-zone').addEventListener('drop',e=>{e.preventDefault();$('drop-zone').classList.remove('dragover');load(e.dataTransfer.files[0]);});
})();
