/* 灵蛇问道 V6.5 · 妖兽战斗视觉反馈
 * Pure presentation. No attack cooldown, collision, health or save mutation.
 * Effects are short-lived, viewport culled and hard-capped for Android.
 */
const COMBAT_ART_PALETTE={
 hare:['#d9ffbb','#76b899'],fox:['#ffe2ac','#e59c5d'],
 wolf:['#d6e4ca','#8da9a0'],tortoise:['#bed2a7','#789680'],
 bat:['#ddc5ff','#8b6ba7'],frost_stag:['#e7ffff','#87c6dc'],
 ember_scorpion:['#ffe6a3','#e58c53'],nether_wisp:['#e8d8ff','#a88ad7'],
 azure_king:['#ffe6a7','#79afa9'],boss:['#f4c5ff','#a075cd'],player:['#ffdfc1','#f29683']
};
const COMBAT_ART_IMPACTS=[];
const COMBAT_ART_LIMIT=30;
function combatFxPalette(species){return COMBAT_ART_PALETTE[species]||COMBAT_ART_PALETTE.fox}
function combatArtHit(x,y,species,now=performance.now(),strength=1,kind='hit'){
 if(!Number.isFinite(x)||!Number.isFinite(y))return;
 if(x<camX-110||x>camX+W+110||y<camY-110||y>camY+H+110)return;
 if(COMBAT_ART_IMPACTS.length>=COMBAT_ART_LIMIT)COMBAT_ART_IMPACTS.shift();
 COMBAT_ART_IMPACTS.push({x,y,species,at:now,duration:kind==='defeat'?580:kind==='player'?410:300,
    strength:Math.min(2.2,Math.max(.65,strength)),kind});
}
function combatArtReset(){COMBAT_ART_IMPACTS.length=0}
function paintCombatImpacts(now){
 if(!COMBAT_ART_IMPACTS.length)return;
 const sharp=qualityMode==='sharp';
 ctx.save();
 for(let i=COMBAT_ART_IMPACTS.length-1;i>=0;i--){
  const f=COMBAT_ART_IMPACTS[i],age=now-f.at;
  if(age>f.duration||age<0){COMBAT_ART_IMPACTS.splice(i,1);continue}
  if(!inView(f.x,f.y,84))continue;
  const progress=age/f.duration,fade=(1-progress)*(1-progress),c=combatFxPalette(f.species);
  const radius=(f.kind==='defeat'?19:11)+progress*(f.kind==='defeat'?35:20)*f.strength;
  ctx.globalAlpha=fade*(f.kind==='defeat'?.67:.54);ctx.lineWidth=sharp?2.4:2;
  ctx.strokeStyle=c[0];ctx.beginPath();ctx.ellipse(f.x,f.y,radius,radius*.58,0,0,Math.PI*2);ctx.stroke();
  ctx.globalAlpha=fade*.69;ctx.strokeStyle=c[1];ctx.lineWidth=sharp?2.2:1.6;
  const lines=sharp?(f.kind==='defeat'?8:5):3;
  for(let j=0;j<lines;j++){
   const a=j*Math.PI*2/lines+(f.kind==='player'?.18:0);
   const near=radius*.45,far=radius*.8+6;
   ctx.beginPath();
   ctx.moveTo(f.x+Math.cos(a)*near,f.y+Math.sin(a)*near*.7);
   ctx.lineTo(f.x+Math.cos(a)*far,f.y+Math.sin(a)*far*.7);
   ctx.stroke();
  }
  if(sharp&&f.kind==='defeat'&&progress<.7){
   ctx.globalAlpha=fade*.5;ctx.fillStyle=c[0];
   for(let k=0;k<5;k++){
    const a=k*2.39996;
    ctx.fillRect(Math.round(f.x+Math.cos(a)*radius*.7),Math.round(f.y+Math.sin(a)*radius*.55),3,3);
   }
  }
 }
 ctx.restore();
}
// Draw beneath sprites; highly legible silhouettes without large soft glows.
function paintCreatureContact(e,now){
 const species=e.species||'fox',r=e.r||16,c=combatFxPalette(species);
 const float=species==='bat'||species==='nether_wisp';
 ctx.save();
 ctx.globalAlpha=float?.21:.3;ctx.fillStyle='#17322f';
 ctx.beginPath();ctx.ellipse(e.x+3,e.y+8,r*(float?1.65:1.42),r*(float?.34:.46),0,0,Math.PI*2);ctx.fill();
 if(e.elite){
  ctx.strokeStyle=c[1];ctx.lineWidth=qualityMode==='sharp'?2:1.4;
  ctx.globalAlpha=.28+.08*Math.sin(now*.004+e.t);
  ctx.beginPath();ctx.ellipse(e.x,e.y+3,r+10,r*.56+5,0,0,Math.PI*2);ctx.stroke();
 }
 ctx.restore();
}
// This indicator uses *existing* cooldown values: an upcoming shot is
// marked only when the target has been acquired and the cooldown is nearly over.
function paintCreatureAttackTell(e,now){
 const id=e.species||'',meta=CREATURE_META[id];
 if(!meta||e.hp<=0||!running)return;
 const armed=['fox','bat','frost_stag','ember_scorpion','nether_wisp'].includes(id);
 if(!armed||!e.shot||e.shot<=now||e.shot-now>480)return;
 const d=Math.hypot(e.x-player.x,e.y-player.y);
 if(d>330)return;
 const color=combatFxPalette(id)[0],phase=1-(e.shot-now)/480,r=e.r+6;
 ctx.save();ctx.strokeStyle=color;ctx.lineWidth=qualityMode==='sharp'?2:1.5;
 ctx.globalAlpha=.18+.3*phase;
 ctx.beginPath();ctx.arc(e.x,e.y,r,-Math.PI/2,-Math.PI/2+phase*Math.PI*2);ctx.stroke();
 if(qualityMode==='sharp'){
  ctx.globalAlpha=.28*phase;ctx.fillStyle=color;
  ctx.beginPath();ctx.arc(e.x,e.y-r-7,2.2,0,Math.PI*2);ctx.fill();
 }
 ctx.restore();
}
