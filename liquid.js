/* Image-only liquid detection and robust sampling. No filename/hash matching. */
(function(root){
'use strict';
const median=v=>{v=v.slice().sort((a,b)=>a-b);const m=Math.floor(v.length/2);return v.length%2?v[m]:(v[m-1]+v[m])/2;};
function sample(im,r){
 const all=[],valid=[];
 for(let y=Math.max(0,Math.ceil(r.y));y<Math.min(im.height,Math.floor(r.y+r.h));y++)for(let x=Math.max(0,Math.ceil(r.x));x<Math.min(im.width,Math.floor(r.x+r.w));x++){
 const k=(y*im.width+x)*4,p=Array.from(im.data.slice(k,k+3));all.push(p);if(Math.min(...p)<250&&Math.max(...p)>20)valid.push(p);
 }
 if(valid.length<9)return {valid:false,count:valid.length,reason:'液体領域が小さすぎるか、反射・暗部が多すぎます。'};
 const rgb=[0,1,2].map(i=>median(valid.map(p=>p[i]))),spread=median(valid.map(p=>Math.hypot(...p.map((v,i)=>v-rgb[i]))));
 const clipped=1-valid.length/all.length;
 return {valid:clipped<.25&&spread<35,rgb,saturated:valid.filter(p=>Math.max(...p)>=254).length/valid.length,count:valid.length,spread,clipped,reason:clipped>=.25?'反射・暗部が多すぎます。':spread>=35?'色むらが大きいため、液体の均一な部分を選んでください。':''};
}
function detect(im,relaxed=false){
 const {width:w,height:h,data}=im,seen=new Uint8Array(w*h),out=[];
 const pink=i=>{const k=i*4,r=data[k],g=data[k+1],b=data[k+2];return r-g>(relaxed?12:18)&&b-g>(relaxed?3:8)&&r>b*.9&&r>65;};
 for(let i=0;i<w*h;i++){
 if(seen[i])continue;seen[i]=1;if(!pink(i))continue;
 const q=[i];let x0=w,y0=h,x1=0,y1=0;
 for(let j=0;j<q.length;j++){const p=q[j],x=p%w,y=Math.floor(p/w);x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);
 for(const z of [x? p-1:-1,x<w-1?p+1:-1,y?p-w:-1,y<h-1?p+w:-1])if(z>=0&&!seen[z]){seen[z]=1;if(pink(z))q.push(z);}}
 const bw=x1-x0+1,bh=y1-y0+1,ratio=bh/bw;
 if(q.length<Math.max(14,w*h*.00015)||ratio<1.35||ratio>4||bh<h*.09||bw>w*.3||q.length/(bw*bh)<.4)continue;
 // Search within the upper liquid body so reflections on the table are excluded.
 const side=Math.max(3,Math.floor(bw*.3));let best=null;
 for(const fx of [.25,.35,.45,.55])for(const fy of [.2,.3,.4,.5]){
 const roi={x:Math.round(x0+bw*fx),y:Math.round(y0+Math.min(bh,bw*1.6)*fy),w:side,h:side};
 const s=sample(im,roi);if(!s.valid||s.rgb[0]-s.rgb[1]<12||s.rgb[2]-s.rgb[1]<3||Math.max(...s.rgb)<150)continue;
 const score=s.spread+s.clipped*80+s.saturated*20;
 if(!best||score<best.score)best={bounds:{x:x0,y:y0,w:bw,h:bh},roi,sample:s,score};
 }
 if(best)out.push(best);
 }
 return out.length?out.sort((a,b)=>a.bounds.x-b.bounds.x):relaxed?[]:detect(im,true);
}
root.PCPLiquid={sample,detect};
if(typeof module!=='undefined')module.exports=root.PCPLiquid;
})(globalThis);
