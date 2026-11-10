/* Image-derived references, NOT a chemical calibration.
 * Source: user-supplied 725x352 DPD chart, received 2026-11-10.
 * RGB = mode of each 50x100px interior crop (no text/borders).
 * Crop centers x=100,215,335,450,565; y=130..229.
 * All 5000 pixels per crop had the listed RGB in the supplied PNG.
 * Values describe the supplied digital image, not certified liquid standards.
 */
(function(root){
  const config=Object.freeze({
    id:'dpd-image-reference-v1',calibrated:false,method:'nearest-CIELAB-D65-DE76',
    // Heuristic rejection guard only; not a validated measurement tolerance.
    maxDeltaE:15,
    references:Object.freeze([
      {value:0.05,rgb:[254,237,242]},
      {value:0.20,rgb:[250,213,230]},
      {value:0.50,rgb:[241,171,201]},
      {value:1.00,rgb:[236,122,170]},
      {value:2.00,rgb:[230,87,149]}
    ].map(p=>Object.freeze({...p,rgb:Object.freeze(p.rgb),lab:Object.freeze(root.PCPColor.lab(p.rgb))})))
  });
  function estimate(lab,model=config){
    if(!Array.isArray(lab)||lab.length!==3||!lab.every(Number.isFinite))return {value:null,status:'invalid',index:null,distance:null};
    const ranked=model.references.map((p,index)=>({index,value:p.value,distance:Math.hypot(...lab.map((v,i)=>v-p.lab[i]))})).sort((a,b)=>a.distance-b.distance);
    const best=ranked[0];
    if(!best)return {value:null,status:'invalid',index:null,distance:null};
    return {...best,value:best.distance<=model.maxDeltaE?best.value:null,
      status:best.distance<=model.maxDeltaE?'image-reference':'color-mismatch',
      boundary:ranked.length>1&&ranked[1].distance-best.distance<2,
      endpoint:best.index===0||best.index===model.references.length-1};
  }
  root.PCPCalibration={config,estimate};
})(globalThis);
