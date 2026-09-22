/* Replace this independent configuration with validated experimental pairs.
 * Each point: [pink intensity, reference concentration in mg/L].
 * DEMO ONLY: these values are arbitrary, not empirical PCP calibration data.
 * Changing calibrated alone does not change the UI's Phase 1 warnings.
 */
(function(root){
  const config=Object.freeze({id:'demo-v1',calibrated:false,feature:'pinkIntensity',points:[[0,0],[.5,2]]});
  function estimate(intensity,curve=config){
    const points=curve.points;
    if(!Number.isFinite(intensity)||points.length<2||points.some((p,i)=>p.length!==2||!p.every(Number.isFinite)||(i&&p[0]<=points[i-1][0])))return {value:null,status:'invalid'};
    if(intensity<points[0][0]||intensity>points.at(-1)[0])return {value:null,status:'out-of-range'};
    for(let i=1;i<points.length;i++){const [x0,y0]=points[i-1],[x1,y1]=points[i];if(intensity<=x1)return {value:y0+(intensity-x0)/(x1-x0)*(y1-y0),status:'demo'};}
  }
  root.PCPCalibration={config,estimate};
})(globalThis);
