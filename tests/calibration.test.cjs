const assert=require('node:assert/strict');
const C=require('../calibration.js'),L=require('../liquid.js');
// Browser-decoded original photos, independently recorded from the QA page.
for(const [rgb,value] of [[[223,183,190],.2],[[231,134,168],.6],[[246,100,118],2]]){
 assert.equal(C.estimate(rgb).value.toFixed(2),value.toFixed(2));
 assert.ok(Math.abs(C.estimate(rgb.map(v=>v*.7)).value-value)<1e-8);
}
const f=[[223,183,190],[231,134,168]].map(C.feature);
assert.ok(Math.abs(C.estimate(f[0].map((v,i)=>(v+f[1][i])/2)).value-.4)<1e-8);
for(const rgb of [[255,255,255],[0,0,0],[0,0,255],[0,255,0],[255,10,10],[],[NaN,0,0]])assert.equal(C.estimate(rgb).value,null);
// Do not extrapolate beyond either endpoint along the calibration curve.
const a=C.feature([223,183,190]),b=C.feature([231,134,168]),c=C.feature([246,100,118]);
assert.equal(C.estimate(a.map((v,i)=>v-.2*(b[i]-v))).value,null);
assert.equal(C.estimate(c.map((v,i)=>v+.2*(v-b[i]))).value,null);
const blank={width:100,height:100,data:new Uint8ClampedArray(40000).fill(255)};
assert.equal(L.detect(blank).length,0);assert.equal(L.sample(blank,{x:5,y:5,w:30,h:30}).valid,false);
assert.equal(L.sample(blank,{x:5,y:5,w:2,h:2}).valid,false);
console.log('PASS original-photo reference outputs, interpolation, exposure scaling, invalid colors, no extrapolation, empty/undersized regions.');
