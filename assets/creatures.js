/* V6.5: Qinglan forest creature ecology and sprite animation.
 * Each enemy has a distinct authored sprite, motion and combat role.
 * Enemy state is ephemeral; older V4 local save files remain compatible.
 */
const CREATURE_META={
 hare:{name:'玉耳灵兔',role:'可吞噬',hp:16,tier:1,r:12,speed:102,art:'assets/spirit-hare.svg'},
 fox:{name:'赤焰狐妖',role:'游斗',hp:47,tier:2,r:16,speed:73,art:'assets/spirit-fox.svg'},
 wolf:{name:'裂牙山狼',role:'突袭',hp:73,tier:3,r:19,speed:82,art:'assets/spirit-wolf.svg'},
 tortoise:{name:'玄岩甲龟',role:'坚甲',hp:142,tier:4,r:23,speed:27,art:'assets/stone-tortoise.svg'},
 bat:{name:'幽羽妖蝠',role:'远袭',hp:53,tier:3,r:16,speed:91,art:'assets/shadow-bat.svg'},
 frost_stag:{name:'霜角灵鹿',role:'寒魄·游击',hp:92,tier:4,r:21,speed:76,art:'assets/frost-stag.svg'},
 ember_scorpion:{name:'赤砂炎蝎',role:'烈焰·猛袭',hp:118,tier:5,r:22,speed:60,art:'assets/ember-scorpion.svg'},
 nether_wisp:{name:'幽冥鬼灯',role:'幽咒·闪现',hp:88,tier:6,r:19,speed:86,art:'assets/nether-wisp.svg'}
};
const CREATURE_ART={};
for(const [id,info] of Object.entries(CREATURE_META)){const img=new Image();img.src=info.art+'?v=65';CREATURE_ART[id]=img}
function creatureSpecies(x,y,seed){
 const n=terrainHash(seed,Math.floor(x/160),Math.floor(y/170));
 const b=biome(x,y);
 if(b===3)return n<.66?'nether_wisp':n<.79?'bat':n<.9?'wolf':'tortoise';
 if(b===1)return n<.64?'frost_stag':n<.75?'hare':n<.88?'fox':'tortoise';
 if(b===2)return n<.64?'ember_scorpion':n<.77?'wolf':n<.9?'tortoise':'hare';
 return n<.28?'hare':n<.53?'fox':n<.79?'wolf':n<.9?'tortoise':'bat';
}
function assignCreature(e,x,y,index,forcedSpecies=null){
 const species=forcedSpecies&&CREATURE_META[forcedSpecies]?forcedSpecies:creatureSpecies(x,y,index),meta=CREATURE_META[species],zone=biome(x,y);
 const elite=terrainHash(index,17,zone+14)>.88;
 const scale=1+zone*.32+(elite?.48:0);
 Object.assign(e,{
  x,y,species,armor:species==='tortoise'?.58:species==='ember_scorpion'?.8:species==='frost_stag'?.93:species==='nether_wisp'?1.06:1,
  hp:Math.round(meta.hp*scale),max:Math.round(meta.hp*scale),
  r:meta.r+(elite?3:0),tier:meta.tier+Math.max(0,zone-1),
  t:terrainHash(index,31,zone)*7,last:0,shot:0,
  elite,hitFlash:0,rushUntil:0,rushReady:0,
  wander:terrainHash(index,53,zone)*Math.PI*2,regionalBurnUntil:0,regionalBurnTick:0
 });
 return e;
}
function makeCreature(x,y,index,forcedSpecies=null){return assignCreature({},x,y,index,forcedSpecies)}
function updateCreatureMotion(e,hero,dt,now,weak){
 let dx=hero.x-e.x,dy=hero.y-e.y,d=Math.max(1,Math.hypot(dx,dy));
 const id=e.species||'fox',meta=CREATURE_META[id]||CREATURE_META.fox;
 if(updateRegionalCreature(e,hero,dt,now,weak))return;
 let vx=0,vy=0,speed=meta.speed;
 if(id==='hare'||weak){
  if(d<340){vx=-dx/d;vy=-dy/d;speed*=id==='hare'?1.14:1.08}
  else{vx=Math.cos(e.t*1.5+e.wander);vy=Math.sin(e.t*.9+e.wander);speed=9}
 }else if(id==='fox'){
  if(d<250){
   const toward=d>145?.42:d<95?-.83:0;
   vx=dx/d*toward-dy/d*.84;vy=dy/d*toward+dx/d*.84;speed=73;
   if(d<235&&now>e.shot){e.shot=now+2300;projectiles.push({x:e.x,y:e.y,vx:dx/d*218,vy:dy/d*218,life:1.65,damage:6+e.tier*2,hostile:true})}
  }else{vx=Math.cos(e.t*.6+e.wander);vy=Math.sin(e.t*.6+e.wander);speed=11}
 }else if(id==='wolf'){
  if(d<290){
    vx=dx/d;vy=dy/d;
    if(now>e.rushReady&&d<175){e.rushUntil=now+470;e.rushReady=now+2900}
    speed=now<e.rushUntil?160:66;
  }else{vx=Math.cos(e.t*.8+e.wander);vy=Math.sin(e.t*.7+e.wander);speed=13}
 }else if(id==='tortoise'){
   if(d<250&&d>53){vx=dx/d;vy=dy/d}
   else if(d>=250){vx=Math.cos(e.t*.3+e.wander);vy=Math.sin(e.t*.3+e.wander);speed=7}
   else speed=0;
 }else if(id==='bat'){
   if(d<300){vx=dx/d*.63-dy/d*Math.sin(e.t*3.4)*.7;vy=dy/d*.63+dx/d*Math.sin(e.t*3.4)*.7;speed=90;
     if(d<270&&now>e.shot){e.shot=now+2600;projectiles.push({x:e.x,y:e.y,vx:dx/d*246,vy:dy/d*246,life:1.4,damage:6+e.tier*1.6,hostile:true})}
   }else{vx=Math.cos(e.t*1.3+e.wander);vy=Math.sin(e.t*.8+e.wander);speed=22}
 }
 const len=Math.hypot(vx,vy);
 if(len>.0001){vx=vx/len*speed*dt;vy=vy/len*speed*dt}
 let nx=Math.max(22,Math.min(SIZE-22,e.x+vx)),ny=Math.max(22,Math.min(SIZE-22,e.y+vy));
 if(!terrainBlocked(nx,ny)){e.x=nx;e.y=ny}
 else{if(!terrainBlocked(nx,e.y))e.x=nx;if(!terrainBlocked(e.x,ny))e.y=ny}
}
function paintSpeciesEnemy(e,now){
 const id=e.species||'fox',img=CREATURE_ART[id];
 if(!img||!img.complete||!img.naturalWidth)return false;
 const width=e.r*(id==='wolf'?3.55:id==='bat'?3.8:id==='tortoise'?3.3:
  id==='frost_stag'?3.65:id==='ember_scorpion'?3.8:id==='nether_wisp'?3.5:3.2);
 const t=e.t||0,bob=id==='hare'?Math.sin(t*11)*3.6:
  id==='bat'?Math.sin(t*9)*4:id==='nether_wisp'?Math.sin(t*6.8)*6:
  id==='frost_stag'?Math.sin(t*4.2)*2.1:Math.sin(t*2.4)*1.2;
 const hurt=now<e.hitFlash;
 // Keep motions understated so attack hitboxes and visual silhouettes align.
 const tilt=id==='bat'?Math.sin(t*5.4)*.09:id==='nether_wisp'?Math.sin(t*2.8)*.07:
  id==='wolf'&&now<e.rushUntil?Math.sin(t*8)*.055:
  id==='ember_scorpion'&&now<e.rushUntil?Math.sin(t*7)*.045:Math.sin(t*1.5)*.02;
 const breathe=1+(id==='tortoise'?.012:.024)*Math.sin(t*(id==='hare'?5:2.8));
 ctx.save();
 ctx.translate(e.x,e.y);ctx.rotate(tilt);ctx.scale(breathe,breathe);
 if(hurt){
  ctx.globalAlpha=.78;
  ctx.shadowColor='#fff5d7';
  ctx.shadowBlur=qualityMode==='sharp'?12:5;
 }else if(e.elite&&qualityMode==='sharp'){
  ctx.shadowColor=combatFxPalette(id)[1];ctx.shadowBlur=6;
 }
 ctx.drawImage(img,-width*.5,-width*.72+bob,width,width);
 ctx.restore();return true;
}
function creatureLabel(e){return (e.elite?'精英 · ':'')+(CREATURE_META[e.species]?.name||'妖兽')}
