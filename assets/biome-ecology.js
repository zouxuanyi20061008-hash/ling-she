/* 灵蛇问道 V6.2 - Three distinct regional ecosystems.
 * Frost Stag kites and chills; Ember Scorpion lunges and burns;
 * Nether Wisp blinks and curses. Their spirit materials unlock lasting perks.
 * State is additive to the existing v4 save object, no migration required.
 */
const REGIONAL_MATERIALS={
 frost:{id:'frost_stag',name:'寒魄',creature:'霜角灵鹿',region:'寒霜雪境',threshold:4,perk:'冰鳞护体',effect:'降低寒霜减速，常驻少量减伤',color:'#b5f6f6'},
 ember:{id:'ember_scorpion',name:'炎晶',creature:'赤砂炎蝎',region:'赤炎荒漠',threshold:4,perk:'炎脉灼击',effect:'灵息弹使妖兽持续灼烧',color:'#ffd18c'},
 nether:{id:'nether_wisp',name:'幽魄',creature:'幽冥鬼灯',region:'幽冥魔域',threshold:4,perk:'幽息回元',effect:'吞噬或击败妖兽时少量回血、减轻幽咒',color:'#d7b9ff'}
};
const REGIONAL_SPECIES={
 frost_stag:'frost',ember_scorpion:'ember',nether_wisp:'nether'
};
let regionalState=null,regionalStatus=null,regionalLastHeal=0;
function resetRegionalEcology(){
 regionalState={materials:{frost:0,ember:0,nether:0}};
 regionalStatus={frostUntil:0,emberUntil:0,emberTick:0,netherUntil:0};
 regionalLastHeal=0;
}
function restoreRegionalEcology(saved){
 if(!regionalState)resetRegionalEcology();
 const source=saved?.regionalMaterials;
 for(const id of Object.keys(REGIONAL_MATERIALS)){
  const v=source&&typeof source==='object'?Number(source[id]):0;
  regionalState.materials[id]=Number.isFinite(v)?Math.max(0,Math.min(9999,Math.floor(v))):0;
 }
 regionalStatus={frostUntil:0,emberUntil:0,emberTick:0,netherUntil:0};
 regionalLastHeal=0;
}
function regionalSaveFields(){
 return {regionalMaterials:{...regionalState.materials}};
}
function regionalPerkUnlocked(id){
 return !!(regionalState&&regionalState.materials[id]>=REGIONAL_MATERIALS[id].threshold);
}
function regionalOnKill(enemy){
 const key=REGIONAL_SPECIES[enemy.species];
 if(!key||enemy.trialToken||!regionalState)return;
 const info=REGIONAL_MATERIALS[key],before=regionalState.materials[key];
 regionalState.materials[key]=Math.min(9999,before+1);
 damageTexts.push({x:enemy.x,y:enemy.y-38,text:info.name+' +1',life:1,color:info.color});
 if(before<info.threshold&&regionalState.materials[key]>=info.threshold){
  flash('✨ 悟得'+info.perk);
  toast('✨ '+info.name+'集齐 · '+info.perk+'已解锁！');
  for(let i=0;i<12;i++){
   let a=i*Math.PI/6;
   particles.push({x:player.x,y:player.y,vx:Math.cos(a)*80,vy:Math.sin(a)*80,life:.8,color:info.color});
  }
  saveGame(true);
 }
 // Nether perk restores some HP after combat, without excessive healing from mass-swallow.
 const now=performance.now();
 if(regionalPerkUnlocked('nether')&&now-regionalLastHeal>1200){
  const max=100+level*10;
  const restored=Math.min(8,max-hp);
  if(restored>0){
   hp+=restored;regionalLastHeal=now;
   damageTexts.push({x:player.x,y:player.y-24,text:'幽息 +'+restored,life:.8,color:'#d9c6ff'});
  }
 }
}
function regionalMovementMultiplier(now){
 if(now<regionalStatus.frostUntil)return regionalPerkUnlocked('frost')?.91:.69;
 return 1;
}
function regionalDamageMultiplier(now){
 return now<regionalStatus.netherUntil?(regionalPerkUnlocked('nether')?.95:.78):1;
}
function regionalDamageTaken(value){
 return regionalPerkUnlocked('frost')?Math.max(1,Math.ceil(value*.94)):value;
}
function regionalOnHostileHit(projectile,now){
 if(!regionalStatus||!projectile.affliction)return;
 if(projectile.affliction==='frost'){
  regionalStatus.frostUntil=Math.max(regionalStatus.frostUntil,now+2200);
  damageTexts.push({x:player.x,y:player.y-34,text:'❄️ 霜寒减速',life:.85,color:'#c0f8ff'});
 }else if(projectile.affliction==='ember'){
  regionalStatus.emberUntil=Math.max(regionalStatus.emberUntil,now+2300);
  regionalStatus.emberTick=Math.max(regionalStatus.emberTick,now+620);
  damageTexts.push({x:player.x,y:player.y-34,text:'🔥 灼伤',life:.85,color:'#ffc68f'});
 }else if(projectile.affliction==='nether'){
  regionalStatus.netherUntil=Math.max(regionalStatus.netherUntil,now+2600);
  damageTexts.push({x:player.x,y:player.y-34,text:'☯ 幽咒侵蚀',life:.85,color:'#e0c0ff'});
 }
}
function regionalPlayerTick(now){
 if(!regionalStatus||!running)return;
 if(now<regionalStatus.emberUntil&&now>=regionalStatus.emberTick){
  regionalStatus.emberTick=now+650;
  const taken=regionalDamageTaken(4);
  hp=Math.max(0,hp-taken);
  damageTexts.push({x:player.x,y:player.y-18,text:'灼烧 -'+taken,life:.6,color:'#ffac7e'});
  if(hp<=0)die();
 }
}
function regionalOnPlayerProjectileHit(enemy,now){
 if(!regionalPerkUnlocked('ember')||!enemy||enemy.hp<=0)return;
 // One non-stacking 3-second burn; per-enemy time fields are reset on respawn.
 enemy.regionalBurnUntil=Math.max(enemy.regionalBurnUntil||0,now+2700);
 enemy.regionalBurnTick=enemy.regionalBurnTick&&enemy.regionalBurnTick>now?enemy.regionalBurnTick:now+500;
}
function regionalCreatureTick(enemy,now){
 if(!enemy||enemy.hp<=0||!enemy.regionalBurnUntil||now>enemy.regionalBurnUntil)return false;
 if(now<(enemy.regionalBurnTick||0))return false;
 enemy.regionalBurnTick=now+650;
 const amount=Math.max(2,Math.min(12,4+Math.floor(level*.4)))*(enemy.armor||1);
 enemy.hp-=amount;enemy.hitFlash=now+130;
 damageTexts.push({x:enemy.x,y:enemy.y-32,text:'灼烧 -'+Math.round(amount),life:.7,color:'#ffb07c'});
 if(enemy.hp<=0){killEnemy(enemy,false);return true}
 return false;
}
function regionShoot(enemy,angle,speed,damage,status,now,life=1.8){
 projectiles.push({x:enemy.x,y:enemy.y,
  vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,
  life,damage,hostile:true,affliction:status});
}
function updateRegionalCreature(enemy,hero,dt,now,weak){
 const id=enemy.species;
 if(!REGIONAL_SPECIES[id])return false;
 const dx=hero.x-enemy.x,dy=hero.y-enemy.y,d=Math.max(1,Math.hypot(dx,dy)),a=Math.atan2(dy,dx);
 let mx=0,my=0,speed=45;
 if(weak){
  if(d<320){mx=-dx/d;my=-dy/d;speed=95}
  else{mx=Math.cos(enemy.t*.8+enemy.wander);my=Math.sin(enemy.t*.7+enemy.wander);speed=13}
 }else if(id==='frost_stag'){
  if(d<350){
   const forward=d>210?.64:d<128?-.95:0;
   const side=Math.sin(enemy.t*2.3+enemy.wander)>.0?.75:-.75;
   mx=dx/d*forward-dy/d*side;my=dy/d*forward+dx/d*side;speed=76;
   if(d<320&&now>enemy.shot){
    enemy.shot=now+2700;
    regionShoot(enemy,a-.09,210,7+enemy.tier*1.4,'frost',now);
    regionShoot(enemy,a+.09,210,7+enemy.tier*1.4,'frost',now);
   }
  }else{mx=Math.cos(enemy.t*.64+enemy.wander);my=Math.sin(enemy.t*.64+enemy.wander);speed=15}
 }else if(id==='ember_scorpion'){
  if(d<310){
   mx=dx/d;my=dy/d;
   if(d<183&&now>enemy.rushReady){
    enemy.rushReady=now+3100;enemy.rushUntil=now+460;
   }
   speed=now<enemy.rushUntil?174:59;
   if(d<248&&now>enemy.shot){
    enemy.shot=now+3750;
    for(let i=-1;i<=1;i++)regionShoot(enemy,a+i*.25,178,8+enemy.tier*1.55,'ember',now,1.55);
   }
  }else{mx=Math.cos(enemy.t*.51+enemy.wander);my=Math.sin(enemy.t*.51+enemy.wander);speed=16}
 }else if(id==='nether_wisp'){
  if(d<355){
   const sign=Math.sin(enemy.t*2.6+enemy.wander)>.0?1:-1;
   mx=dx/d*.28-dy/d*.9*sign;my=dy/d*.28+dx/d*.9*sign;speed=86;
   if(d<315&&now>enemy.shot){
    enemy.shot=now+2800;
    regionShoot(enemy,a,243,9+enemy.tier*1.7,'nether',now,1.7);
   }
   if(d>65&&d<285&&now>enemy.rushReady){
    enemy.rushReady=now+5300;
    const offset=a+Math.PI+Math.sin(enemy.t)*.9;
    const tx=hero.x+Math.cos(offset)*175,ty=hero.y+Math.sin(offset)*175;
    if(tx>50&&ty>50&&tx<SIZE-50&&ty<SIZE-50&&!terrainBlocked(tx,ty)){
     enemy.x=tx;enemy.y=ty;
     particles.push({x:tx,y:ty,vx:0,vy:-15,life:.6,color:'#d7b7ff'});
     return true;
    }
   }
  }else{mx=Math.cos(enemy.t*.73+enemy.wander);my=Math.sin(enemy.t*.63+enemy.wander);speed=18}
 }
 const length=Math.hypot(mx,my);
 if(length>0){
  const nx=Math.max(22,Math.min(SIZE-22,enemy.x+mx/length*speed*dt));
  const ny=Math.max(22,Math.min(SIZE-22,enemy.y+my/length*speed*dt));
  if(!terrainBlocked(nx,ny)){enemy.x=nx;enemy.y=ny}
  else{if(!terrainBlocked(nx,enemy.y))enemy.x=nx;if(!terrainBlocked(enemy.x,ny))enemy.y=ny}
 }
 return true;
}
function seedRegionalCreatures(){
 const areas=[
  {region:1,x:[170,790],y:[185,1020],species:'frost_stag'},
  {region:2,x:[2590,3410],y:[220,1620],species:'ember_scorpion'},
  {region:3,x:[2350,3420],y:[2640,3430],species:'nether_wisp'}
 ];
 let serial=7000;
 for(const area of areas){
  let placed=0;
  for(let tries=0;tries<140&&placed<6;tries++){
   const x=area.x[0]+terrainHash(serial+tries,area.region,91)*(area.x[1]-area.x[0]);
   const y=area.y[0]+terrainHash(serial+tries,area.region,92)*(area.y[1]-area.y[0]);
   if(biome(x,y)!==area.region||terrainBlocked(x,y)||onQinglanRoad(x,y)||isAdventureClearing(x,y,85))continue;
   if(enemies.some(e=>Math.hypot(e.x-x,e.y-y)<66))continue;
   const monster=makeCreature(x,y,serial++,area.species);
   enemies.push(monster);placed++;
  }
 }
}
function paintRegionalProjectile(projectile,now){
 if(!projectile.affliction)return false;
 const palette={
  frost:['#efffff','#9adbe8','#548ba9'],
  ember:['#ffe6a1','#f1a65c','#c45246'],
  nether:['#eee0ff','#bd97e7','#6e57ac']
 }[projectile.affliction];
 if(!palette)return false;
 const ang=Math.atan2(projectile.vy,projectile.vx);
 ctx.save();ctx.translate(projectile.x,projectile.y);ctx.rotate(ang);
 ctx.globalAlpha=.33;ctx.fillStyle=palette[2];ctx.beginPath();ctx.ellipse(-10,0,17,8,0,0,Math.PI*2);ctx.fill();
 ctx.globalAlpha=1;ctx.fillStyle=palette[1];ctx.beginPath();ctx.arc(0,0,8,0,Math.PI*2);ctx.fill();
 ctx.fillStyle=palette[0];ctx.beginPath();ctx.arc(2,-2,4,0,Math.PI*2);ctx.fill();
 if(projectile.affliction==='frost'){
  ctx.strokeStyle=palette[0];ctx.lineWidth=1.5;
  ctx.beginPath();ctx.moveTo(-8,-8);ctx.lineTo(4,6);ctx.moveTo(-5,7);ctx.lineTo(4,-7);ctx.stroke();
 }
 ctx.restore();return true;
}
function paintRegionalPlayerStatus(now){
 if(!regionalStatus)return;
 let mode=now<regionalStatus.frostUntil?'frost':now<regionalStatus.emberUntil?'ember':now<regionalStatus.netherUntil?'nether':null;
 if(!mode)return;
 const colors={frost:'#a7f5f9',ember:'#ffb66d',nether:'#c89ef6'};
 ctx.save();ctx.globalAlpha=.35+.12*Math.sin(now*.01);ctx.lineWidth=2.2;ctx.strokeStyle=colors[mode];
 ctx.beginPath();ctx.ellipse(player.x,player.y+1,27,15,0,0,Math.PI*2);ctx.stroke();
 ctx.restore();
}
function regionalJournalMarkup(){
 if(!regionalState)return '';
 const lines=Object.entries(REGIONAL_MATERIALS).map(([id,info])=>{
  const count=regionalState.materials[id],unlocked=count>=info.threshold;
  return '<div class="adventureLine"><b>'+info.name+' · '+info.creature+'</b>　'+
  (unlocked?'✅ '+info.perk:'收集 '+Math.min(count,info.threshold)+'/'+info.threshold)+
  '<small>'+info.region+' · '+info.effect+'</small></div>';
 });
 return '<div class="adventureSectionTitle">三境灵材 · 永久功法</div>'+lines.join('');
}
