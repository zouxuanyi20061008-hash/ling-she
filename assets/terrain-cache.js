// Ling She V5.6: mobile-safe, bounded, world-space render caches.
// Only static terrain is cached; monsters, combat, light and hero stay dynamic.
// Cache is deliberately small enough for low-memory Android browsers.
const STATIC_CHUNK_PX=400;
const STATIC_CHUNK_LIMIT=18;
const staticGroundChunks=new Map();
const staticFloraChunks=new Map();
function invalidateStaticGround(){staticGroundChunks.clear()}
function invalidateStaticFlora(){staticFloraChunks.clear()}
if(pathArt.addEventListener)pathArt.addEventListener('load',invalidateStaticGround);
if(bankArt.addEventListener)bankArt.addEventListener('load',invalidateStaticGround);
if(bambooArt.addEventListener)bambooArt.addEventListener('load',invalidateStaticFlora);

function cachedWorldChunk(cache,ix,iy,build){
  const key=ix+'_'+iy;
  if(cache.has(key)){
    let canvas=cache.get(key);cache.delete(key);cache.set(key,canvas);return canvas;
  }
  const canvas=build(ix,iy);
  if(!canvas)return null;
  cache.set(key,canvas);
  if(cache.size>STATIC_CHUNK_LIMIT)cache.delete(cache.keys().next().value);
  return canvas;
}
function makeStaticCanvas(ix,iy){
  const c=document.createElement('canvas');
  c.width=c.height=STATIC_CHUNK_PX;
  const g=c.getContext('2d');
  if(!g)return null;
  g.imageSmoothingEnabled=false;
  g.translate(-ix*STATIC_CHUNK_PX,-iy*STATIC_CHUNK_PX);
  return {canvas:c,g};
}
function buildStaticGround(ix,iy){
  const out=makeStaticCanvas(ix,iy);if(!out)return null;
  const {canvas,g}=out;
  // One extra tile each side fixes seams at cache chunk boundaries.
  const left=Math.max(0,ix*4-1),right=Math.min(35,ix*4+4);
  const top=Math.max(0,iy*4-1),bottom=Math.min(35,iy*4+4);
  for(let tx=left;tx<=right;tx++)for(let ty=top;ty<=bottom;ty++){
    const b=biome(tx*100+50,ty*100+50),variant=Math.floor(terrainHash(tx,ty,4)*5);
    g.drawImage(terrainAtlas[b][variant],tx*100,ty*100,101,101);
  }
  for(let tx=left;tx<=right;tx++)for(let ty=top;ty<=bottom;ty++){
    const bx=tx*100,by=ty*100,b=biome(bx+50,by+50);
    for(let k=0;k<10;k++){
      let seed=Math.sin((tx*197+ty*71+k*43)*12.9898)*43758.5453;
      let u=seed-Math.floor(seed);
      seed=Math.sin((tx*29+ty*193+k*67)*78.233)*18374.239;
      let v=seed-Math.floor(seed),px=bx+u*100,py=by+v*100;
      g.globalAlpha=.18+(k%3)*.06;
      g.fillStyle=b===1?'#ffffff':b===2?'#fff0ad':b===3?'#bca1db':'#b9eaa0';
      g.fillRect(Math.round(px),Math.round(py),2+(k%4)*2,2+(k%2)*3);
    }
  }
  g.globalAlpha=1;
  // V6.3a texture treatment: additional grass, hand-scattered road grains,
  // then one continuous layered river, all clipped into the static chunk.
  paintQinglanGroundDetails(g,ix,iy);
  paintStoneRoad(g);
  paintQinglanRoadDetails(g,ix,iy);
  paintQinglanRiver(g,ix,iy);
  return canvas;
}
function buildStaticFlora(ix,iy){
  const out=makeStaticCanvas(ix,iy);if(!out)return null;
  const {canvas,g}=out;
  // Vegetation sprites may extend beyond their tile; draw overscan.
  const left=Math.max(0,ix*4-1),right=Math.min(35,ix*4+4);
  const top=Math.max(0,iy*4-1),bottom=Math.min(35,iy*4+4);
  for(let tx=left;tx<=right;tx++)for(let ty=top;ty<=bottom;ty++){
    const x=tx*100+50,y=ty*100+50;
    if(biome(x,y)!==0||onQinglanRoad(x,y)||landmarkClearing(x,y,40)||isEncounterClearing(x,y,35)||isAdventureClearing(x,y,40))continue;
    drawMeadow(x,y,g);
    const n=terrainHash(tx,ty,7);
    if(n>.78){
      if(!paintBambooStand(x-23,y+24,.65+n*.45,g))drawBamboo(x-23,y+24,.65+n*.45,g);
      if(!paintBambooStand(x+8,y+13,.55+n*.3,g))drawBamboo(x+8,y+13,.55+n*.3,g);
    }else if(n<.13){
      drawPine(x+18,y+25,16+n*35,g);
    }else if(n>.45&&n<.53){
      drawRock(x+18,y+24,10+n*8,g);
    }
  }
  return canvas;
}
function paintCachedLayer(cache,build){
  const left=Math.max(0,Math.floor(camX/STATIC_CHUNK_PX));
  const right=Math.min(Math.ceil(SIZE/STATIC_CHUNK_PX)-1,Math.floor((camX+W)/STATIC_CHUNK_PX));
  const top=Math.max(0,Math.floor(camY/STATIC_CHUNK_PX));
  const bottom=Math.min(Math.ceil(SIZE/STATIC_CHUNK_PX)-1,Math.floor((camY+H)/STATIC_CHUNK_PX));
  for(let ix=left;ix<=right;ix++)for(let iy=top;iy<=bottom;iy++){
    const tile=cachedWorldChunk(cache,ix,iy,build);
    if(tile)ctx.drawImage(tile,ix*STATIC_CHUNK_PX,iy*STATIC_CHUNK_PX);
  }
}
function paintCachedGround(){paintCachedLayer(staticGroundChunks,buildStaticGround)}
function paintCachedFlora(){paintCachedLayer(staticFloraChunks,buildStaticFlora)}
