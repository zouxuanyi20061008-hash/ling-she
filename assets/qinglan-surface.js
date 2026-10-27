/* 灵蛇问道 V6.3a — 青岚平原地貌绘制层
 * World-space deterministic details; all work is baked into 400px terrain chunks.
 * No collisions, AI, save schema, or animated render loops are changed.
 */
const QINGLAN_ART_VERSION='6.3a';
const QINGLAN_COLORS={
 grass:['#679559','#5d8b55','#80a365','#4f7d50','#8aa96a'],
 shade:['#294f3e','#3f6b4b','#406e53'],
 warm:['#a2b074','#cfca90','#8aa16a'],
 soil:['#867356','#a3916a','#dac396'],
 water:['#174c62','#2c7386','#438e98','#84bab4','#b7dfc6']
};
// Broad patches are subtle, irregular, and deterministic across chunk reloads.
function paintQinglanGrassCell(g,tx,ty){
 const baseX=tx*100,baseY=ty*100;
 if(biome(baseX+50,baseY+50)!==0)return;
 const n=terrainHash(tx,ty,101);
 // Bigger scale patchwork underneath the fine grass tufts.
 for(let i=0;i<3;i++){
  const x=baseX+10+terrainHash(tx*7+i,ty,102)*86;
  const y=baseY+8+terrainHash(tx,ty*9+i,103)*82;
  const w=20+terrainHash(i+tx,ty,104)*36,h=10+terrainHash(tx,ty+i,105)*20;
  g.fillStyle=QINGLAN_COLORS.grass[(Math.floor(n*5)+i)%5];
  g.globalAlpha=.12+(i%2)*.075;
  g.beginPath();g.ellipse(x,y,w,h,terrainHash(tx,ty,200+i)*1.3-.65,0,Math.PI*2);g.fill();
 }
 g.globalAlpha=1;
 // Low contrast hand-laid grass; no large flowers near route or fights.
 for(let i=0;i<11;i++){
  const px=baseX+3+terrainHash(tx*13+i,ty*5,111)*94;
  const py=baseY+4+terrainHash(ty*17+i,tx*7,112)*91;
  const nearRoad=onQinglanRoad(px,py),shore=py>=1200&&py<=3500&&Math.abs(px-streamCenter(py))<93;
  if(nearRoad||shore)continue;
  const light=terrainHash(tx+i,ty,113)>.45;
  g.strokeStyle=light?'#b4c58a':'#305f46';
  g.globalAlpha=light?.4:.31;g.lineWidth=1.25;
  const l=3+(i%4);
  g.beginPath();g.moveTo(px,py+2);g.lineTo(px-2,py-l);
  g.moveTo(px,py+2);g.lineTo(px+3,py-l-1);g.stroke();
  if(i===2&&n>.28&&n<.7){
   g.fillStyle='#f0e6b1';g.globalAlpha=.55;
   g.fillRect(Math.round(px),Math.round(py-l-3),2,2);
  }
 }
 g.globalAlpha=1;
}
function paintQinglanGroundDetails(g,ix,iy){
 const left=Math.max(0,ix*4-1),right=Math.min(35,ix*4+4);
 const top=Math.max(0,iy*4-1),bottom=Math.min(35,iy*4+4);
 g.save();
 for(let tx=left;tx<=right;tx++)for(let ty=top;ty<=bottom;ty++){
  paintQinglanGrassCell(g,tx,ty);
 }
 g.restore();
}
// Road use already-defined scenePathGeometry; grain belongs on top of its
// textured stroke, never as thousands of live draw() calls.
function paintQinglanRoadDetails(g,ix,iy){
 const left=Math.max(0,ix*4-1),right=Math.min(35,ix*4+4);
 const top=Math.max(0,iy*4-1),bottom=Math.min(35,iy*4+4);
 g.save();g.lineCap='round';
 for(let tx=left;tx<=right;tx++)for(let ty=top;ty<=bottom;ty++){
  for(let k=0;k<8;k++){
   const x=tx*100+4+terrainHash(tx*31+k,ty,301)*94;
   const y=ty*100+3+terrainHash(tx,ty*37+k,302)*92;
   if(!onQinglanRoad(x,y))continue;
   const t=terrainHash(tx+k,ty,303);
   if(t<.56){
    // Embedded river stones are visually small compared with the snake head.
    g.fillStyle=t>.35?'#d8c7a0':'#8b876c';g.globalAlpha=.31;
    const w=3+(k%3)*2,h=1.7+(k%2)*1.4;
    g.beginPath();g.ellipse(x,y,w,h,-.3,0,Math.PI*2);g.fill();
    g.strokeStyle='#4d604f';g.globalAlpha=.14;g.lineWidth=1;
    g.beginPath();g.moveTo(x-w,y+1);g.lineTo(x+w,y+2);g.stroke();
   }else{
    g.strokeStyle=t>.8?'#d6c296':'#526c4b';g.globalAlpha=.25;g.lineWidth=1.25;
    g.beginPath();g.moveTo(x-2,y);g.lineTo(x+4,y-1);g.stroke();
   }
  }
 }
 g.restore();
}
// Narrow river: banks at roughly +/- 40px, collision remains +/-30px.
// The river is a static world-space shape, continuous across tile boundaries.
function qinglanRiverStroke(g,width,color,alpha=1){
 g.save();g.lineCap='round';g.lineJoin='round';
 g.strokeStyle=color;g.lineWidth=width;g.globalAlpha=alpha;
 g.beginPath();
 for(let y=1200;y<=3510;y+=23){
  const x=streamCenter(y)+Math.sin(y*.025)*1.2;
  if(y===1200)g.moveTo(x,y);else g.lineTo(x,y);
 }
 g.stroke();g.restore();
}
function paintQinglanRiver(g,ix,iy){
 const left=ix*STATIC_CHUNK_PX,top=iy*STATIC_CHUNK_PX;
 const right=left+STATIC_CHUNK_PX,bottom=top+STATIC_CHUNK_PX;
 if(bottom<1150||top>3540)return;
 // Skip non-river chunks before building any world-length stroked path.
 let min=Infinity,max=-Infinity;
 for(let y=Math.max(1200,top-100);y<=Math.min(3500,bottom+100);y+=45){
  const x=streamCenter(y);min=Math.min(min,x);max=Math.max(max,x);
 }
 if(right<min-90||left>max+90)return;
 // Wet soil, sand, bank shadow, deep water, turquoise moving channel.
 qinglanRiverStroke(g,113,'#335d4c',.5);
 qinglanRiverStroke(g,102,'#708b66',.88);
 qinglanRiverStroke(g,91,'#c5b88c',1);
 qinglanRiverStroke(g,81,'#718f7c',1);
 qinglanRiverStroke(g,74,'#1f5364',1);
 qinglanRiverStroke(g,65,'#287688',1);
 qinglanRiverStroke(g,46,'#3e95a0',.87);
 qinglanRiverStroke(g,25,'#5ca7a9',.54);
 // Original sprite is transparent and baked once per chunk (not every frame).
 if(typeof bankArt!=='undefined'&&isArtReady(bankArt)){
  g.save();g.globalAlpha=.43;
  const sy=Math.floor((top-110)/96)*96;
  for(let y=Math.max(1200,sy);y<Math.min(3500,bottom+125);y+=96){
   const cx=streamCenter(y+48);
   if(cx<left-110||cx>right+110)continue;
   g.drawImage(bankArt,cx-69,y,56,98);
   g.save();g.translate(cx+69,0);g.scale(-1,1);
   g.drawImage(bankArt,0,y,56,98);g.restore();
  }
  g.restore();
 }
 // Shallow pebbles, reed silhouettes and ripples are fixed in world space.
 g.save();
 const sy=Math.max(1210,Math.floor((top-70)/31)*31),ey=Math.min(3500,bottom+70);
 for(let y=sy;y<ey;y+=31){
  const seed=terrainHash(Math.floor(y/31),481,2),cx=streamCenter(y);
  if(cx<left-100||cx>right+100)continue;
  if(seed>.22){
   const x=cx+(seed>.61?-1:1)*(41+terrainHash(y,2,7)*8);
   g.fillStyle=seed>.65?'#b8bc94':'#6c8872';g.globalAlpha=.58;
   g.beginPath();g.ellipse(x,y,2+seed*4,1.5+seed*2,-.15,0,Math.PI*2);g.fill();
   g.strokeStyle='#345b4d';g.globalAlpha=.45;g.lineWidth=1.2;
   g.beginPath();g.moveTo(x-3,y-2);g.lineTo(x-4,y-7);g.moveTo(x+2,y-2);g.lineTo(x+4,y-6);g.stroke();
  }
  const wave=terrainHash(y,27,2);
  if(wave>.33){
   g.globalAlpha=.19+.2*wave;g.strokeStyle='#d4f0d8';g.lineWidth=1.2;
   g.beginPath();g.moveTo(cx-12+wave*9,y);g.quadraticCurveTo(cx+1,y-2,cx+9+wave*7,y);g.stroke();
  }
  if(seed>.76){
   // Shore grass is sparse so the river remains clearly walk-blocked.
   const side=seed>.89?1:-1,x=cx+side*56;
   g.strokeStyle='#a6bf8c';g.globalAlpha=.5;g.lineWidth=1.5;
   g.beginPath();g.moveTo(x,y+3);g.lineTo(x-side*2,y-5);g.moveTo(x,y+3);g.lineTo(x+side*5,y-4);g.stroke();
  }
 }
 g.restore();
}
