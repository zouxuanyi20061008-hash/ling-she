/* 灵蛇问道 V6.4 · 五境化形美术重制
 * Scene-independent sprite loader and effects. No saved data schema changes.
 * The first (凡蛇) art uses the original sprite assets; future forms
 * use their own heads, scales, features and different footprint/lighting.
 */
const SNAKE_FORMS=[
 {name:'凡蛇',title:'初生凡骨',perk:'基础灵息',color:'#d3f2ac',accent:'#63967c',size:40,body:23},
 {name:'灵蛇',title:'玉灵初醒',perk:'灵蛇遁·灵影',color:'#b7ffe5',accent:'#36a99c',size:50,body:30},
 {name:'妖蟒',title:'金鳞凝魄',perk:'灵息弹·溅射',color:'#ffdc92',accent:'#bb9559',size:61,body:36},
 {name:'蛟龙',title:'覆海生角',perk:'灵蛇遁·疾风',color:'#c5faff',accent:'#55aacf',size:70,body:40},
 {name:'真龙',title:'九霄龙吟',perk:'灵息弹·三重龙息',color:'#fff4c2',accent:'#e5b95e',size:80,body:47}
];
const HEAD_ART_PATHS=[
 'assets/jade-snake-head.svg?v=64','assets/evo1-head.svg?v=64','assets/evo2-head.svg?v=64','assets/evo3-head.svg?v=64','assets/evo4-head.svg?v=64'
];
const BODY_ART_PATHS=[
 'assets/jade-snake-body.svg?v=64','assets/evo1-body.svg?v=64','assets/evo2-body.svg?v=64','assets/evo3-body.svg?v=64','assets/evo4-body.svg?v=64'
];
const SNAKE_HEAD_IMAGES=[],SNAKE_BODY_IMAGES=[];
for(let stage=0;stage<5;stage++){
 const head=new Image(),body=new Image();
 head.src=HEAD_ART_PATHS[stage];body.src=BODY_ART_PATHS[stage];
 SNAKE_HEAD_IMAGES.push(head);SNAKE_BODY_IMAGES.push(body);
}
let evolutionScene={start:0,stage:0,until:0};
let healRuneUntil=0;
const dashEchoes=[];
function resetEvolutionEffects(){
 evolutionScene.start=0;evolutionScene.until=0;healRuneUntil=0;dashEchoes.length=0;
}
function beginEvolutionScene(stage){
 let now=performance.now();
 evolutionScene={start:now,stage:Math.min(4,stage),until:now+2600};
 dashEchoes.length=0;
}
function beginHealRunes(){healRuneUntil=performance.now()+1050}
function addDashEcho(x,y,a,stage){
 if(stage<1)return;
 dashEchoes.push({x,y,a,stage,until:performance.now()+420});
 if(dashEchoes.length>18)dashEchoes.shift();
}
/* V6.4: each realm owns a distinct head silhouette and scale atlas.
 * The body is still painted in the existing trail loop: no new entities or
 * simulation-side state. High-quality glints are sparse (<5 per long serpent).
 */
function paintEvolvedBody(t,i,stage,now){
 const index=Math.max(0,Math.min(4,stage|0)),im=SNAKE_BODY_IMAGES[index];
 if(!im.complete||!im.naturalWidth)return paintBody(t,i);
 const style=SNAKE_FORMS[index];
 const tailTaper=Math.max(.56,1-i/Math.max(17,trail.length)*.44);
 const width=style.body*tailTaper;
 ctx.drawImage(im,t.x-width*.5,t.y-width*.52,width,width*1.02);
 if(index>=2&&qualityMode==='sharp'&&i%5===0){
  // The individual gold/azure scale glint is readable even on a narrow tail.
  ctx.save();ctx.strokeStyle=style.color;ctx.lineWidth=index>=3?1.7:1.1;
  ctx.globalAlpha=.29+.13*Math.sin(now*.0025+i*.9);
  ctx.beginPath();ctx.arc(t.x-width*.13,t.y-width*.21,width*.12,3.5,5.45);ctx.stroke();
  ctx.restore();
 }
 return true;
}
function paintEvolvedHead(p,a,stage,now){
 const index=Math.max(0,Math.min(4,stage|0)),im=SNAKE_HEAD_IMAGES[index];
 if(!im.complete||!im.naturalWidth)return paintHead(p,a,index);
 const style=SNAKE_FORMS[index],size=style.size;
 ctx.save();ctx.imageSmoothingEnabled=qualityMode==='sharp';ctx.translate(p.x,p.y);ctx.rotate(a-Math.PI/2);
 if(index>=1){
  // Rear rim: the actual horns, crest and whiskers are baked into each SVG,
  // preventing expensive per-frame vector outlines on low-memory devices.
  ctx.strokeStyle=style.accent;
  ctx.lineWidth=index>=3?2.2:1.2;
  ctx.globalAlpha=(qualityMode==='smooth'?.17:.22)+.055*Math.sin(now*.0037);
  ctx.beginPath();ctx.ellipse(0,2,size*.49,size*.49,0,0,Math.PI*2);ctx.stroke();
  ctx.globalAlpha=1;
 }
 ctx.drawImage(im,-size*.5,-size*.5,size,size);
 if(index>=3&&qualityMode==='sharp'){
  ctx.fillStyle=index===4?'#fff0bc':'#d5ffff';
  ctx.globalAlpha=.57+.2*Math.sin(now*.004);
  ctx.beginPath();ctx.arc(0,-size*.25,index===4?2.9:1.9,0,Math.PI*2);ctx.fill();
 }
 ctx.restore();return true;
}
function paintSerpentAura(p,stage,now){
 if(stage<1)return;
 const index=Math.max(0,Math.min(4,stage|0)),info=SNAKE_FORMS[index];
 const pulse=Math.sin(now*.0038)*.055;
 ctx.save();ctx.strokeStyle=info.color;
 ctx.lineWidth=index>=3?1.9:1.2;
 ctx.globalAlpha=(qualityMode==='smooth'?.11:.19)+pulse;
 ctx.beginPath();ctx.ellipse(p.x,p.y+3,20+index*5,11+index*3,0,0,Math.PI*2);ctx.stroke();
 if(index>=3&&qualityMode==='sharp'){
  ctx.globalAlpha=.085+.025*Math.sin(now*.0026);
  ctx.beginPath();ctx.ellipse(p.x,p.y+4,25+index*7,14+index*4,0,0,Math.PI*2);ctx.stroke();
 }
 ctx.restore();
}
function paintDashEchoes(now){
 if(!dashEchoes.length)return;
 for(let i=dashEchoes.length-1;i>=0;i--){
  const e=dashEchoes[i];
  if(e.until<now){dashEchoes.splice(i,1);continue}
  if(!inView(e.x,e.y,65))continue;
  const t=(e.until-now)/420,info=SNAKE_FORMS[e.stage];
  ctx.save();ctx.globalAlpha=.28*t;
  ctx.translate(e.x,e.y);ctx.rotate(e.a-Math.PI/2);
  const im=SNAKE_HEAD_IMAGES[e.stage];
  if(im.complete&&im.naturalWidth){
    const s=info.size*1.05;ctx.drawImage(im,-s/2,-s/2,s,s);
  }else{
    ctx.fillStyle=info.color;ctx.beginPath();ctx.arc(0,0,15,0,Math.PI*2);ctx.fill();
  }
  ctx.restore();
 }
}
function paintEvolvedProjectile(p,now){
 const stage=Math.max(0,Math.min(4,p.stage||0));
 const palette=p.hostile?['#e8adff','#9c51bc']:['#e6ffe6','#8bcabb'];
 const colors=p.hostile?palette:[SNAKE_FORMS[stage].color,SNAKE_FORMS[stage].accent];
 const angle=Math.atan2(p.vy,p.vx);
 const radius=(p.hostile?9:8)+stage*1.6;
 ctx.save();ctx.translate(p.x,p.y);ctx.rotate(angle);
 ctx.globalAlpha=.38;ctx.fillStyle=colors[1];
 ctx.beginPath();ctx.ellipse(-radius*.85,0,radius*1.6,radius*.8,0,0,Math.PI*2);ctx.fill();
 ctx.globalAlpha=.8;ctx.fillStyle=colors[1];ctx.beginPath();ctx.arc(0,0,radius,0,Math.PI*2);ctx.fill();
 ctx.fillStyle=colors[0];ctx.beginPath();ctx.arc(radius*.14,-radius*.15,radius*.62,0,Math.PI*2);ctx.fill();
 if(stage>=2&&!p.hostile){
  ctx.lineWidth=1.7;ctx.strokeStyle='#fff9e2';
  ctx.beginPath();ctx.moveTo(-radius*2,-radius*.8);ctx.lineTo(-radius*.3,0);ctx.lineTo(-radius*1.7,radius*.9);ctx.stroke();
 }
 ctx.restore();
}
function paintEvolutionWorldFx(p,now){
 if(evolutionScene.until>now){
  const stage=evolutionScene.stage;
  const progress=Math.min(1,Math.max(0,(now-evolutionScene.start)/2600));
  const alpha=Math.max(0,Math.min(1,progress*7,(1-progress)*2.7));
  const info=SNAKE_FORMS[stage];
  ctx.save();ctx.globalAlpha=alpha*.72;ctx.lineWidth=2.2;ctx.strokeStyle=info.color;
  for(let j=0;j<3;j++){
   const r=(progress*140+j*34)%151;
   ctx.beginPath();ctx.ellipse(p.x,p.y,r,Math.max(8,r*.46),-.09,0,Math.PI*2);ctx.stroke();
  }
  // Realm-specific breakthrough rays. Only rendered for 2.6 seconds.
  if(stage>=2){
   const rays=qualityMode==='smooth'?6:stage>=4?12:9;
   for(let j=0;j<rays;j++){
    const a=j*Math.PI*2/rays+progress*.22;
    const near=34+stage*4+progress*10,far=near+19+stage*3;
    ctx.strokeStyle=j%2?info.color:'#fff8df';ctx.lineWidth=stage===4?2.5:1.5;
    ctx.globalAlpha=alpha*(j%2?.48:.66);
    ctx.beginPath();
    ctx.moveTo(p.x+Math.cos(a)*near,p.y+Math.sin(a)*near*.55);
    ctx.lineTo(p.x+Math.cos(a)*far,p.y+Math.sin(a)*far*.55);
    ctx.stroke();
   }
  }
  const count=qualityMode==='smooth'?8:16;
  for(let j=0;j<count;j++){
   const theta=j*2.399963+now*.0007;
   const r=23+progress*92+Math.sin(j*3.6)*14;
   const x=p.x+Math.cos(theta)*r,y=p.y+Math.sin(theta)*r*.66;
   ctx.globalAlpha=alpha*.84;
   ctx.fillStyle=j%2?info.color:'#fff9d9';
   ctx.fillRect(Math.round(x),Math.round(y),stage>=3?4:3,stage>=3?6:4);
  }
  ctx.restore();
 }
 if(healRuneUntil>now){
   let r=35+(1-(healRuneUntil-now)/1050)*36;
   ctx.save();ctx.strokeStyle='#a8ffce';ctx.lineWidth=2;
   ctx.globalAlpha=(healRuneUntil-now)/1050*.7;
   ctx.beginPath();ctx.ellipse(p.x,p.y,r,r*.5,0,0,Math.PI*2);ctx.stroke();
   ctx.restore();
 }
}
function paintEvolutionBanner(now){
 if(evolutionScene.until<=now)return;
 const stage=evolutionScene.stage,progress=(now-evolutionScene.start)/2600;
 const fade=Math.min(1,progress*8,(1-progress)*3);
 ctx.save();ctx.textAlign='center';ctx.globalAlpha=Math.max(0,fade);
 const size=Math.min(31,Math.max(21,W*.047));
 const lineY=Math.max(55,H*.22);
 ctx.fillStyle='#10292bc9';ctx.fillRect(Math.max(5,W*.5-160),lineY-37,Math.min(320,W-10),91);
 ctx.strokeStyle=SNAKE_FORMS[stage].accent;ctx.lineWidth=1.5;
 ctx.strokeRect(Math.max(5,W*.5-160),lineY-37,Math.min(320,W-10),91);
 ctx.fillStyle='#fff6d5';ctx.font='bold '+size+'px serif';
 ctx.fillText('化形突破 · '+SNAKE_FORMS[stage].name,W*.5,lineY);
 ctx.font='bold 13px sans-serif';ctx.fillStyle=SNAKE_FORMS[stage].color;
 ctx.fillText(SNAKE_FORMS[stage].title+'　|　解锁 '+SNAKE_FORMS[stage].perk,W*.5,lineY+29);
 ctx.restore();
}
function splashSerpentImpact(x,y,damage,excluded){
 const rad=66;
 for(const e of enemies){
  if(e===excluded||Math.hypot(e.x-x,e.y-y)>rad||e.hp<=0)continue;
  let applied=damage*(e.armor||1);e.hp-=applied;e.hitFlash=performance.now()+130;
  damageTexts.push({x:e.x,y:e.y-18,text:'溅射 -'+Math.round(applied),life:.65,color:'#ffe1a0'});
  if(e.hp<=0)killEnemy(e,false);
 }
}

/* Shared V5.9 evolution trigger: boss and encounter rewards can evolve too.
 * Preserves the existing one-stage-per-reward progression and V4 data schema. */
function triggerEvolutionIfReady(){
 if(evoStage>=4||evoPoints<evoThresholds[evoStage])return false;
 evoStage++;
 hp=Math.min(100+level*10,hp+45);
 beginEvolutionScene(evoStage);
 flash('🐉 进化：'+forms[evoStage]);
 for(let i=0;i<24;i++){
  particles.push({x:player.x,y:player.y,vx:rand(-130,130),vy:rand(-130,130),life:.85,color:SNAKE_FORMS[evoStage].color});
 }
 for(let i=0;i<5;i++)trail.push({...trail[trail.length-1]});
 updateHud();
 return true;
}
