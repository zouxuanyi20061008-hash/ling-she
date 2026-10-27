/* 灵蛇问道 V6.6 - Scene coherence and mobile-safe visible object index.
 * No world geometry, encounter positions, collision radius, or save fields change.
 * Decor and solid rocks are immutable between resets; fruits/enemies are dynamic.
 */
const SCENE_OBJECT_CELL=256;
const SCENE_OBJECT_MARGIN=196;
const sceneStaticDecorBuckets=new Map();
const sceneStaticRockBuckets=new Map();
const sceneVisibleDecorBuffer=[];
const sceneVisibleRockBuffer=[];
let sceneIndexedDecorLength=-1,sceneIndexedRockLength=-1;
function sceneObjectKey(x,y){
 return Math.floor(x/SCENE_OBJECT_CELL)+'_'+Math.floor(y/SCENE_OBJECT_CELL);
}
function sceneBuildObjectBuckets(items,buckets){
 buckets.clear();
 for(let i=0;i<items.length;i++){
  const item=items[i],key=sceneObjectKey(item.x,item.y);
  let entries=buckets.get(key);
  if(!entries){entries=[];buckets.set(key,entries)}
  entries.push({item,order:i});
 }
}
function rebuildSceneObjectIndex(){
 sceneBuildObjectBuckets(decor,sceneStaticDecorBuckets);
 sceneBuildObjectBuckets(obstacles,sceneStaticRockBuckets);
 sceneIndexedDecorLength=decor.length;
 sceneIndexedRockLength=obstacles.length;
}
// Render buffers keep the original placement order, so no backdrop suddenly
// jumps ahead of another object because of the spatial partition.
function sceneVisibleObjects(items,buckets,indexedCount,buffer,margin){
 if(indexedCount!==items.length){
  buffer.length=0;
  // Support future runtime object additions; correctness before speed.
  for(let i=0;i<items.length;i++){
   const o=items[i];
   if(inView(o.x,o.y,margin))buffer.push({item:o,order:i});
  }
  return buffer;
 }
 buffer.length=0;
 const left=Math.max(0,Math.floor((camX-margin)/SCENE_OBJECT_CELL));
 const right=Math.min(Math.ceil(SIZE/SCENE_OBJECT_CELL)-1,Math.floor((camX+W+margin)/SCENE_OBJECT_CELL));
 const top=Math.max(0,Math.floor((camY-margin)/SCENE_OBJECT_CELL));
 const bottom=Math.min(Math.ceil(SIZE/SCENE_OBJECT_CELL)-1,Math.floor((camY+H+margin)/SCENE_OBJECT_CELL));
 for(let ix=left;ix<=right;ix++)for(let iy=top;iy<=bottom;iy++){
  const bucket=buckets.get(ix+'_'+iy);if(!bucket)continue;
  for(const e of bucket){
   if(inView(e.item.x,e.item.y,margin))buffer.push(e);
  }
 }
 if(buffer.length>1)buffer.sort((a,b)=>a.order-b.order);
 return buffer;
}
function sceneVisibleDecor(){
 return sceneVisibleObjects(decor,sceneStaticDecorBuckets,sceneIndexedDecorLength,sceneVisibleDecorBuffer,SCENE_OBJECT_MARGIN);
}
function sceneVisibleRocks(){
 return sceneVisibleObjects(obstacles,sceneStaticRockBuckets,sceneIndexedRockLength,sceneVisibleRockBuffer,67);
}
function sceneRockBlocked(x,y){
 if(sceneIndexedRockLength!==obstacles.length)return obstacles.some(o=>Math.hypot(o.x-x,o.y-y)<o.r+10);
 const cx=Math.floor(x/SCENE_OBJECT_CELL),cy=Math.floor(y/SCENE_OBJECT_CELL);
 // All seeded rocks have radii 15..31, well within one 256px neighbor cell.
 for(let ix=cx-1;ix<=cx+1;ix++)for(let iy=cy-1;iy<=cy+1;iy++){
  const bucket=sceneStaticRockBuckets.get(ix+'_'+iy);
  if(!bucket)continue;
  for(const entry of bucket){
   const o=entry.item;
   if(Math.hypot(o.x-x,o.y-y)<o.r+10)return true;
  }
 }
 return false;
}
const SCENE_ART_TONES=[
 {stone:'#748d79',lit:'#b6c9a9',edge:'#365b52',shadow:'#183b33'},
 {stone:'#91aeb2',lit:'#e0efea',edge:'#507685',shadow:'#274955'},
 {stone:'#a88c6b',lit:'#e9cd97',edge:'#80583c',shadow:'#624c39'},
 {stone:'#7f718e',lit:'#b2a0c6',edge:'#554762',shadow:'#342d45'}
];
function sceneRockPalette(x,y){return SCENE_ART_TONES[biome(x,y)]||SCENE_ART_TONES[0]}
function scenePaintDecorObject(o){
 // Only tiny decorative petals are thinned on smooth/mobile mode; all trees,
 // bamboo and obstacles remain visible and their gameplay positions unchanged.
 const b=biome(o.x,o.y);
 if(o.type<.29){
  if(b!==0||!paintTreeScene(o,72+o.size*2.2))drawFoliageSprite(o);
 }else if(o.type<.65){
  if(qualityMode==='smooth'&&terrainHash(Math.floor(o.x),Math.floor(o.y),66)<.44)return;
  drawFlower(o.x,o.y,b===1?'#e4fbf4':b===2?'#f0d39b':b===3?'#d0b5da':'#edc7c9');
 }else if(o.type<.79){
  if(!paintBambooStand(o.x,o.y,.6+o.size/40))drawBamboo(o.x,o.y,.6+o.size/40);
 }else{
  drawRock(o.x,o.y,Math.max(5,o.size*.6));
 }
}
function scenePaintObstacle(o){
 circle(o.x+3,o.y+5,o.r,'#273d35a0');
 drawRock(o.x,o.y,o.r);
}
// Persistent labels remain for elites. Ordinary enemies show health bars
// only after taking damage, reducing visual clutter in large encounters.
function paintSceneEnemyReadability(e){
 if(e.elite){
  ctx.save();ctx.strokeStyle='#ead59b';ctx.lineWidth=1.5;
  ctx.globalAlpha=.8;ctx.beginPath();ctx.arc(e.x,e.y,e.r+5,0,Math.PI*2);ctx.stroke();
  // Label nearby elites only; distant text should not obscure the forest.
  if(Math.hypot(player.x-e.x,player.y-e.y)<390){
   ctx.globalAlpha=1;ctx.font='bold 11px serif';ctx.textAlign='center';
   ctx.fillStyle='#ffedbd';ctx.fillText(creatureLabel(e),e.x,e.y-e.r-24);
  }
  ctx.restore();
 }
 if(!e.elite&&e.hp>=e.max)return;
 const ratio=Math.min(1,Math.max(0,e.hp/Math.max(1,e.max)));
 const c=combatFxPalette(e.species||'fox');
 ctx.save();
 ctx.fillStyle='#1c2930ca';ctx.fillRect(e.x-19,e.y-e.r-12,38,6);
 ctx.fillStyle=ratio<.31?'#ed8e82':ratio<.67?'#e3c68b':c[1];
 ctx.fillRect(e.x-17,e.y-e.r-10,34*ratio,3);
 ctx.restore();
}
