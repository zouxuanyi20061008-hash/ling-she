/* Ling She V5.9 - Qinglan encounters and regional challenge.
 * Main game's V4 save remains the canonical key/version. These are optional
 * additive fields, so old saves continue to load without migration.
 * Geometry, encounter UI, rewards and boss use the same world coordinates.
 */
const QINGLAN_SITES=[
 {id:'spring',x:1900,y:2170,clear:110,name:'碧泉灵汐',short:'灵泉',description:'灵泉护体 · 恢复气血',art:'assets/spirit-spring.svg',w:154,h:99,color:'#9fe9db'},
 {id:'wood',x:2440,y:2225,clear:104,name:'千年灵木',short:'灵木',description:'木灵附体 · 灵息增强',art:'assets/ancient-lingwood.svg',w:155,h:180,color:'#c2eca1'},
 {id:'shrine',x:2080,y:1716,clear:87,name:'青岚祠',short:'青岚祠',description:'祠堂悟道 · 修炼加速',art:null,w:0,h:0,color:'#f2deb4'}
];
const AZURE_LAIR={x:2850,y:2330,r:48,arena:115,maxHp:430,name:'苍牙狼王'};
const QINGLAN_SITE_IMAGES={};
for(const site of QINGLAN_SITES){
 if(site.art){const image=new Image();image.src=site.art;QINGLAN_SITE_IMAGES[site.id]=image}
}
const azureKingArt=new Image();azureKingArt.src='assets/azure-wolf-king.svg';
let encounterState=null,encounterBuffs=null,azureKing=null,lastEncounterUiText='',lastNearbyId='',lastEncounterTip=0;
function resetEncounters(){
 encounterState={visited:[],bossDefeated:false,cooldowns:{}};
 encounterBuffs={spring:0,wood:0,shrine:0};
 azureKing={x:AZURE_LAIR.x,y:AZURE_LAIR.y,hp:AZURE_LAIR.maxHp,max:AZURE_LAIR.maxHp,
   r:AZURE_LAIR.r,defeated:false,hitFlash:0,hitReady:0,howlReady:0,
   chargeReady:0,chargeTell:0,chargeAngle:0,chargeUntil:0,chargeDx:0,chargeDy:0,active:false,phase:1};
 lastEncounterUiText='';lastNearbyId='';lastEncounterTip=0;
}
function restoreEncounters(data){
 if(!encounterState)resetEncounters();
 const visited=Array.isArray(data?.qinglanSites)?data.qinglanSites.filter(id=>QINGLAN_SITES.some(site=>site.id===id)):[];
 encounterState.visited=[...new Set(visited)];
 encounterState.bossDefeated=!!data?.qinglanBossDefeated;
 azureKing.defeated=encounterState.bossDefeated;
 azureKing.hp=azureKing.defeated?0:AZURE_LAIR.maxHp;
 lastEncounterUiText='';
}
function encounterSaveFields(){
 return {qinglanSites:encounterState?.visited?.slice()||[],
         qinglanBossDefeated:!!encounterState?.bossDefeated};
}
function isEncounterClearing(x,y,pad=0){
 for(const site of QINGLAN_SITES){
  if(Math.hypot(x-site.x,y-site.y)<site.clear+pad)return true;
 }
 return Math.hypot(x-AZURE_LAIR.x,y-AZURE_LAIR.y)<AZURE_LAIR.arena+pad;
}
function isEncounterBlocked(x,y){
 const spring=QINGLAN_SITES[0],wood=QINGLAN_SITES[1];
 const dx=(x-spring.x)/45,dy=(y-(spring.y-9))/20;
 return dx*dx+dy*dy<1||Math.hypot(x-wood.x,y-wood.y)<18;
}
function nearEncounterSite(){
 if(!player)return null;
 let nearest=null,dist=Infinity;
 for(const site of QINGLAN_SITES){
  const d=Math.hypot(player.x-site.x,player.y-site.y);
  if(d<90&&d<dist){nearest=site;dist=d}
 }
 return nearest;
}
function rewardEncounter(site){
 if(!running)return;
 const now=performance.now();
 if(Math.hypot(player.x-site.x,player.y-site.y)>90)return;
 const first=!encounterState.visited.includes(site.id),ready=encounterState.cooldowns[site.id]||0;
 if(!first&&now<ready){
  toast(site.short+'灵气尚未恢复，还有 '+Math.ceil((ready-now)/1000)+' 秒');
  return;
 }
 encounterBuffs[site.id]=now+90000; // 90s ephemeral blessing.
 encounterState.cooldowns[site.id]=now+125000;
 if(first)encounterState.visited.push(site.id);
 if(site.id==='spring'){
  const before=hp;hp=Math.min(100+level*10,hp+62);
  if(first)gain(65);
  toast('💧 碧泉灵汐：气血 +'+Math.round(hp-before)+'，90秒减伤'+(first?'，首次修为 +65':''));
 }else if(site.id==='wood'){
  if(first){gain(85);evoPoints+=2;triggerEvolutionIfReady()}
  toast('🌳 千年灵木：90秒灵息伤害提升'+(first?'，首次修为 +85、进化点 +2':''));
 }else{
  if(first){gain(90);essence+=3}
  hp=Math.min(100+level*10,hp+25);
  toast('📜 青岚祠：90秒修炼加速'+(first?'，首次修为 +90、灵蕴 +3':''));
 }
 const colors={spring:'#b2f7db',wood:'#cbe7a3',shrine:'#ffe2aa'};
 for(let i=0;i<12;i++){
  const a=i*Math.PI/6;
  particles.push({x:player.x,y:player.y,vx:Math.cos(a)*75,vy:Math.sin(a)*65,life:.8,color:colors[site.id]});
 }
 flash(first?'✨ 机缘发现 · '+site.short:'✨ 再获灵息');
 if(first){saveGame(true)}
 updateHud();updateEncounterUI(now,true);
}
function activateNearbyEncounter(){
 const site=nearEncounterSite();
 if(site)rewardEncounter(site);
 else toast('靠近地图上的灵泉、灵木或青岚祠，可感悟机缘');
}
function encounterExperienceBonus(now){
 return encounterBuffs&&now<encounterBuffs.shrine?1.3:1;
}
function encounterDamageBonus(now){
 return encounterBuffs&&now<encounterBuffs.wood?1.28:1;
}
function encounterDamageTaken(v,now){
 return encounterBuffs&&now<encounterBuffs.spring?Math.max(1,Math.ceil(v*.68)):v;
}
function updateEncounterUI(now,force=false){
 const e=document.getElementById('questText'),button=document.getElementById('interactBtn');
 if(!e||!button||!encounterState||!player)return;
 const n=encounterState.visited.length,done=encounterState.bossDefeated;
 let target=QINGLAN_SITES.find(site=>!encounterState.visited.includes(site.id));
 if(!target&&!done)target=AZURE_LAIR;
 let meters=target?Math.round(Math.hypot(target.x-player.x,target.y-player.y)):0;
 let text=done&&n===3?'青岚试炼完成 · 仙途初开':('青岚机缘 '+n+'/3 · '+(done?'狼王已讨伐':n===3?'讨伐苍牙狼王':'狼王未讨伐'))+
   (target?' · '+(target.name||'苍牙狼王')+' '+meters+'步':'');
 if(force||lastEncounterUiText!==text){e.textContent=text;lastEncounterUiText=text}
 const site=nearEncounterSite(),siteId=site?.id||'';
 if(siteId!==lastNearbyId||force){
  button.style.display=site?'block':'none';lastNearbyId=siteId;
 }
 if(site){
  const first=!encounterState.visited.includes(site.id),cooldown=encounterState.cooldowns[site.id]||0;
  const label=first?'✨ 感悟 · '+site.short:now<cooldown?'⏳ 灵气恢复中':'✨ 再访 · '+site.short;
  if(button.textContent!==label)button.textContent=label;
  button.disabled=!first&&now<cooldown;
 }
}
function paintEncounterSites(now){
 ctx.save();
 for(const site of QINGLAN_SITES){
  if(!inView(site.x,site.y,185))continue;
  const visited=encounterState?.visited?.includes(site.id),img=QINGLAN_SITE_IMAGES[site.id];
  const halo=site.id==='spring'?55:site.id==='wood'?45:39;
  ctx.globalAlpha=qualityMode==='smooth'?.15:.22;
  ctx.fillStyle=site.color;ctx.beginPath();ctx.ellipse(site.x,site.y,halo+Math.sin(now*.002)*4,halo*.36,0,0,Math.PI*2);ctx.fill();
  ctx.globalAlpha=1;
  if(img?.complete&&img.naturalWidth)ctx.drawImage(img,site.x-site.w/2,site.y-site.h,site.w,site.h);
  else if(site.id!=='shrine'){
   ctx.fillStyle=site.color;ctx.beginPath();ctx.arc(site.x,site.y-15,12,0,Math.PI*2);ctx.fill();
  }
  ctx.textAlign='center';ctx.font='bold 13px serif';
  ctx.fillStyle=visited?'#b4c5ad':'#fbefc7';
  ctx.strokeStyle='#142f2b';ctx.lineWidth=3;
  const label=site.short+(visited?' · 已感悟':' · 机缘');
  ctx.strokeText(label,site.x,site.y-site.h-9);
  ctx.fillText(label,site.x,site.y-site.h-9);
 }
 ctx.restore();
}
function updateAzureKing(dt,now){
 const b=azureKing;
 if(!b||b.defeated||!running)return;
 const d=Math.hypot(player.x-b.x,player.y-b.y),home=Math.hypot(b.x-AZURE_LAIR.x,b.y-AZURE_LAIR.y);
 if(d>470){
  b.active=false;
  if(home>5){
   let vx=(AZURE_LAIR.x-b.x)/home*50*dt,vy=(AZURE_LAIR.y-b.y)/home*50*dt;
   if(!terrainBlocked(b.x+vx,b.y+vy)){b.x+=vx;b.y+=vy}
  }
  return;
 }
 b.active=true;b.phase=b.hp<b.max*.5?2:1;
 if(now<b.chargeTell){ // flashing warning - boss stands still
 }else if(b.chargeTell&&now>=b.chargeTell){
  b.chargeTell=0;b.chargeUntil=now+420;
  b.chargeDx=Math.cos(b.chargeAngle)*230;
  b.chargeDy=Math.sin(b.chargeAngle)*230;
 }
 if(now<b.chargeUntil){
  let nx=b.x+b.chargeDx*dt,ny=b.y+b.chargeDy*dt;
  if(!terrainBlocked(nx,ny)){b.x=nx;b.y=ny}
 }else if(d>b.r+22){
  const speed=b.phase===2?64:46;
  let tx=b.x+(player.x-b.x)/d*speed*dt,ty=b.y+(player.y-b.y)/d*speed*dt;
  if(!terrainBlocked(tx,ty)){b.x=tx;b.y=ty}
 }
 if(d<265&&now>=b.chargeReady&&now>=b.chargeUntil){
  b.chargeReady=now+(b.phase===2?3100:4400);
  b.chargeAngle=Math.atan2(player.y-b.y,player.x-b.x);
  b.chargeTell=now+680;
 }
 if(b.phase===2&&d<335&&now>b.howlReady){
  b.howlReady=now+4600;
  const aim=Math.atan2(player.y-b.y,player.x-b.x);
  for(let i=-2;i<=2;i++){
   const a=aim+i*.24;
   projectiles.push({x:b.x,y:b.y,vx:Math.cos(a)*202,vy:Math.sin(a)*202,life:1.9,damage:12,hostile:true,wolfKing:true});
  }
 }
 const after=Math.hypot(player.x-b.x,player.y-b.y);
 if(after<b.r+14&&now>b.hitReady&&now>invuln){
  b.hitReady=now+1000;invuln=now+780;
  let damage=encounterDamageTaken(b.phase===2?19:14,now);
  hp-=damage;
  damageTexts.push({x:player.x,y:player.y-24,text:'狼王 -'+damage,life:.9,color:'#ffb5a3'});
  if(hp<=0){hp=0;die()}
 }
}
function hitAzureKingProjectile(p,now){
 const b=azureKing;
 if(!b||b.defeated||p.hostile)return false;
 if(Math.hypot(p.x-b.x,p.y-b.y)>b.r+12)return false;
 const applied=p.damage;
 b.hp-=applied;b.hitFlash=now+170;
 damageTexts.push({x:b.x,y:b.y-b.r-6,text:'-'+Math.round(applied),life:.9,color:'#fff0c4'});
 if(b.hp<=0)defeatAzureKing();
 return true;
}
function defeatAzureKing(){
 if(azureKing.defeated)return;
 azureKing.defeated=true;azureKing.hp=0;encounterState.bossDefeated=true;
 gain(380);evoPoints+=8;essence+=5;triggerEvolutionIfReady();
 flash('🏆 青岚霸主已伏诛');
 toast('🏆 苍牙狼王：+380修为，+8进化点，+5灵蕴');
 for(let i=0;i<22;i++){
  let a=i*Math.PI*2/22;
  particles.push({x:azureKing.x,y:azureKing.y,vx:Math.cos(a)*160,vy:Math.sin(a)*155,life:1.25,color:i%2?'#ffdf9b':'#bcf4d6'});
 }
 saveGame(true);updateEncounterUI(performance.now(),true);
}
function paintAzureKing(now){
 const b=azureKing;if(!b||b.defeated||!inView(b.x,b.y,145))return;
 ctx.save();
 ctx.fillStyle='#21353e9c';ctx.beginPath();ctx.ellipse(b.x+4,b.y+13,70,26,0,0,Math.PI*2);ctx.fill();
 if(b.chargeTell>now){
  ctx.globalAlpha=.48+.3*Math.sin(now*.035);ctx.strokeStyle='#ffad83';ctx.lineWidth=3;
  ctx.beginPath();ctx.arc(b.x,b.y,74,0,Math.PI*2);ctx.stroke();
  ctx.save();ctx.translate(b.x,b.y);ctx.rotate(b.chargeAngle);
  ctx.fillStyle='#e280644c';ctx.fillRect(14,-25,130,50);ctx.restore();
  ctx.globalAlpha=1;
 }
 if(azureKingArt.complete&&azureKingArt.naturalWidth){
  ctx.globalAlpha=now<b.hitFlash? .58:1;
  ctx.drawImage(azureKingArt,b.x-69,b.y-110,138,144);
  ctx.globalAlpha=1;
 }else{
  ctx.fillStyle='#618d86';ctx.beginPath();ctx.arc(b.x,b.y,40,0,Math.PI*2);ctx.fill();
 }
 const width=122,ratio=Math.max(0,b.hp/b.max);
 ctx.fillStyle='#152b32';ctx.fillRect(b.x-width/2,b.y-126,width,8);
 ctx.fillStyle=b.phase===2?'#ec986f':'#a5d4a4';ctx.fillRect(b.x-width/2,b.y-126,width*ratio,8);
 ctx.textAlign='center';ctx.fillStyle='#f6e7bd';ctx.font='bold 14px serif';
 ctx.fillText('青岚霸主 · 苍牙狼王'+(b.phase===2?' · 狂怒':''),b.x,b.y-137);
 ctx.restore();
}
function paintEncounterMinimap(){
 if(!encounterState)return;
 mc.save();
 for(const site of QINGLAN_SITES){
  const x=site.x/SIZE*112,y=site.y/SIZE*112;
  mc.fillStyle=encounterState.visited.includes(site.id)?'#98bc9e':'#fff0a3';
  mc.fillRect(x-2,y-2,4,4);
 }
 mc.fillStyle=encounterState.bossDefeated?'#8daca6':'#ef9878';
 mc.fillRect(AZURE_LAIR.x/SIZE*112-3,AZURE_LAIR.y/SIZE*112-3,6,6);
 mc.restore();
}
