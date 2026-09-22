(()=>{'use strict';
const $=id=>document.getElementById(id),canvas=$('preview'),ctx=canvas.getContext('2d'),source=document.createElement('canvas'),sc=source.getContext('2d',{willReadFrequently:true,colorSpace:'srgb'});
let ready=false,cx=.5,cy=.5,rect,requestId=0,dragging=false;
const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
function message(text,error=false){$('message').textContent=text;$('message').classList.toggle('error',error);}
function update(){
 if(!ready)return;
 const side=Math.max(1,Math.round(Math.min(source.width,source.height)*Number($('size').value)/100));
 const x=clamp(Math.round(cx*source.width-side/2),0,source.width-side),y=clamp(Math.round(cy*source.height-side/2),0,source.height-side);
 rect={x,y,w:side,h:side};
 ctx.clearRect(0,0,canvas.width,canvas.height);ctx.drawImage(source,0,0);
 ctx.fillStyle='rgba(9,30,38,.30)';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(source,x,y,side,side,x,y,side,side);
 const stroke=Math.max(2,canvas.width/240);ctx.strokeStyle='#fff';ctx.lineWidth=stroke;ctx.strokeRect(x,y,side,side);ctx.strokeStyle='#146572';ctx.lineWidth=stroke/2;ctx.strokeRect(x+stroke,y+stroke,Math.max(0,side-2*stroke),Math.max(0,side-2*stroke));
 const a=PCPColor.analyze(sc.getImageData(x,y,side,side).data),e=PCPCalibration.estimate(a.intensity);
 $('rgb').textContent=a.rgb.map(v=>v.toFixed(1)).join(' / ');$('hsv').textContent=a.hsv.map((v,i)=>v===null?'—':v.toFixed(1)+(i===0?'°':'%')).join(' / ');$('lab').textContent=a.lab.map(v=>v.toFixed(1)).join(' / ');
 $('swatch').style.background=`rgb(${a.rgb.join(',')})`;['r','g','b'].forEach((v,i)=>$('bar-'+v).style.flexBasis=(a.rgb[i]/255*33.333)+'%');
 $('intensity').textContent=a.intensity.toFixed(3);$('strength').value=a.intensity;
 $('concentration').textContent=e.value===null?'—':e.value.toFixed(2);
 $('estimate-note').textContent=e.value===null?'仮の検量線の範囲外です（外挿しません）。':'仮の検量線による参考表示・実測濃度ではありません。';
 $('scale-marker').style.display=e.value===null?'none':'block';if(e.value!==null)$('scale-marker').style.left=(e.value/2*100)+'%';
 $('size-value').textContent=$('size').value+'%';$('dimensions').textContent=`ROI ${side} × ${side} px · ${a.count.toLocaleString()}画素 · 位置 (${x}, ${y})`;
 $('quality').textContent=a.clipped>.1?'白飛び・黒つぶれの可能性があります。露出と測定領域を確認してください。':a.std>25?'領域内の色にばらつきがあります。容器の縁や反射を避けてください。':'色解析完了。撮影条件による色の変化は補正していません。';
}
function display(image,name){
 const originalW=image.naturalWidth||image.width,originalH=image.naturalHeight||image.height;
 const scale=Math.min(1,1600/Math.max(originalW,originalH));source.width=Math.max(1,Math.round(originalW*scale));source.height=Math.max(1,Math.round(originalH*scale));
 sc.fillStyle='#fff';sc.fillRect(0,0,source.width,source.height);sc.drawImage(image,0,0,source.width,source.height);
 canvas.width=source.width;canvas.height=source.height;canvas.hidden=false;$('empty').hidden=true;$('roi-label').hidden=false;$('drop-zone').classList.add('loaded');$('size').disabled=false;$('center').disabled=false;ready=true;cx=cy=.5;
 $('image-tag').textContent=`${source.width} × ${source.height} px`;
 message(`${name} · ${scale<1?'長辺1600pxに縮小して解析。':'元の解像度で解析。'}画像は端末内のみで処理します。`);update();
}
async function load(file){
 if(!file)return;const id=++requestId;
 if(file.size>30*1024*1024){message('画像は30MB以下にしてください。',true);return;}
 if(file.type&&!file.type.startsWith('image/')){message('画像ファイルを選んでください。',true);return;}
 message('画像を読み込んでいます…');const url=URL.createObjectURL(file),image=new Image();
 try{await new Promise((resolve,reject)=>{image.onload=resolve;image.onerror=reject;image.src=url;});if(id!==requestId)return;display(image,file.name);}
 catch{if(id===requestId)message('画像を開けませんでした。JPEG・PNGなどに変換して再度選んでください。前の画像がある場合はその結果を保持しています。',true);}
 finally{URL.revokeObjectURL(url);}
}
['upload','camera'].forEach(id=>$(id).addEventListener('change',e=>{load(e.target.files[0]);e.target.value='';}));
$('demo').addEventListener('click',()=>{requestId++;const c=document.createElement('canvas');c.width=1000;c.height=700;const d=c.getContext('2d');d.fillStyle='#f2f4f5';d.fillRect(0,0,1000,700);d.fillStyle='rgb(230,150,190)';d.fillRect(150,80,700,540);display(c,'サンプル画像（人工の色見本・実測試料ではありません）');});
$('size').addEventListener('input',update);$('center').addEventListener('click',()=>{cx=cy=.5;update();});
function point(e){const r=canvas.getBoundingClientRect();/* object-fit: contain can letterbox tall images */const scale=Math.min(r.width/canvas.width,r.height/canvas.height),w=canvas.width*scale,h=canvas.height*scale;cx=clamp((e.clientX-r.left-(r.width-w)/2)/w,0,1);cy=clamp((e.clientY-r.top-(r.height-h)/2)/h,0,1);update();}
canvas.addEventListener('pointerdown',e=>{if(!ready)return;dragging=true;canvas.setPointerCapture(e.pointerId);point(e);});canvas.addEventListener('pointermove',e=>{if(dragging)point(e);});canvas.addEventListener('pointerup',()=>dragging=false);canvas.addEventListener('pointercancel',()=>dragging=false);
canvas.addEventListener('keydown',e=>{const d={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]}[e.key];if(!ready||!d)return;e.preventDefault();const step=e.shiftKey?20:2;cx=clamp(cx+d[0]*step/source.width,0,1);cy=clamp(cy+d[1]*step/source.height,0,1);update();});
['dragenter','dragover'].forEach(type=>$('drop-zone').addEventListener(type,e=>{e.preventDefault();$('drop-zone').classList.add('dragover');}));$('drop-zone').addEventListener('dragleave',()=>$('drop-zone').classList.remove('dragover'));$('drop-zone').addEventListener('drop',e=>{e.preventDefault();$('drop-zone').classList.remove('dragover');load(e.dataTransfer.files[0]);});
})();
