/* 灵蛇问道 V6.1 · 智能任务引导
 * Default: compact exploration objective, transient combat collapse, no duplicate bars.
 * Navigation: world-grid A* around water, cliffs and landmarks; cached every 1.8s.
 * A compass points to the next walkable waypoint, not through the river.
 */
const GUIDE_GRID=80,GUIDE_SIDE=Math.ceil(SIZE/GUIDE_GRID);
const GUIDE_DIRS=[[1,0],[0,1],[-1,0],[0,-1],[1,1],[-1,1],[-1,-1],[1,-1]];
const GUIDE_OPTIONS=['smart','minimal','detailed'];
let guideMode='smart',guideObjective=null,guidePath=[],guideHeading=null;
let guidePathStamp=0,guideOrigin=null,guideTargetKey='',guideLastText='',guideLastCombat=false;
let guideLastNear=false,guideLastDrawAt=0;
function resetGuidance(){
 guideMode='smart';guideObjective=null;guidePath=[];guideHeading=null;
 guidePathStamp=0;guideOrigin=null;guideTargetKey='';guideLastText='';guideLastCombat=false;
 guideLastNear=false;guideLastDrawAt=0;
 const dock=document.getElementById('adventureDock');
 if(dock){dock.classList.remove('combat','guide-minimal','guide-detailed')}
 const edge=document.getElementById('guideArrow');if(edge)edge.style.display='none';
}
function restoreGuidance(v){
 guideMode=GUIDE_OPTIONS.includes(v)?v:'smart';
 guideObjective=null;guidePathStamp=0;guideTargetKey='';
 updateGuideModeUI();
}
function toggleGuidanceMode(){
 const i=GUIDE_OPTIONS.indexOf(guideMode);
 guideMode=GUIDE_OPTIONS[(i+1)%GUIDE_OPTIONS.length];
 guidePathStamp=0;guideLastText='';
 updateGuideModeUI();
 updateGuideHUD(performance.now(),true);
 if(running)saveGame(true);
}
function updateGuideModeUI(){
 const btn=document.getElementById('guideModeBtn');
 if(btn)btn.textContent='任务引导：'+({smart:'智能',minimal:'极简',detailed:'详细'}[guideMode]||'智能')+' ↻';
}
function guideClosest(items){
 if(!items?.length)return null;
 let closest=null,d=Infinity;
 for(const p of items){
  if(!p||!Number.isFinite(p.x)||!Number.isFinite(p.y))continue;
  let dist=Math.hypot(p.x-player.x,p.y-player.y);
  if(dist<d){d=dist;closest=p}
 }
 return closest;
}
function guideMainObjective(){
 if(!running||!player||!adventureState)return null;
 const S=adventureState;
 if(adventureSession){
  const session=adventureSession,trial=ADVENTURE_TRIALS.find(t=>t.id===session.id);
  const unfinished=session.id==='nether'?enemies.filter(e=>e.trialToken==='nether'):session.orbs.filter(o=>!o.found);
  const pick=guideClosest(unfinished);
  return {id:'active-'+session.id+(pick?'-'+Math.round(pick.x):''),title:session.id==='nether'?'清除封印守卫':'收集'+(session.id==='frost'?'寒魄':'炎晶'),
   kind:'trial',x:pick?.x??trial.x,y:pick?.y??trial.y,progress:(session.id==='nether'?session.killed:session.collected)+'/'+(session.id==='nether'?3:4),
   brief:trial.name,short:trial.name,priority:true};
 }
 // Advanced players get appropriate content instead of being forced to stare at beginner chores.
 if(S.chapter<4&&level>=7&&evoStage>=3){
  const t=[...ADVENTURE_TRIALS].reverse().find(x=>level>=x.requiredLevel&&!S.trialWins.includes(x.id));
  if(t)return {id:'recommended-'+t.id,title:'挑战'+t.name,kind:'recommended',x:t.x+34,y:t.y+36,
   progress:'高阶推荐',brief:'推荐挑战 · '+t.region,short:t.name};
 }
 const chapter=ADVENTURE_CHAPTERS[S.chapter];
 if(!chapter){
  const activeBounty=adventureCurrentBounty();
  if(activeBounty.kind==='fruit'){
   const fruit=guideClosest(fruits);
   return {id:'free-fruit',title:'收集灵果',kind:'bounty',x:fruit?.x,y:fruit?.y,
    progress:S.commissionProgress+'/'+activeBounty.need,brief:'巡山悬赏',short:'灵果'};
  }
  const foe=guideClosest(enemies.filter(e=>e.species===activeBounty.target));
  return {id:'free-'+activeBounty.target,title:activeBounty.label,kind:'bounty',x:foe?.x,y:foe?.y,
   progress:S.commissionProgress+'/'+activeBounty.need,brief:'巡山悬赏',short:activeBounty.name};
 }
 const progress=Math.min(chapter.need,adventureChapterProgress()),bar=progress+'/'+chapter.need;
 const metric=chapter.metric;
 if(metric==='fruit'){
  const fruit=guideClosest(fruits);
  return {id:'story-fruit',title:'收集灵果',kind:'story',x:fruit?.x,y:fruit?.y,progress:bar,brief:chapter.name,short:'灵果'};
 }
 if(metric==='kills'){
  const foe=guideClosest(enemies);
  return {id:'story-kills',title:'降伏附近妖兽',kind:'story',x:foe?.x,y:foe?.y,progress:bar,brief:chapter.name,short:'妖兽'};
 }
 if(metric==='sites'){
  const site=QINGLAN_SITES.find(s=>!S.siteIds.includes(s.id));
  return {id:'story-'+(site?.id||'site'),title:site?'感悟'+site.short:'感悟青岚机缘',kind:'story',
   x:site?site.x+43:undefined,y:site?site.y+49:undefined,progress:bar,brief:chapter.name,short:site?.short||'机缘'};
 }
 if(metric==='wolf'){
  return {id:'story-wolf',title:'讨伐苍牙狼王',kind:'story',x:AZURE_LAIR.x+60,y:AZURE_LAIR.y+40,
   progress:bar,brief:chapter.name,short:'狼王'};
 }
 if(metric==='regions'){
  const regionTargets=[
   {i:1,x:490,y:770,name:'寒霜雪境'},
   {i:2,x:2860,y:940,name:'赤炎荒漠'},
   {i:3,x:2750,y:3200,name:'幽冥魔域'}
  ];
  const region=regionTargets.find(r=>!S.regionIds.includes(r.i));
  return {id:'story-region-'+(region?.i||'done'),title:region?'探索'+region.name:'探索三境',
   kind:'story',x:region?.x,y:region?.y,progress:bar,brief:chapter.name,short:region?.name||'三境'};
 }
 if(metric==='trials'){
  const trial=ADVENTURE_TRIALS.find(t=>!S.trialWins.includes(t.id));
  return {id:'story-trial-'+(trial?.id||'done'),title:trial?'开启'+trial.name:'完成三境试炼',
   kind:'story',x:trial?trial.x+38:undefined,y:trial?trial.y+39:undefined,progress:bar,
   brief:trial&&level<trial.requiredLevel?'需'+trial.requiredLevel+'阶解封':chapter.name,short:trial?.name||'试炼'};
 }
 const foe=guideClosest(enemies);
 return {id:'story-form',title:'修炼化形·蛟龙',kind:'story',x:foe?.x,y:foe?.y,
   progress:Math.min(3,evoStage)+'/3',brief:chapter.name,short:'妖兽'};
}
function guideCellValid(i,j){
 return i>=0&&i<GUIDE_SIDE&&j>=0&&j<GUIDE_SIDE&&
  !terrainBlocked((i+.5)*GUIDE_GRID,(j+.5)*GUIDE_GRID);
}
function guideNearestCell(x,y){
 const i=Math.max(0,Math.min(GUIDE_SIDE-1,Math.floor(x/GUIDE_GRID)));
 const j=Math.max(0,Math.min(GUIDE_SIDE-1,Math.floor(y/GUIDE_GRID)));
 if(guideCellValid(i,j))return {i,j};
 for(let radius=1;radius<5;radius++){
  let pick=null,best=Infinity;
  for(let dx=-radius;dx<=radius;dx++)for(let dy=-radius;dy<=radius;dy++){
   if(Math.max(Math.abs(dx),Math.abs(dy))!==radius||!guideCellValid(i+dx,j+dy))continue;
   let dist=(dx+.5)*dx+(dy+.5)*dy;
   if(dist<best){best=dist;pick={i:i+dx,j:j+dy}}
  }
  if(pick)return pick;
 }
 return null;
}
function guidePathSearch(startX,startY,endX,endY){
 const start=guideNearestCell(startX,startY),goal=guideNearestCell(endX,endY);
 if(!start||!goal)return [];
 const n=GUIDE_SIDE,idx=(i,j)=>j*n+i;
 const begin=idx(start.i,start.j),finish=idx(goal.i,goal.j),total=n*n;
 if(begin===finish)return [{x:endX,y:endY}];
 const g=new Float32Array(total),parent=new Int32Array(total),closed=new Uint8Array(total);
 g.fill(Infinity);parent.fill(-1);g[begin]=0;
 const heap=[];
 const push=(node,priority)=>{
  const item=[node,priority];heap.push(item);let i=heap.length-1;
  while(i>0){let p=(i-1)>>1;if(heap[p][1]<=priority)break;heap[i]=heap[p];i=p}
  heap[i]=item;
 };
 const pop=()=>{
  const first=heap[0],last=heap.pop();if(!heap.length)return first;
  let i=0;
  while(true){let l=i*2+1;if(l>=heap.length)break;let r=l+1,k=r<heap.length&&heap[r][1]<heap[l][1]?r:l;
   if(last[1]<=heap[k][1])break;heap[i]=heap[k];i=k}
  heap[i]=last;return first;
 };
 const heuristic=(i,j)=>Math.hypot(i-goal.i,j-goal.j);
 push(begin,heuristic(start.i,start.j));
 let found=false,iterations=0;
 while(heap.length&&iterations++<total*7){
  const current=pop()[0];if(closed[current])continue;
  if(current===finish){found=true;break}
  closed[current]=1;
  let ci=current%n,cj=Math.floor(current/n);
  for(const [dx,dy] of GUIDE_DIRS){
   const ni=ci+dx,nj=cj+dy;
   if(!guideCellValid(ni,nj))continue;
   // Prevent squeezing diagonally through banks or solid structures.
   if(dx&&dy&&(!guideCellValid(ci+dx,cj)||!guideCellValid(ci,cj+dy)))continue;
   const next=idx(ni,nj);
   if(closed[next])continue;
   const cost=g[current]+(dx&&dy?Math.SQRT2:1);
   if(cost>=g[next])continue;
   g[next]=cost;parent[next]=current;
   push(next,cost+heuristic(ni,nj));
  }
 }
 if(!found)return [];
 const points=[];let cursor=finish,guard=0;
 while(cursor!==begin&&cursor>=0&&guard++<total){
  const i=cursor%n,j=Math.floor(cursor/n);
  points.push({x:(i+.5)*GUIDE_GRID,y:(j+.5)*GUIDE_GRID});
  cursor=parent[cursor];
 }
 points.reverse();
 points.push({x:endX,y:endY});
 return points;
}
function guideRecalculateRoute(target,now){
 if(!target||!Number.isFinite(target.x)||!Number.isFinite(target.y)){
  guidePath=[];guideHeading=null;guideTargetKey='';return;
 }
 const key=target.id+':'+Math.floor(target.x/35)+':'+Math.floor(target.y/35);
 const moved=guideOrigin&&Math.hypot(guideOrigin.x-player.x,guideOrigin.y-player.y)>110;
 if(key!==guideTargetKey||now-guidePathStamp>1800||moved){
  guidePath=guidePathSearch(player.x,player.y,target.x,target.y);
  guideOrigin={x:player.x,y:player.y};guidePathStamp=now;guideTargetKey=key;
 }
 let waypoint=null;
 for(const p of guidePath){
  if(Math.hypot(player.x-p.x,player.y-p.y)>100){waypoint=p;break}
 }
 guideHeading=waypoint||{x:target.x,y:target.y};
}
function guideDistanceLabel(target){
 if(!target||!Number.isFinite(target.x)||!Number.isFinite(target.y))return '查看游历簿';
 const direct=Math.hypot(player.x-target.x,player.y-target.y);
 if(direct<90)return '已接近 · 可互动';
 // Route distance is an approximation, not physical steps or an ETA.
 let route=0,last=player;
 if(guidePath.length){
  for(const p of guidePath){route+=Math.hypot(last.x-p.x,last.y-p.y);last=p}
 }
 const distance=Math.round(Math.max(direct,route)/10)*10;
 return '约 '+distance.toLocaleString('zh-CN')+' 格';
}
function guideFacingName(dx,dy){
 if(Math.hypot(dx,dy)<18)return '已抵达';
 const angle=Math.atan2(dy,dx),directions=['东','东南','南','西南','西','西北','北','东北'];
 let index=Math.round(angle/(Math.PI/4));index=(index+8)%8;
 return directions[index];
}
function guideIsCombat(now){
 if(!running)return false;
 if(now<invuln||now<dashUntil&&projectiles.some(p=>p.hostile))return true;
 if(azureKing&&!azureKing.defeated&&azureKing.active&&Math.hypot(azureKing.x-player.x,azureKing.y-player.y)<365)return true;
 if(boss&&!boss.defeated&&Math.hypot(boss.x-player.x,boss.y-player.y)<250)return true;
 if(enemies.some(e=>e.hp>0&&e.species!=='hare'&&level<e.tier+2&&Math.hypot(e.x-player.x,e.y-player.y)<172))return true;
 return projectiles.some(p=>p.hostile&&Math.hypot(p.x-player.x,p.y-player.y)<145);
}
function guideArrowUpdate(now,combat){
 const el=document.getElementById('guideArrow');
 if(!el)return;
 const t=guideObjective;
 if(combat||guideMode==='minimal'&&t==null||!running||adventureBookOpen||!t||!guideHeading){
  el.style.display='none';return;
 }
 const dist=Math.hypot(t.x-player.x,t.y-player.y);
 if(dist<105){el.style.display='none';return}
 // Keep the arrow inside the central visual safe area: outside joystick, skills and minimap.
 const anchorX=player.x-camX,anchorY=player.y-camY;
 const angle=Math.atan2(guideHeading.y-player.y,guideHeading.x-player.x);
 const x=anchorX+Math.cos(angle)*Math.min(175,Math.max(95,W*.18));
 const y=anchorY+Math.sin(angle)*Math.min(113,Math.max(70,H*.2));
 const left=Math.max(150,Math.min(W-145,x)),top=Math.max(152,Math.min(H-100,y));
 if(W<470||H<260){el.style.display='none';return}
 el.style.left=Math.round(left)+'px';el.style.top=Math.round(top)+'px';
 el.style.display='flex';
 const glyph=document.getElementById('guideArrowGlyph'),label=document.getElementById('guideArrowText');
 if(glyph)glyph.style.transform='rotate('+angle+'rad)';
 if(label)label.textContent=guideMode==='minimal'?'':(t.short||'目标');
}
function updateGuideHUD(now,force=false){
 if(!adventureState||!player)return;
 const dock=document.getElementById('adventureDock');
 if(!dock)return;
 const target=guideMainObjective();guideObjective=target;
 guideRecalculateRoute(target,now);
 const combat=guideMode==='smart'&&guideIsCombat(now);
 if(combat!==guideLastCombat||force){dock.classList.toggle('combat',combat);guideLastCombat=combat}
 dock.classList.toggle('guide-minimal',guideMode==='minimal');
 dock.classList.toggle('guide-detailed',guideMode==='detailed');
 const title=document.getElementById('adventureMini'),
       meta=document.getElementById('guideMeta'),
       bounty=document.getElementById('guideBounty'),
       compact=document.getElementById('guideCompact');
 const facing=guideHeading?guideFacingName(guideHeading.x-player.x,guideHeading.y-player.y):'';
 const distance=guideDistanceLabel(target);
 const headline=target?.title||'自由探索';
 const progress=target?.progress||'';
 const note=target?.brief||'仙途未尽';
 const text=headline+'|'+facing+'|'+distance+'|'+progress+'|'+guideMode;
 if(force||text!==guideLastText){
  if(title)title.textContent=headline;
  if(meta)meta.textContent=(facing?facing+' · ':'')+distance+(progress?' · '+progress:'');
  if(compact)compact.textContent='📍 '+(combat?'任务':progress||'指引');
  const b=adventureCurrentBounty();
  if(bounty)bounty.textContent='🎯 '+b.name+' '+adventureState.commissionProgress+'/'+b.need;
  dock.title=note+' · '+headline+' · '+distance;
  guideLastText=text;
 }
 guideArrowUpdate(now,combat);
}
function paintGuidanceMinimap(){
 const t=guideObjective;if(!t||!Number.isFinite(t.x)||!Number.isFinite(t.y))return;
 const toM=x=>x/SIZE*112;
 mc.save();
 if(guidePath.length){
  mc.strokeStyle='#f9e6a6';mc.lineWidth=1.25;mc.globalAlpha=.8;
  mc.setLineDash([2,2]);mc.beginPath();mc.moveTo(toM(player.x),toM(player.y));
  for(const p of guidePath)mc.lineTo(toM(p.x),toM(p.y));
  mc.stroke();mc.setLineDash([]);
 }
 const x=toM(t.x),y=toM(t.y),pulse=2.8+(Math.sin(performance.now()*.006)+1)*1.25;
 mc.globalAlpha=1;mc.strokeStyle='#142d27';mc.lineWidth=3;mc.beginPath();mc.arc(x,y,pulse+1,0,Math.PI*2);mc.stroke();
 mc.strokeStyle='#ffe29b';mc.lineWidth=2;mc.beginPath();mc.arc(x,y,pulse+1,0,Math.PI*2);mc.stroke();
 mc.fillStyle='#fff0a8';mc.beginPath();mc.arc(x,y,2.2,0,Math.PI*2);mc.fill();
 mc.restore();
}
function paintGuidanceWorld(now){
 const t=guideObjective;
 if(!t||!Number.isFinite(t.x)||!Number.isFinite(t.y)||!inView(t.x,t.y,85))return;
 const d=Math.hypot(player.x-t.x,player.y-t.y);
 ctx.save();
 ctx.globalAlpha=.85;ctx.lineWidth=2.2;ctx.strokeStyle='#f9dfa0';
 ctx.beginPath();ctx.ellipse(t.x,t.y,23+Math.sin(now*.004)*3,11+Math.sin(now*.004)*2,0,0,Math.PI*2);ctx.stroke();
 ctx.fillStyle='#fff4b2';ctx.font='bold 12px serif';ctx.textAlign='center';
 if(d<160)ctx.fillText(d<90?'目标已抵达':'目标在附近',t.x,t.y-23);
 ctx.restore();
}
