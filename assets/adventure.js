/* 灵蛇问道 V6.0 · 道途游历
 * Goal: a lightweight, persistent main quest + automatic bounty rewards,
 * and three mechanically distinct regional trials (collect / dodge / combat).
 * Save only optional V4 fields; on older saves infer completed prior encounters.
 */
const ADVENTURE_TRIALS=[
 {id:'frost',name:'寒镜遗迹',region:'寒霜雪境',x:465,y:680,requiredLevel:3,
  title:'寒镜凝华',desc:'限时收集四枚寒魄',duration:35,color:'#baf6f7',art:'assets/frost-mirror.svg'},
 {id:'ember',name:'赤炎古柱',region:'赤炎荒漠',x:2910,y:950,requiredLevel:5,
  title:'踏火取砂',desc:'避开火环，拾取四枚炎晶',duration:36,color:'#ffd28b',art:'assets/ember-pillar.svg'},
 {id:'nether',name:'幽冥封印',region:'幽冥魔域',x:2700,y:3290,requiredLevel:7,
  title:'破除幽咒',desc:'限时击败三只封印守卫',duration:55,color:'#d9b5ff',art:'assets/nether-seal.svg'}
];
const ADVENTURE_ART={};
for(const trial of ADVENTURE_TRIALS){const im=new Image();im.src=trial.art;ADVENTURE_ART[trial.id]=im}
const ADVENTURE_CHAPTERS=[
 {name:'第一卷 · 灵根初醒',hint:'收集灵果 5 枚',metric:'fruit',need:5,xp:75},
 {name:'第二卷 · 群妖试炼',hint:'击败或吞噬妖兽 4 只',metric:'kills',need:4,xp:120},
 {name:'第三卷 · 青岚三缘',hint:'感悟灵泉、灵木、青岚祠',metric:'sites',need:3,xp:150,sigil:1},
 {name:'第四卷 · 苍牙祸乱',hint:'击败青岚霸主苍牙狼王',metric:'wolf',need:1,xp:260,sigil:1},
 {name:'第五卷 · 山海行旅',hint:'踏足寒霜、荒漠和幽冥三境',metric:'regions',need:3,xp:240},
 {name:'第六卷 · 三境道试',hint:'完成寒镜、踏火和封印试炼',metric:'trials',need:3,xp:420,sigil:2},
 {name:'终卷 · 蛟龙问道',hint:'进化为蛟龙或真龙',metric:'form',need:3,xp:350,sigil:2}
];
const ADVENTURE_BOUNTIES=[
 {kind:'species',target:'hare',name:'玉耳寻踪',label:'吞噬或击败灵兔',need:4,xp:85,essence:1},
 {kind:'species',target:'fox',name:'赤狐追猎',label:'击败狐妖',need:3,xp:110,essence:1},
 {kind:'fruit',name:'采集灵果',label:'拾取灵果',need:7,xp:110,essence:1},
 {kind:'species',target:'wolf',name:'清剿山狼',label:'击败山狼',need:3,xp:155,essence:2},
 {kind:'species',target:'tortoise',name:'破甲修行',label:'击败岩龟',need:2,xp:190,essence:2,sigil:1},
 {kind:'species',target:'bat',name:'净化幽羽',label:'击败妖蝠',need:3,xp:165,essence:2,sigil:1}
];
let adventureState=null,adventureSession=null,adventureBookOpen=false;
let adventureTracked='story',lastAdventureHud='',lastAdventureRender=0,lastAdventureUi=0;
function boundedNumber(v,limit=100000){return Number.isFinite(v)?Math.max(0,Math.min(limit,Math.floor(v))):0}
function resetAdventure(){
 adventureState={chapter:0,fruits:0,kills:0,siteIds:[],regionIds:[],trialWins:[],
  wolf:false,sigils:0,commissionCycle:0,commissionProgress:0,trialCounts:{},trialReadyAt:{}};
 adventureSession=null;adventureBookOpen=false;adventureTracked='story';
 lastAdventureHud='';lastAdventureRender=0;lastAdventureUi=0;
 const panel=document.getElementById('adventureJournal');if(panel)panel.style.display='none';
}
function restoreAdventure(saved){
 if(!adventureState)resetAdventure();
 const x=saved?.adventure;
 const S=adventureState;
 S.chapter=boundedNumber(x?.chapter,ADVENTURE_CHAPTERS.length);
 S.fruits=boundedNumber(x?.fruits);
 S.kills=boundedNumber(x?.kills??saved?.kills);
 S.siteIds=[...new Set((Array.isArray(x?.siteIds)?x.siteIds:encounterState?.visited||[]).filter(i=>QINGLAN_SITES.some(s=>s.id===i)))];
 S.regionIds=[...new Set((Array.isArray(x?.regionIds)?x.regionIds:[]).filter(v=>[1,2,3].includes(v)))];
 S.trialWins=[...new Set((Array.isArray(x?.trialWins)?x.trialWins:[]).filter(id=>ADVENTURE_TRIALS.some(t=>t.id===id)))];
 S.wolf=!!(x?.wolf||saved?.qinglanBossDefeated);
 S.sigils=boundedNumber(x?.sigils,60);
 S.commissionCycle=boundedNumber(x?.commissionCycle,9999);
 S.commissionProgress=boundedNumber(x?.commissionProgress,999);
 S.trialCounts=(x?.trialCounts&&typeof x.trialCounts==='object'&&!Array.isArray(x.trialCounts))?{...x.trialCounts}:{};
 S.trialReadyAt=(x?.trialReadyAt&&typeof x.trialReadyAt==='object'&&!Array.isArray(x.trialReadyAt))?{...x.trialReadyAt}:{};
 if(player){const here=biome(player.x,player.y);if(here!==0&&!S.regionIds.includes(here))S.regionIds.push(here)}
 adventureSession=null;adventureBookOpen=false;adventureTracked='story';lastAdventureHud='';
 lastAdventureUi=0;refreshAdventurePanel();updateAdventureHUD(true);
}
function adventureSaveFields(){
 const S=adventureState;if(!S)return {};
 return {adventure:{
  chapter:S.chapter,fruits:S.fruits,kills:S.kills,siteIds:[...S.siteIds],
  regionIds:[...S.regionIds],trialWins:[...S.trialWins],wolf:S.wolf,
  sigils:S.sigils,commissionCycle:S.commissionCycle,
  commissionProgress:S.commissionProgress,trialCounts:{...S.trialCounts},
  trialReadyAt:{...S.trialReadyAt}
 }};
}
function adventureCurrentBounty(){return ADVENTURE_BOUNTIES[(adventureState?.commissionCycle||0)%ADVENTURE_BOUNTIES.length]}
function adventureChapterProgress(chapter=adventureState?.chapter||0){
 const S=adventureState;if(!S||chapter>=ADVENTURE_CHAPTERS.length)return 0;
 const m=ADVENTURE_CHAPTERS[chapter].metric;
 if(m==='fruit')return S.fruits;
 if(m==='kills')return S.kills;
 if(m==='sites')return S.siteIds.length;
 if(m==='wolf')return S.wolf?1:0;
 if(m==='regions')return S.regionIds.length;
 if(m==='trials')return S.trialWins.length;
 if(m==='form')return evoStage;
 return 0;
}
function adventureSpeedBonus(){return 1+Math.min(10,adventureState?.sigils||0)*.012}
function adventureAttackBonus(){return 1+Math.min(12,adventureState?.sigils||0)*.026}
function adventureReward(xp,sigils=0,essences=0,points=0){
 if(xp>0)gain(xp);
 if(sigils>0)adventureState.sigils=Math.min(60,adventureState.sigils+sigils);
 if(essences>0)essence+=essences;
 if(points>0){evoPoints+=points;triggerEvolutionIfReady()}
}
function updateAdventureAchievements(){
 const S=adventureState;
 if(!S||!running)return;
 let changed=false,lastTitle='';
 for(let i=0;i<ADVENTURE_CHAPTERS.length+1;i++){
  const chapter=ADVENTURE_CHAPTERS[S.chapter];
  if(!chapter||adventureChapterProgress()<chapter.need)break;
  S.chapter++;changed=true;lastTitle=chapter.name;
  adventureReward(chapter.xp,chapter.sigil||0,1,0);
 }
 if(changed){
  flash('📜 道途完成 · '+lastTitle);
  toast('📜 '+lastTitle+'完成，获得修为与道纹');
  saveGame(true);
  refreshAdventurePanel();
  updateAdventureHUD(true);
 }
}
function completeAdventureCommission(){
 if(!adventureState||!running)return;
 const S=adventureState,old=adventureCurrentBounty();
 S.commissionCycle++;S.commissionProgress=0;
 adventureReward(old.xp,old.sigil||0,old.essence||0,0);
 flash('🎯 悬赏达成 · '+old.name);
 toast('🎯 '+old.name+'完成！修为 +'+old.xp+'，灵蕴 +'+(old.essence||0));
 saveGame(true);
 updateAdventureHUD(true);refreshAdventurePanel();
}
function adventureTrack(kind,subject){
 if(!adventureState||!running)return;
 const S=adventureState;
 if(kind==='fruit')S.fruits++;
 if(kind==='kill')S.kills++;
 if(kind==='site'&&QINGLAN_SITES.some(s=>s.id===subject)&&!S.siteIds.includes(subject))S.siteIds.push(subject);
 if(kind==='region'&&[1,2,3].includes(subject)&&!S.regionIds.includes(subject)){
  S.regionIds.push(subject);
  flash('🗺️ 初访 '+biomes[subject].name);
  toast('🗺️ 解锁地域：'+biomes[subject].name);
 }
 if(kind==='wolf')S.wolf=true;
 if(kind==='trial'&&ADVENTURE_TRIALS.some(t=>t.id===subject)&&!S.trialWins.includes(subject))S.trialWins.push(subject);
 const b=adventureCurrentBounty();
 const match=(b.kind==='fruit'&&kind==='fruit')||(b.kind==='species'&&kind==='kill'&&subject===b.target);
 if(match)S.commissionProgress++;
 if(match&&S.commissionProgress>=b.need)completeAdventureCommission();
 updateAdventureAchievements();
}
function adventureOnFruit(kind){adventureTrack('fruit',kind)}
function adventureOnKill(enemy){adventureTrack('kill',enemy.species)}
function adventureOnSite(id){adventureTrack('site',id)}
function adventureOnWolf(){adventureTrack('wolf')}
function adventureOnRegion(region){if(adventureState&&[1,2,3].includes(region)&&!adventureState.regionIds.includes(region))adventureTrack('region',region)}
function adventureOnForm(){updateAdventureAchievements()}
function adventureOnTrialWin(id){adventureTrack('trial',id)}
function isAdventureClearing(x,y,pad=0){
 return ADVENTURE_TRIALS.some(t=>Math.hypot(x-t.x,y-t.y)<102+pad);
}
function isAdventureBlocked(x,y){
 return ADVENTURE_TRIALS.some(t=>Math.hypot(x-t.x,y-t.y+5)<17);
}
function nearbyAdventureTrial(){
 if(!player)return null;
 for(const t of ADVENTURE_TRIALS)if(Math.hypot(player.x-t.x,player.y-t.y)<92)return t;
 return null;
}
function adventureTrialReady(trial){
 return Date.now()>=(adventureState?.trialReadyAt?.[trial.id]||0);
}
function adventureDropOrbs(t){
 const offsets=[[69,2],[52,61],[-58,51],[-80,-17],[-18,-74],[37,-67]];
 const orbs=[];
 for(const [dx,dy] of offsets){
  const x=t.x+dx,y=t.y+dy;
  if(x<35||y<35||x>SIZE-35||y>SIZE-35||terrainBlocked(x,y))continue;
  orbs.push({x,y,found:false});
 }
 return orbs;
}
function startAdventureTrial(trial){
 if(!running)return;
 if(adventureBookOpen){toast('先关闭游历簿再开始试炼');return}
 if(adventureSession){toast('先完成当前试炼，再开启下一处');return}
 if(level<trial.requiredLevel){toast('🔒 '+trial.name+'需要修炼至 '+trial.requiredLevel+' 阶');return}
 if(!adventureTrialReady(trial)){toast('⌛ '+trial.name+'尚在凝聚灵气');return}
 const now=performance.now(),orbs=trial.id==='nether'?[]:adventureDropOrbs(trial);
 if(trial.id!=='nether'&&orbs.length<4){toast('试炼场地暂不可用，请稍后重试');return}
 adventureSession={id:trial.id,start:now,deadline:now+trial.duration*1000,
  orbs,collected:0,killed:0,damageAt:0,hazards:[],active:true};
 if(trial.id==='nether'){
  const offsets=[[70,35],[-67,42],[12,-81]];
  for(let i=0;i<3;i++){
   let x=trial.x+offsets[i][0],y=trial.y+offsets[i][1];
   if(terrainBlocked(x,y)){x=trial.x+72-i*28;y=trial.y+62}
   const e=makeCreature(x,y,830+i);
   e.species='bat';e.tier=Math.max(3,level-1);e.r=17;e.hp=e.max=60+level*5;
   e.elite=i===2;e.armor=1;e.trialToken='nether';
   enemies.push(e);
  }
 }
 toast('⛩️ '+trial.title+'开始！'+trial.desc+'，限时 '+trial.duration+' 秒');
 flash('⛩️ '+trial.name);
 updateAdventureHUD(true);refreshAdventurePanel();
}
function activateAdventureTrial(){
 const trial=nearbyAdventureTrial();
 if(!trial){toast('靠近三境试炼碑后再尝试开启');return}
 startAdventureTrial(trial);
}
function removeAdventureTrialEnemies(){
 for(let i=enemies.length-1;i>=0;i--)if(enemies[i].trialToken)enemies.splice(i,1);
}
function endAdventureTrial(won){
 const session=adventureSession;
 if(!session)return;
 const t=ADVENTURE_TRIALS.find(item=>item.id===session.id);
 adventureSession=null;removeAdventureTrialEnemies();
 if(won){
  const S=adventureState;
  S.trialCounts[t.id]=(boundedNumber(S.trialCounts[t.id],10000)+1);
  const first=!S.trialWins.includes(t.id);
  S.trialReadyAt[t.id]=Date.now()+120000;
  adventureReward(first?190+level*12:90+level*6,first?1:0,2,first?3:1);
  adventureOnTrialWin(t.id);
  flash('🏆 试炼通过 · '+t.title);
  toast('🏆 '+t.name+'通过！'+(first?'获得首次秘境奖励':'获得重修奖励'));
  saveGame(true);
 }else{
  toast('⌛ '+t.name+'试炼结束，返回碑前可以重试');
 }
 updateAdventureHUD(true);refreshAdventurePanel();
}
function adventureOnTrialEnemy(enemy){
 if(!adventureSession||enemy.trialToken!==adventureSession.id)return;
 adventureSession.killed++;
 if(adventureSession.killed>=3)endAdventureTrial(true);
}
function adventureTick(dt,now){
 if(!running||!adventureState)return;
 adventureOnRegion(biome(player.x,player.y));
 // Chapter progression can depend on evolution gained through other rewards.
 if(adventureState.chapter===ADVENTURE_CHAPTERS.length-1&&evoStage>=3)updateAdventureAchievements();
 const s=adventureSession;if(!s)return;
 if(now>s.deadline){endAdventureTrial(false);return}
 const t=ADVENTURE_TRIALS.find(item=>item.id===s.id);
 if(s.id!=='nether'){
  for(const orb of s.orbs){
   if(!orb.found&&Math.hypot(player.x-orb.x,player.y-orb.y)<22){
    orb.found=true;s.collected++;
    damageTexts.push({x:orb.x,y:orb.y-20,text:'灵晶 '+s.collected+'/4',life:.9,color:t.color});
    if(s.collected>=4){endAdventureTrial(true);return}
   }
  }
 }
 if(s.id==='ember'&&now>s.damageAt&&now>invuln){
  let hit=false;
  for(let i=0;i<3;i++){
   const angle=(now-s.start)*.0011+i*Math.PI*2/3;
   const x=t.x+Math.cos(angle)*69,y=t.y+Math.sin(angle)*69;
   if(Math.hypot(x-player.x,y-player.y)<28){hit=true;break}
  }
  if(hit){
   const taken=encounterDamageTaken(9+Math.floor(level*.35),now);
   hp-=taken;s.damageAt=now+700;invuln=now+600;
   damageTexts.push({x:player.x,y:player.y-22,text:'灼烧 -'+taken,life:.8,color:'#ffab82'});
   if(hp<=0){hp=0;die()}
  }
 }
}
function paintAdventureWorld(now){
 ctx.save();
 for(const t of ADVENTURE_TRIALS){
  if(!inView(t.x,t.y,170))continue;
  const img=ADVENTURE_ART[t.id],done=adventureState?.trialWins?.includes(t.id);
  ctx.globalAlpha=qualityMode==='smooth'?.13:.23;
  ctx.fillStyle=t.color;ctx.beginPath();ctx.ellipse(t.x,t.y,58,23,0,0,Math.PI*2);ctx.fill();
  ctx.globalAlpha=1;
  if(img.complete&&img.naturalWidth)ctx.drawImage(img,t.x-57,t.y-143,114,143);
  else{ctx.fillStyle=t.color;ctx.fillRect(t.x-12,t.y-85,24,80)}
  ctx.textAlign='center';ctx.font='bold 13px serif';
  ctx.strokeStyle='#152a39';ctx.lineWidth=3;ctx.fillStyle=done?'#b2bfc9':t.color;
  ctx.strokeText(t.name+(done?' · 已破':' · 试炼'),t.x,t.y-150);
  ctx.fillText(t.name+(done?' · 已破':' · 试炼'),t.x,t.y-150);
 }
 const s=adventureSession;if(s){
  const t=ADVENTURE_TRIALS.find(item=>item.id===s.id);
  for(const orb of s.orbs){
   if(orb.found||!inView(orb.x,orb.y,30))continue;
   const bob=Math.sin(now*.004+orb.x*.03)*4;
   ctx.save();ctx.translate(orb.x,orb.y+bob);
   ctx.globalAlpha=.22;ctx.fillStyle=t.color;
   ctx.beginPath();ctx.arc(0,0,15,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;
   ctx.fillStyle='#f9ffe6';ctx.beginPath();ctx.moveTo(0,-12);ctx.lineTo(9,0);ctx.lineTo(0,12);ctx.lineTo(-9,0);ctx.closePath();ctx.fill();
   ctx.strokeStyle=t.color;ctx.lineWidth=2;ctx.stroke();ctx.restore();
  }
  if(s.id==='ember'){
   for(let i=0;i<3;i++){
    const a=(now-s.start)*.0011+i*Math.PI*2/3,x=t.x+Math.cos(a)*69,y=t.y+Math.sin(a)*69;
    if(!inView(x,y,40))continue;
    ctx.save();ctx.strokeStyle='#ffbf79';ctx.fillStyle='#a93f3670';ctx.lineWidth=2;
    ctx.beginPath();ctx.ellipse(x,y,29,14,0,0,Math.PI*2);ctx.fill();ctx.stroke();
    ctx.restore();
   }
  }
 }
 ctx.restore();
}
function paintAdventureMinimap(){
 if(!adventureState)return;
 mc.save();
 for(const t of ADVENTURE_TRIALS){
  mc.fillStyle=adventureState.trialWins.includes(t.id)?'#95bcb2':t.color;
  let x=t.x/SIZE*112,y=t.y/SIZE*112;
  mc.fillRect(x-2,y-2,4,4);
 }
 const chapter=ADVENTURE_CHAPTERS[adventureState.chapter];
 const objective=adventureTracked==='story'?
   (chapter?.metric==='trials'?ADVENTURE_TRIALS.find(x=>!adventureState.trialWins.includes(x.id)):null):
   ADVENTURE_TRIALS.find(x=>x.id===adventureTracked);
 if(objective){
  const x=objective.x/SIZE*112,y=objective.y/SIZE*112;
  mc.strokeStyle='#ffe29e';mc.lineWidth=1.2;mc.strokeRect(x-4,y-4,8,8);
 }
 mc.restore();
}
function updateAdventureInteraction(now){
 const b=document.getElementById('interactBtn');if(!b)return;
 const t=nearbyAdventureTrial();
 if(t){
  b.style.display='block';
  b.textContent=level<t.requiredLevel?'🔒 '+t.requiredLevel+'阶解封':adventureSession?'⌛ 试炼进行中':adventureTrialReady(t)?'⛩️ 开启 · '+t.name:'⌛ 灵气恢复中';
  b.disabled=level<t.requiredLevel||!!adventureSession||!adventureTrialReady(t);
 }else{
  b.style.display=nearEncounterSite()?'block':'none';
 }
}
function adventureMainLabel(){
 const c=ADVENTURE_CHAPTERS[adventureState?.chapter||0];
 return !c?'七卷道途已通 · 开启自由修炼':c.name+'：'+c.hint+' ('+Math.min(c.need,adventureChapterProgress())+'/'+c.need+')';
}
function updateAdventureHUD(force=false){
 const S=adventureState;
 if(!S)return;
 const b=adventureCurrentBounty(),label='📜 '+adventureMainLabel()+'　|　🎯 '+b.name+' '+S.commissionProgress+'/'+b.need;
 const el=document.getElementById('adventureMini');
 if(el&&(force||lastAdventureHud!==label)){el.textContent=label;lastAdventureHud=label}
 const time=performance.now();
 const status=document.getElementById('trialStatus');
 if(status){const sess=adventureSession;
  status.textContent=sess?'试炼 · '+ADVENTURE_TRIALS.find(t=>t.id===sess.id).name+' '+Math.max(0,Math.ceil((sess.deadline-time)/1000))+'秒　'+(sess.id==='nether'?sess.killed:sess.collected)+'/'+(sess.id==='nether'?3:4):'';
  status.style.display=sess?'block':'none';
 }
 if(adventureBookOpen&&time-lastAdventureRender>1000)refreshAdventurePanel();
}
function refreshAdventurePanel(){
 if(!adventureBookOpen||!adventureState)return;
 const s=adventureState,el=document.getElementById('adventureBody');if(!el)return;
 const b=adventureCurrentBounty(),chapter=ADVENTURE_CHAPTERS[s.chapter];
 const story=chapter?chapter.name+' · '+chapter.hint+'：'+Math.min(adventureChapterProgress(),chapter.need)+' / '+chapter.need:'七卷主线已全部完成';
 const trials=ADVENTURE_TRIALS.map(t=>{
  let done=s.trialWins.includes(t.id),unlocked=level>=t.requiredLevel;
  return '<div class="adventureLine"><b>'+t.name+'</b> · '+t.region+' · '+(done?'已通关':unlocked?'可开启':'需要 '+t.requiredLevel+' 阶')+
   '<small>'+t.desc+'</small><button class="trackBtn" data-trial="'+t.id+'">追踪</button></div>';
 }).join('');
 el.innerHTML='<p><strong>📜 修仙主线</strong><span>'+story+'</span></p>'+
 '<p><strong>🎯 巡山悬赏</strong><span>'+b.label+' '+s.commissionProgress+'/'+b.need+'，自动结算</span></p>'+
 '<p><strong>🐉 道纹</strong><span>'+s.sigils+' 枚 · 攻击+'+Math.round((adventureAttackBonus()-1)*100)+'% · 移速+'+Math.round((adventureSpeedBonus()-1)*100)+'%</span></p>'+
 '<p><strong>🗺️ 游历进度</strong><span>发现 '+s.regionIds.length+'/3 个外境 · 通过 '+s.trialWins.length+'/3 处试炼</span></p>'+
 '<div class="adventureSectionTitle">三境试炼</div>'+trials+
 '<p class="adventureHint">主线、悬赏完成后自动领取奖励，不需要频繁确认。靠近试炼碑后点击屏幕的互动按钮即可参加挑战。</p>';
 for(const btn of el.querySelectorAll?.('.trackBtn')||[])btn.addEventListener('click',()=>{adventureTracked=btn.dataset.trial;toggleAdventureBook(false);toast('🧭 已在小地图标记 '+ADVENTURE_TRIALS.find(t=>t.id===adventureTracked).name)});
 lastAdventureRender=performance.now();
}
function toggleAdventureBook(force){
 const intended=typeof force==='boolean'?force:!adventureBookOpen;
 // Timed events use real elapsed time: do not let a modal secretly consume the deadline.
 if(intended&&adventureSession){toast('试炼进行中，先完成当前挑战再查看游历簿');return}
 adventureBookOpen=intended;
 const panel=document.getElementById('adventureJournal');if(panel)panel.style.display=adventureBookOpen?'flex':'none';
 refreshAdventurePanel();
}
