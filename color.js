/* Pure color analysis functions. Input: mean, encoded sRGB values in 0..255.
 * Lab uses XYZ/D65 and the CIE 1931 2-degree observer; NOT CSS Lab/D50.
 * Reference: https://www.w3.org/Graphics/Color/srgb
 */
(function(root){
  function hsv(rgb){
    const [r,g,b]=rgb.map(v=>v/255),max=Math.max(r,g,b),min=Math.min(r,g,b),d=max-min;
    let h=null;
    if(d){h=max===r?60*((g-b)/d%6):max===g?60*((b-r)/d+2):60*((r-g)/d+4);h=(h+360)%360;}
    return [h,max===0?0:d/max*100,max*100];
  }
  function lab(rgb){
    const [r,g,b]=rgb.map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4;});
    const x=(.4124564*r+.3575761*g+.1804375*b)/.95047;
    const y=.2126729*r+.7151522*g+.072175*b;
    const z=(.0193339*r+.119192*g+.9503041*b)/1.08883;
    const f=t=>t>(6/29)**3?Math.cbrt(t):t/(3*(6/29)**2)+4/29;
    return [116*f(y)-16,500*(f(x)-f(y)),200*(f(y)-f(z))];
  }
  function analyze(data){
    if(!data.length || data.length%4)throw new Error('Empty or invalid pixel buffer');
    let sum=[0,0,0],sumSq=[0,0,0],clipped=0;
    for(let i=0;i<data.length;i+=4){
      const a=data[i+3]/255,p=[0,1,2].map(c=>data[i+c]*a+255*(1-a));
      p.forEach((v,c)=>{sum[c]+=v;sumSq[c]+=v*v;});
      if(p.every(v=>v>=250)||p.every(v=>v<=5))clipped++;
    }
    const count=data.length/4,rgb=sum.map(v=>v/count);
    const std=Math.sqrt(sumSq.reduce((s,v,c)=>s+Math.max(0,v/count-rgb[c]**2),0)/3);
    return {rgb,hsv:hsv(rgb),lab:lab(rgb),intensity:Math.max(0,((rgb[0]+rgb[2])/2-rgb[1])/255),count,std,clipped:clipped/count};
  }
  root.PCPColor={hsv,lab,analyze};
})(globalThis);
