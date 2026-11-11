(()=>{'use strict';
const $=id=>document.getElementById(id),canvas=$('preview'),ctx=canvas.getContext('2d'),source=document.createElement('canvas'),sc=source.getContext('2d',{willReadFrequently:true,colorSpace:'srgb'});
let ready=false,cx=.5,cy=.5,rect,requestId=0,gesture=null,photo=null,candidates=[],selected=-1;
const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
function message(text,error=false){$('message').textContent=text;$('message').classList.toggle('error',error);}
function update(){
 if(!ready)return;
 if(!rect){const side=Math.max(3,Math.round(Math.min(source.width,source.height)*Number($('size').value)/100));
 const x=clamp(Math.round(cx*source.width-side/2),0,source.width-side),y=clamp(Math.round(cy*source.height-side/2),0,source.height-side);rect={x,y,w:side,h:side};}
 const {x,y,w:side}=rect;
 ctx.clearRect(0,0,canvas.width,canvas.height);ctx.drawImage(source,0,0);
 positionSelection();
 const a=PCPColor.analyze(sc.getImageData(x,y,side,side).data),sample=PCPLiquid.sample(photo,rect);
 if(sample.rgb){a.rgb=sample.rgb;a.hsv=PCPColor.hsv(a.rgb);a.lab=PCPColor.lab(a.rgb);a.intensity=Math.max(0,((a.rgb[0]+a.rgb[2])/2-a.rgb[1])/255);}
 const e=sample.valid?PCPCalibration.estimate(a.rgb):{value:null,status:'poor-region',distance:null};
 $('rgb').textContent=a.rgb.map(v=>v.toFixed(1)).join(' / ');$('hsv').textContent=a.hsv.map((v,i)=>v===null?'—':v.toFixed(1)+(i===0?'°':'%')).join(' / ');$('lab').textContent=a.lab.map(v=>v.toFixed(1)).join(' / ');
 $('swatch').style.background=`rgb(${a.rgb.join(',')})`;
 $('intensity').textContent=a.intensity.toFixed(3);$('strength').value=a.intensity;
 $('concentration').textContent=e.value===null?'—':e.value.toFixed(2);
 const interval=e.value===null?'':`${PCPCalibration.config.references[e.lowerIndex].value.toFixed(2)}〜${PCPCalibration.config.references[e.upperIndex].value.toFixed(2)}`;
 $('estimate-note').textContent=e.status==='poor-region'?sample.reason:e.status==='outside-reference'?'基準範囲（0.2〜2.0 ppm）の外です。外挿しません。':e.value===null?'基準写真の色から離れているため推定できません。':`3点の基準写真から推定 · ${interval} ppmの間`;
 $('reference-distance').textContent=e.distance===null?'—':e.distance.toFixed(1);
 $('reference-note').textContent=e.value===null?'参考値を表示できません。照明・撮影範囲を確認してください。':`${interval} ppmの基準写真間を補間した参考値です。表示の小数桁は測定精度を示しません。`;
 document.querySelectorAll('.reference-item').forEach((el,i)=>{const lower=e.value!==null&&i===e.lowerIndex&&e.fraction<1-1e-9,upper=e.value!==null&&i===e.upperIndex&&e.fraction>1e-9;el.classList.toggle('is-match',lower||upper);el.querySelector('.match-label').textContent=lower?(e.fraction<1e-9?'基準色':'下側'):upper?(e.fraction>1-1e-9?'基準色':'上側'):'';});
 $('size-value').textContent=(rect.w/Math.min(source.width,source.height)*100).toFixed(1)+'%';$('dimensions').textContent=`ROI ${side} × ${side} px · ${a.count.toLocaleString()}画素 · 位置 (${x}, ${y})`;
 $('quality').textContent=sample.reason||(sample.saturated>.05?'一部の色成分が飽和しています。基準写真への当てはめ値で、濃度精度は未検証です。':sample.count<100?'小さい画像領域からの推定です。元の写真での再確認を推奨します。':'3点の基準写真に対応づけた参考値です。撮影条件をそろえてください。');
 $('measurement-quality').textContent=$('quality').textContent;
}
function display(image,name){
 const originalW=image.naturalWidth||image.width,originalH=image.naturalHeight||image.height;
 const scale=Math.min(1,1600/Math.max(originalW,originalH));source.width=Math.max(1,Math.round(originalW*scale));source.height=Math.max(1,Math.round(originalH*scale));
 sc.fillStyle='#fff';sc.fillRect(0,0,source.width,source.height);sc.drawImage(image,0,0,source.width,source.height);
 canvas.width=source.width;canvas.height=source.height;canvas.hidden=false;$('empty').hidden=true;$('roi-label').hidden=false;$('drop-zone').classList.add('loaded');$('roi-selection').hidden=false;$('photo-tools').hidden=false;$('size').disabled=false;$('center').disabled=false;ready=true;cx=cy=.5;rect=null;photo=sc.getImageData(0,0,source.width,source.height);
 $('image-tag').textContent=`${source.width} × ${source.height} px`;
 $('file-info').textContent=`${name} · ${scale<1?'長辺1600pxに縮小':'元の解像度で解析'}`;message('枠を動かして範囲選択 · 右下をドラッグで拡大縮小');selectTab('measure');detectLiquid();
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
const referenceList=$('reference-list');
PCPCalibration.config.references.forEach(ref=>{const item=document.createElement('div');item.className='reference-item';const chip=document.createElement('div');chip.className='reference-chip';chip.style.background=`rgb(${ref.rgb.join(',')})`;const label=document.createElement('strong');label.textContent=ref.value.toFixed(2);const match=document.createElement('span');match.className='match-label';item.append(chip,label,match);referenceList.append(item);const row=document.createElement('tr');[ref.value.toFixed(2),...ref.rgb].forEach(v=>{const cell=document.createElement('td');cell.textContent=String(v);row.append(cell);});$('reference-rgb-body').append(row);});
$('demo').addEventListener('click',()=>{requestId++;const c=document.createElement('canvas');c.width=1000;c.height=700;const d=c.getContext('2d');d.fillStyle='#eee';d.fillRect(0,0,1000,700);d.fillStyle=`rgb(${PCPCalibration.config.references[1].rgb.join(',')})`;d.fillRect(420,200,160,340);display(c,'0.60 ppm基準のRGBを使った動作確認用画像');$('sample-label').hidden=false;});
function chooseCandidate(i){selected=i;rect={...candidates[i].roi};cx=(rect.x+rect.w/2)/source.width;cy=(rect.y+rect.h/2)/source.height;$('size').value=rect.w/Math.min(source.width,source.height)*100;document.querySelectorAll('#liquid-candidates button').forEach((b,j)=>b.setAttribute('aria-pressed',String(i===j)));update();}
function detectLiquid(){
 candidates=PCPLiquid.detect(photo);$('liquid-candidates').replaceChildren();
 candidates.forEach((c,i)=>{const b=document.createElement('button');b.textContent=`試料 ${i+1}`;b.type='button';b.setAttribute('aria-pressed','false');b.addEventListener('click',()=>chooseCandidate(i));$('liquid-candidates').append(b);});
 if(candidates.length){chooseCandidate(0);message(`${candidates.length}個の液体候補を検出。試料は左から順です。枠が液体に合っているか確認してください。`);}else{selected=-1;rect=null;update();message('液体候補を検出できません。枠を液体の均一な部分へ移動してください。');}
}
$('redetect').addEventListener('click',()=>{if(ready)detectLiquid();});
function manualUpdate(){rect=null;document.querySelectorAll('#liquid-candidates button').forEach(b=>b.setAttribute('aria-pressed','false'));update();}
$('size').addEventListener('input',manualUpdate);$('center').addEventListener('click',()=>{cx=cy=.5;manualUpdate();});
function imageBox(){const bounds=canvas.getBoundingClientRect(),stage=$('drop-zone').getBoundingClientRect();const scale=Math.min(bounds.width/source.width,bounds.height/source.height);return {scale,left:bounds.left+(bounds.width-source.width*scale)/2,top:bounds.top+(bounds.height-source.height*scale)/2,stage};}
function positionSelection(){if(!rect||$('measure').hidden)return;const b=imageBox();if(!b.scale)return;Object.assign($('roi-selection').style,{left:(b.left-b.stage.left+rect.x*b.scale)+'px',top:(b.top-b.stage.top+rect.y*b.scale)+'px',width:(rect.w*b.scale)+'px',height:(rect.h*b.scale)+'px'});}
function movePoint(e){const b=imageBox(),half=rect.w/2;cx=clamp((e.clientX-b.left)/b.scale,half,source.width-half)/source.width;cy=clamp((e.clientY-b.top)/b.scale,half,source.height-half)/source.height;manualUpdate();}
function begin(e,mode){if(!ready||gesture)return;e.preventDefault();e.stopPropagation();if(mode==='move')movePoint(e);gesture={id:e.pointerId,mode,startX:e.clientX,startY:e.clientY,startSize:Number($('size').value),scale:imageBox().scale};e.currentTarget.setPointerCapture(e.pointerId);}
function motion(e){if(!gesture||gesture.id!==e.pointerId)return;if(gesture.mode==='move')movePoint(e);else{const delta=((e.clientX-gesture.startX)+(e.clientY-gesture.startY))/gesture.scale;setSize(gesture.startSize+delta/Math.min(source.width,source.height)*100);}}
function end(e){if(gesture?.id===e.pointerId)gesture=null;}
function setSize(v){$('size').value=clamp(v,1,60);manualUpdate();}
for(const el of [canvas,$('roi-selection')])el.addEventListener('pointerdown',e=>begin(e,'move'));
$('resize-roi').addEventListener('pointerdown',e=>begin(e,'resize'));
for(const el of [canvas,$('roi-selection'),$('resize-roi')]){el.addEventListener('pointermove',motion);el.addEventListener('pointerup',end);el.addEventListener('pointercancel',end);el.addEventListener('lostpointercapture',end);}
$('smaller').addEventListener('click',()=>setSize(Number($('size').value)-5));$('larger').addEventListener('click',()=>setSize(Number($('size').value)+5));
$('resize-roi').addEventListener('keydown',e=>{const delta={ArrowLeft:-1,ArrowDown:-1,ArrowRight:1,ArrowUp:1}[e.key];if(delta){e.preventDefault();e.stopPropagation();setSize(Number($('size').value)+delta);}});
canvas.addEventListener('keydown',e=>{const d={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]}[e.key];if(!ready||!d)return;e.preventDefault();const step=e.shiftKey?20:2;cx=clamp(cx+d[0]*step/source.width,0,1);cy=clamp(cy+d[1]*step/source.height,0,1);manualUpdate();});
const tabs=['measure','detail','guide'];
function selectTab(id,focus=false){tabs.forEach(name=>{const active=id===name;$('tab-'+name).setAttribute('aria-selected',String(active));$('tab-'+name).tabIndex=active?0:-1;$(name).hidden=!active;});if(focus)$('tab-'+id).focus();if(id==='measure')requestAnimationFrame(positionSelection);}
tabs.forEach((id,i)=>{$('tab-'+id).addEventListener('click',()=>selectTab(id));$('tab-'+id).addEventListener('keydown',e=>{let j=e.key==='ArrowRight'?(i+1)%3:e.key==='ArrowLeft'?(i+2)%3:e.key==='Home'?0:e.key==='End'?2:null;if(j!==null){e.preventDefault();selectTab(tabs[j],true);}});});
new ResizeObserver(()=>positionSelection()).observe($('drop-zone'));
['dragenter','dragover'].forEach(type=>$('drop-zone').addEventListener(type,e=>{e.preventDefault();$('drop-zone').classList.add('dragover');}));$('drop-zone').addEventListener('dragleave',()=>$('drop-zone').classList.remove('dragover'));$('drop-zone').addEventListener('drop',e=>{e.preventDefault();$('drop-zone').classList.remove('dragover');load(e.dataTransfer.files[0]);});
})();

