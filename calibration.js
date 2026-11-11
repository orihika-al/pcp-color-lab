/* User-assigned liquid photo references, 2026-11-11.
 * Source: 443 x 110 composite, left/centre/right = 0.2/0.6/2.0 ppm.
 * Liquid ROIs are auto-detected; component-wise medians exclude white/black clipping.
 * Some red-channel pixels saturate. This is a 3-point image fit, not independently
 * validated chemical calibration. Photos are not embedded or uploaded.
 */
(function(root){'use strict';
 const config=Object.freeze({id:'dpd-liquid-3point-20261111',calibrated:false,method:'normalized-sRGB-piecewise-projection',maxRGBDistance:12,references:Object.freeze([{"value": 0.2, "rgb": [243, 185, 207], "roi": {"x": 69, "y": 72, "w": 5, "h": 5}, "saturated": 0}, {"value": 0.6, "rgb": [255, 154, 201], "roi": {"x": 225, "y": 78, "w": 5, "h": 5}, "saturated": 0.84}, {"value": 2, "rgb": [254, 119, 169], "roi": {"x": 369, "y": 70, "w": 5, "h": 5}, "saturated": 0.56}].map(p=>Object.freeze({...p,rgb:Object.freeze(p.rgb),roi:Object.freeze(p.roi)})))});
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
