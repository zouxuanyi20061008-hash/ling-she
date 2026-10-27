/* 灵蛇问道 V6.3c - Qinglan's quiet morning.
 * Non-interactive art only: baked gradients, view culling, sparse motion.
 * This file never changes collision, state, enemy AI or the V4 save schema.
 */
const QINGLAN_MOOD_VERSION='6.3c';
function qinglanMoodStamp(w,h,paint){
 const tile=document.createElement('canvas');
 tile.width=w;tile.height=h;
 const g=tile.getContext('2d');
 if(g)paint(g,w,h);
 return tile;
}
const qinglanSunPool=qinglanMoodStamp(192,116,(g,w,h)=>{
 const light=g.createRadialGradient(w*.49,h*.46,2,w*.5,h*.5,w*.52);
 light.addColorStop(0,'rgba(255,242,193,.50)');
 light.addColorStop(.3,'rgba(252,232,159,.28)');
 light.addColorStop(.7,'rgba(236,228,166,.09)');
 light.addColorStop(1,'rgba(237,228,182,0)');
 g.fillStyle=light;g.fillRect(0,0,w,h);
});
const qinglanBeam=qinglanMoodStamp(128,248,(g,w,h)=>{
 // Soft taper, not a hard triangular flashlight cone.
 const horizontal=g.createLinearGradient(0,0,w,0);
 horizontal.addColorStop(0,'rgba(255,246,208,0)');
 horizontal.addColorStop(.38,'rgba(255,246,208,.11)');
 horizontal.addColorStop(.55,'rgba(255,250,219,.16)');
 horizontal.addColorStop(.83,'rgba(255,246,208,.045)');
 horizontal.addColorStop(1,'rgba(255,246,208,0)');
 const vertical=g.createLinearGradient(0,0,0,h);
 vertical.addColorStop(0,'rgba(255,248,220,0)');
 vertical.addColorStop(.38,'rgba(255,248,220,.3)');
 vertical.addColorStop(.76,'rgba(255,248,220,.65)');
 vertical.addColorStop(1,'rgba(255,248,220,0)');
 g.fillStyle=horizontal;g.beginPath();
 g.moveTo(63,0);g.lineTo(5,246);g.lineTo(123,246);g.closePath();g.fill();
 g.globalCompositeOperation='destination-in';g.fillStyle=vertical;g.fillRect(0,0,w,h);
});
const qinglanMistStamp=qinglanMoodStamp(208,86,(g,w,h)=>{
 const mist=g.createRadialGradient(w*.5,h*.53,6,w*.5,h*.53,w*.53);
 mist.addColorStop(0,'rgba(209,235,215,.3)');
 mist.addColorStop(.5,'rgba(210,233,224,.18)');
 mist.addColorStop(1,'rgba(217,235,221,0)');
 g.fillStyle=mist;g.fillRect(0,0,w,h);
});
const qinglanDappleSeeds=[
 [1380,1900,1.18],[1540,1870,.86],[1680,1730,.88],
 [1890,1955,1.08],[2130,1905,1.12],[2310,1980,.82],
 [1305,2150,.95],[1690,2230,1.14],[1980,2380,1.05],
 [2270,2180,.94],[1220,2550,1.17],[1710,2670,1.03],
 [2110,2940,1.12],[1830,3130,.96],[2850,2110,.95],
 [3190,2320,1.1],[990,1000,1.1],[1260,1020,.85],
 [2200,1190,.85],[2310,1320,1.1],[2750,2050,.92]
];
const qinglanWaterMistAnchors=[1360,1530,1680,2040,2310,2550,2940,3240];
function qinglanInFrame(x,y,pad=80){
 return x>=camX-pad&&x<=camX+W+pad&&y>=camY-pad&&y<=camY+H+pad;
}
// Ground receives dappled light before the hero and monsters are drawn.
function paintQinglanGroundLight(now){
 if(!running||!player||!qinglanSunPool.width)return;
 const sharp=qualityMode==='sharp',range=sharp?260:180;
 let displayed=0,maxPools=sharp?8:4;
 ctx.save();ctx.globalCompositeOperation='screen';
 for(let i=0;i<qinglanDappleSeeds.length&&displayed<maxPools;i++){
  const p=qinglanDappleSeeds[i],x=p[0],y=p[1];
  if(biome(x,y)!==0||!qinglanInFrame(x,y,range))continue;
  if(terrainBlocked(x,y)||onQinglanRoad(x,y))continue;
  const sway=Math.sin(now*.00035+i*1.29),size=p[2]*(sharp?1:.86);
  ctx.globalAlpha=(sharp?.64:.42)+sway*.05;
  const px=x+Math.sin(now*.0004+i)*4,py=y+Math.cos(now*.00031+i)*2;
  ctx.drawImage(qinglanSunPool,px-94*size,py-54*size,188*size,108*size);
  if(sharp&&displayed<4){
   ctx.globalAlpha=.25+Math.sin(now*.00043+i)*.022;
   ctx.drawImage(qinglanBeam,px-64*size,py-239*size,128*size,245*size);
  }
  displayed++;
 }
 ctx.restore();
}
// Small moving slivers belong only inside the actual world-coordinate stream.
function paintQinglanWaterGlints(now){
 if(!player||!running)return;
 const yMin=Math.max(1208,camY-15),yMax=Math.min(3490,camY+H+15);
 if(yMin>=yMax)return;
 const sharp=qualityMode==='sharp',step=sharp?55:109;
 ctx.save();ctx.lineCap='round';ctx.lineWidth=sharp?1.6:1.25;
 for(let y=Math.floor(yMin/step)*step;y<=yMax;y+=step){
  if(y<1200||y>3500||y>1740&&y<1860)continue;
  const x=streamCenter(y),n=terrainHash(Math.floor(y/step),23,11);
  if(!qinglanInFrame(x,y,44)||n<.22)continue;
  const shift=Math.sin(now*.00085+y*.017)*7;
  ctx.globalAlpha=(sharp?.18:.12)+(.09*n)*(.6+.4*Math.sin(now*.002+y));
  ctx.strokeStyle='#e8f8de';ctx.beginPath();
  ctx.moveTo(x-14+shift,y);
  ctx.quadraticCurveTo(x-4+shift,y-2,x+8+shift,y);
  ctx.stroke();
  if(sharp&&n>.71){
   ctx.globalAlpha=.24;
   ctx.fillStyle='#d9f5e4';ctx.fillRect(x+shift+13,y+2,2,2);
  }
 }
 ctx.restore();
}
// Natural ground contact: draw BEFORE serpent sprites, not over the face/eyes.
function paintSerpentGroundShadow(hero,segments,stage,now){
 if(!hero||!segments||!segments.length)return;
 const sharp=qualityMode==='sharp',step=sharp?2:3;
 ctx.save();ctx.fillStyle='#112f2d';ctx.beginPath();
 for(let i=segments.length-1;i>=0;i-=step){
  const p=segments[i],width=Math.max(7,(12+stage*1.45)*(1-i/Math.max(17,segments.length)*.3));
  if(!qinglanInFrame(p.x,p.y,42))continue;
  ctx.moveTo(p.x+width,p.y+7);
  ctx.ellipse(p.x+4,p.y+7,width,width*.43,0,0,Math.PI*2);
 }
 ctx.globalAlpha=sharp?.2:.17;ctx.fill();
 const width=17+stage*2;
 ctx.globalAlpha=sharp?.27:.22;ctx.beginPath();
 ctx.ellipse(hero.x+4,hero.y+8,width,width*.48,-.12,0,Math.PI*2);
 ctx.fill();ctx.restore();
}
// A handful of very low-opacity pockets over the river and forest edge.
// Motion is anchored in world coordinates and loops without visible jumps.
function paintQinglanAir(now){
 if(!running||!player)return;
 const sharp=qualityMode==='sharp',bi=biome(player.x,player.y);
 ctx.save();
 if(bi===0){
  // Spring veil: high quality draws a few more distant wisps than mobile.
  ctx.globalCompositeOperation='screen';
  const count=sharp?6:3;
  let drawn=0;
  for(let i=0;i<qinglanWaterMistAnchors.length&&drawn<count;i++){
   const y=qinglanWaterMistAnchors[i];
   const x=streamCenter(y),shift=Math.sin(now*.00021+i)*21;
   if(!qinglanInFrame(x,y,200))continue;
   ctx.globalAlpha=sharp?.34:.2;
   ctx.drawImage(qinglanMistStamp,x-120+shift,y-42,240,83);
   drawn++;
  }
  // 3 to 6 light motes, never thousands of particles or per-frame gradients.
  const motes=sharp?6:3;
  for(let i=0;i<motes;i++){
   const x=camX+((i*179+now*.006)%(W+90))-45;
   const y=camY+((i*131+now*.003)%(H+70))-35;
   if(biome(x,y)!==0)continue;
   const pulse=.5+.5*Math.sin(now*.002+i*2.19);
   ctx.globalAlpha=(sharp?.11:.07)+pulse*.06;
   ctx.fillStyle=i%3?'#f7eac2':'#ccefd8';
   ctx.fillRect(Math.round(x),Math.round(y),sharp?3:2,sharp?3:2);
  }
 }else{
  // Existing soft atmospheric treatment outside Qinglan. Keep biome readable.
  ctx.globalCompositeOperation='screen';
  ctx.globalAlpha=sharp?.14:.075;
  ctx.drawImage(qinglanMistStamp,player.x-200,player.y-220,320,120);
 }
 ctx.restore();
}
