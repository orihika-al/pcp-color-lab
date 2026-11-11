/* User-assigned ORIGINAL liquid photo references, 2026-11-11.
 * IMG_3868.JPG = 0.2 ppm, IMG_3867.JPG = 0.6 ppm, IMG_3866.JPG = 2.0 ppm.
 * 4032x3024 originals decoded by browser, resized to 1600x1200 sRGB canvas.
 * RGB is the component median of auto-detected liquid ROI, not a filename match.
 * Replaces the previous 443x110 montage references. Not independently validated.
 */
(function(root){'use strict';
 const config=Object.freeze({id:'dpd-original-liquid-3point-20261111',calibrated:false,method:'normalized-sRGB-piecewise-projection',maxRGBDistance:12,references:Object.freeze([{"value": 0.2, "rgb": [223, 183, 190], "roi": {"x": 693, "y": 741, "w": 73, "h": 73}, "saturated": 0, "source": "IMG_3868.JPG"}, {"value": 0.6, "rgb": [231, 134, 168], "roi": {"x": 707, "y": 649, "w": 118, "h": 118}, "saturated": 0.012640045963803505, "source": "IMG_3867.JPG"}, {"value": 2.0, "rgb": [246, 100, 118], "roi": {"x": 717, "y": 669, "w": 101, "h": 101}, "saturated": 0.12783060484266248, "source": "IMG_3866.JPG"}].map(p=>Object.freeze({...p,rgb:Object.freeze(p.rgb),roi:Object.freeze(p.roi)})))});
 const feature=rgb=>rgb.map(v=>v/Math.max(...rgb)*255);
 function estimate(rgb,model=config){
  const invalid={value:null,status:'invalid',distance:null};
  const valid=p=>Array.isArray(p)&&p.length===3&&p.every(v=>Number.isFinite(v)&&v>=0&&v<=255)&&Math.max(...p)>20;
  if(!valid(rgb)||!model||!Array.isArray(model.references)||model.references.length<2||!Number.isFinite(model.maxRGBDistance))return invalid;
  const refs=model.references;if(refs.some((p,i)=>!valid(p.rgb)||!Number.isFinite(p.value)||(i&&p.value<=refs[i-1].value)))return invalid;
  const q=feature(rgb);let best=null;
  for(let i=0;i<refs.length-1;i++){
   const a=feature(refs[i].rgb),b=feature(refs[i+1].rgb),d=b.map((v,k)=>v-a[k]),norm=d.reduce((s,v)=>s+v*v,0);if(norm<1e-9)return invalid;
   const raw=d.reduce((s,v,k)=>s+v*(q[k]-a[k]),0)/norm,t=Math.max(0,Math.min(1,raw)),fit=a.map((v,k)=>v+t*d[k]),distance=Math.hypot(...q.map((v,k)=>v-fit[k]));
   if(!best||distance<best.distance)best={distance,raw,fraction:t,lowerIndex:i,upperIndex:i+1,value:refs[i].value+t*(refs[i+1].value-refs[i].value)};
  }
  if(best.distance>model.maxRGBDistance)return {...best,value:null,status:'color-mismatch'};
  if((best.lowerIndex===0&&best.raw< -1e-9)||(best.upperIndex===refs.length-1&&best.raw>1+1e-9))return {...best,value:null,status:'outside-reference'};
  return {...best,status:'photo-reference'};
 }
 root.PCPCalibration={config,estimate,feature};
 if(typeof module!=='undefined')module.exports=root.PCPCalibration;
})(globalThis);
