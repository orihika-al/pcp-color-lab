/* Image-derived references, NOT a chemical calibration.
 * Source: user-supplied 725x352 DPD chart, received 2026-11-10.
 * RGB = mode of each 50x100px interior crop (no text/borders).
 * Crop centers x=100,215,335,450,565; y=130..229.
 * All 5000 pixels per crop had the listed RGB in the supplied PNG.
 * Values describe the supplied digital image, not certified liquid standards.
 */
(function(root){
  const config=Object.freeze({
    id:'dpd-image-rgb-interpolation-v1',calibrated:false,method:'piecewise-linear-sRGB-projection',
    // Euclidean RGB distance (0..255/channel); heuristic, not validated accuracy.
    maxRGBDistance:30,
    references:Object.freeze([
      {value:0.05,rgb:[254,237,242]},
      {value:0.20,rgb:[250,213,230]},
      {value:0.50,rgb:[241,171,201]},
      {value:1.00,rgb:[236,122,170]},
      {value:2.00,rgb:[230,87,149]}
    ].map(p=>Object.freeze({...p,rgb:Object.freeze(p.rgb)})))
  });
  function estimate(rgb,model=config){
    const invalid={value:null,status:'invalid',distance:null};
    const validRGB=p=>Array.isArray(p)&&p.length===3&&p.every(v=>Number.isFinite(v)&&v>=0&&v<=255);
    const refs=model?.references;
    if(!validRGB(rgb)||!Array.isArray(refs)||refs.length<2||!Number.isFinite(model.maxRGBDistance)||model.maxRGBDistance<0)return invalid;
    if(refs.some((p,i)=>!validRGB(p.rgb)||!Number.isFinite(p.value)||(i>0&&p.value<=refs[i-1].value)))return invalid;
    let best=null;
    for(let i=0;i<refs.length-1;i++){
      const a=refs[i],b=refs[i+1],direction=b.rgb.map((v,k)=>v-a.rgb[k]);
      const norm=direction.reduce((sum,v)=>sum+v*v,0);if(!norm)return invalid;
      const raw=direction.reduce((sum,v,k)=>sum+(rgb[k]-a.rgb[k])*v,0)/norm;
      const fraction=Math.max(0,Math.min(1,raw));
      const fittedRGB=a.rgb.map((v,k)=>v+fraction*direction[k]);
      const distance=Math.hypot(...rgb.map((v,k)=>v-fittedRGB[k]));
      if(!best||distance<best.distance)best={distance,raw,fraction,lowerIndex:i,upperIndex:i+1,fittedRGB,value:a.value+fraction*(b.value-a.value)};
    }
    if(best.distance>model.maxRGBDistance)return {...best,value:null,status:'color-mismatch'};
    if((best.lowerIndex===0&&best.raw < -1e-9)||(best.upperIndex===refs.length-1&&best.raw>1+1e-9))return {...best,value:null,status:'outside-reference'};
    return {...best,status:'image-approximation'};
  }
  root.PCPCalibration={config,estimate};
})(globalThis);
