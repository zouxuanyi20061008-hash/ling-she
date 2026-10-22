// Xianxia sprite atlas
var treeArt=document.createElement('img');
treeArt.src='assets/ancient-tree.svg';
var foxArt=document.createElement('img');
foxArt.src='assets/spirit-fox.svg';
var snakeHeadArt=document.createElement('img');
snakeHeadArt.src='assets/jade-snake-head.svg';
var snakeBodyArt=document.createElement('img');
snakeBodyArt.src='assets/jade-snake-body.svg';
function paintTree(o,sz){if(!treeArt.complete||!treeArt.naturalWidth)return false;ctx.drawImage(treeArt,o.x-sz*.65,o.y-sz*1.5,sz*1.3,sz*1.65);return true}
function paintFox(e){if(!foxArt.complete||!foxArt.naturalWidth)return false;var z=e.r*3.2;ctx.drawImage(foxArt,e.x-z/2,e.y-z*.75,z,z);return true}
function paintHead(p,a,stage){if(!snakeHeadArt.complete||!snakeHeadArt.naturalWidth)return false;var z=42+stage*5;ctx.save();ctx.translate(p.x,p.y);ctx.rotate(a-Math.PI/2);ctx.drawImage(snakeHeadArt,-z/2,-z/2,z,z);ctx.restore();return true}
function paintBody(t,i){if(!snakeBodyArt.complete||!snakeBodyArt.naturalWidth)return false;var z=Math.max(14,26-i*.2);ctx.drawImage(snakeBodyArt,t.x-z/2,t.y-z/2,z,z);return true}

// Bridge and cliff artwork loaded independently of gameplay state.
var bridgeArt=document.createElement('img');bridgeArt.src='assets/stone-bridge.svg';
var cliffArt=document.createElement('img');cliffArt.src='assets/mossy-cliff.svg';

function paintBridge(x,y){if(!bridgeArt.complete||!bridgeArt.naturalWidth)return false;ctx.drawImage(bridgeArt,x-88,y-59,176,118);return true}
function paintCliff(x,y,w,h){if(!cliffArt.complete||!cliffArt.naturalWidth)return false;ctx.drawImage(cliffArt,x,y,w,h);return true}
function paintTreeCanopy(o,sz){if(!treeArt.complete||!treeArt.naturalWidth)return false;ctx.save();ctx.globalAlpha=.8;ctx.drawImage(treeArt,0,0,180,142,o.x-sz*.65,o.y-sz*1.5,sz*1.3,sz*1.65*142/220);ctx.restore();return true}


/* V5.3: art-scene renderer. Assets are optional: the existing Canvas
   gameplay is still usable if any SVG fails to load. */
var pathArt=new Image();pathArt.src='assets/stone-path-tile.svg';
var cachedStonePatterns=new WeakMap();
function stonePattern(g=ctx){if(!isArtReady(pathArt))return '#aa9675';var p=cachedStonePatterns.get(g);if(!p){p=g.createPattern(pathArt,'repeat');if(p)cachedStonePatterns.set(g,p)}return p||'#aa9675'}
var bankArt=new Image();bankArt.src='assets/riverbank-edge.svg';
function isArtReady(img){return !!(img&&img.complete&&img.naturalWidth>0)}
function scenePathGeometry(g=ctx){
  g.beginPath();g.moveTo(80,1530);
  g.bezierCurveTo(360,1530,600,1660,835,1760);
  g.bezierCurveTo(920,1798,990,1800,streamCenter(1800),1800);
  g.bezierCurveTo(1290,1800,1530,1800,1750,1800);
  g.bezierCurveTo(2150,1800,2550,2100,3450,2210);
}
function paintStoneRoad(g=ctx){
  g.save();g.lineCap='round';g.lineJoin='round';
  scenePathGeometry(g);g.strokeStyle='#324c3a88';g.lineWidth=96;g.stroke();
  scenePathGeometry(g);g.strokeStyle='#c0ad80';g.lineWidth=82;g.stroke();
  scenePathGeometry(g);g.strokeStyle=stonePattern(g);g.lineWidth=71;g.stroke();
  paintQinglanCourtyard(g);
  g.restore();
}
function paintStreamBanks(){
  if(!isArtReady(bankArt))return;
  var sy=Math.max(1200,Math.floor((camY-112)/96)*96),ey=Math.min(3500,camY+H+112);
  for(var y=sy;y<ey;y+=96){
    var x=streamCenter(y+48);
    if(x<camX-110||x>camX+W+110)continue;
    ctx.save();ctx.globalAlpha=.78;
    // Western bank: land on the west, water on the east.
    ctx.drawImage(bankArt,x-68,y,72,98);
    // Eastern bank mirrors the shoreline, matching the meander direction.
    ctx.translate(x+68,0);ctx.scale(-1,1);
    ctx.drawImage(bankArt,0,y,72,98);ctx.restore();
  }
}
function paintCliffScene(){
  if(!isArtReady(cliffArt))return false;
  // A broad limestone cliff made of several overlapping moss-covered ledges.
  ctx.save();
  ctx.fillStyle='#213c3588';ctx.fillRect(1367,1284,290,300);
  ctx.drawImage(cliffArt,1360,1213,158,180);
  ctx.drawImage(cliffArt,1495,1213,163,180);
  ctx.drawImage(cliffArt,1360,1367,164,171);
  ctx.drawImage(cliffArt,1496,1367,163,171);
  ctx.restore();return true;
}
function paintTreeScene(o,sz){
  if(!isArtReady(treeArt))return false;
  ctx.save();ctx.fillStyle='#122a2155';ctx.beginPath();
  ctx.ellipse(o.x+7,o.y+2,sz*.49,sz*.16,-.22,0,Math.PI*2);ctx.fill();
  ctx.drawImage(treeArt,o.x-sz*.65,o.y-sz*1.5,sz*1.3,sz*1.65);
  ctx.restore();return true;
}
function paintForegroundCanopies(playerRef,decorList,cameraX,cameraY,viewWidth,viewHeight){
  if(!isArtReady(treeArt))return;
  for(var i=0;i<decorList.length;i++){
    var o=decorList[i];if(o.type>=.29||biome(o.x,o.y)!==0)continue;
    var sz=72+o.size*2.2;
    // Only obscure the hero when she/he actually walks behind a trunk/canopy.
    if(o.y<=playerRef.y||playerRef.y<o.y-sz*1.42||Math.abs(o.x-playerRef.x)>sz*.63)continue;
    if(o.x<cameraX-sz||o.x>cameraX+viewWidth+sz||o.y<cameraY-sz*2||o.y>cameraY+viewHeight+sz)continue;
    ctx.save();ctx.globalAlpha=.88;ctx.drawImage(treeArt,0,0,180,137,o.x-sz*.65,o.y-sz*1.5,sz*1.3,sz*1.65*137/220);ctx.restore();
  }
}
function paintCreature(e){
  if(biome(e.x,e.y)!==0||!isArtReady(foxArt))return false;
  if(performance.now()<e.hitFlash)return false;
  ctx.save();if(e.elite){ctx.shadowColor='#ffd57e';ctx.shadowBlur=12}
  var sz=e.r*3.5;ctx.drawImage(foxArt,e.x-sz*.5,e.y-sz*.8,sz,sz);ctx.restore();return true;
}

/* Bamboo clusters reuse an authored image rather than drawing vector ellipses
   on every frame. World positions stay fixed across saves. */
var bambooArt=new Image();bambooArt.src='assets/jade-bamboo.svg';
function paintBambooStand(x,y,scale,g=ctx){
  if(!isArtReady(bambooArt))return false;
  var width=76*scale,height=94*scale;
  g.save();g.fillStyle='#193d3140';g.beginPath();g.ellipse(x+6,y+2,width*.48,width*.13,0,0,Math.PI*2);g.fill();
  g.drawImage(bambooArt,x-width*.5,y-height,width,height);g.restore();return true;
}


/* V5.4: fixed Qinglan landmarks. All coordinates are world-space and stable
   across reloads. The gate has an open center; the shrine has a solid base. */
var gateArt=new Image();gateArt.src='assets/qinglan-gate.svg';
var shrineArt=new Image();shrineArt.src='assets/qinglan-shrine.svg';
var QINGLAN_GATE={x:1750,y:1660,w:208,h:169};
var QINGLAN_SHRINE={x:2080,y:1640,w:235,h:189};
function paintLandmarks(){
  var g=QINGLAN_GATE,s=QINGLAN_SHRINE;
  if(g.x+g.w>camX&&g.x-g.w<camX+W&&g.y>camY-200&&g.y<camY+H+50&&isArtReady(gateArt)){
    ctx.save();ctx.fillStyle='#172f2a44';ctx.beginPath();
    ctx.ellipse(g.x,g.y+3,g.w*.47,13,0,0,Math.PI*2);ctx.fill();
    ctx.drawImage(gateArt,g.x-g.w/2,g.y-g.h,g.w,g.h);ctx.restore();
  }
  if(s.x+s.w>camX&&s.x-s.w<camX+W&&s.y>camY-230&&s.y<camY+H+40&&isArtReady(shrineArt)){
    ctx.save();ctx.fillStyle='#152e2944';ctx.beginPath();
    ctx.ellipse(s.x,s.y+2,s.w*.51,20,0,0,Math.PI*2);ctx.fill();
    ctx.drawImage(shrineArt,s.x-s.w/2,s.y-s.h,s.w,s.h);ctx.restore();
  }
}
function paintLandmarkFront(playerRef){
  var g=QINGLAN_GATE,s=QINGLAN_SHRINE;
  if(isArtReady(gateArt)&&playerRef.y<g.y&&playerRef.y>g.y-g.h&&Math.abs(playerRef.x-g.x)<g.w*.47){
    ctx.save();ctx.globalAlpha=.94;
    ctx.drawImage(gateArt,0,0,256,108,g.x-g.w/2,g.y-g.h,g.w,g.h*108/208);
    ctx.restore();
  }
  if(isArtReady(shrineArt)&&playerRef.y<s.y&&playerRef.y>s.y-s.h&&Math.abs(playerRef.x-s.x)<s.w*.49){
    ctx.save();ctx.globalAlpha=.9;
    ctx.drawImage(shrineArt,0,0,288,107,s.x-s.w/2,s.y-s.h,s.w,s.h*107/232);
    ctx.restore();
  }
}


/* V5.4: stable environmental layout, keeping the route and shrine accessible. */
function onQinglanRoad(x,y){
  if(x>=1030&&x<=1870)return Math.abs(y-1800)<66;
  if(x>1870)return Math.abs(y-(1800+(x-1870)*.255))<67;
  return Math.abs(y-(1510+x*.29))<68;
}
function landmarkClearing(x,y,pad){
  pad=pad||0;
  return (Math.abs(x-1750)<126+pad&&y>1480-pad&&y<1810+pad)
    ||(Math.abs(x-2080)<153+pad&&y>1415-pad&&y<1710+pad)
    ||(Math.abs(x-streamCenter(1800))<135+pad&&Math.abs(y-1800)<142+pad)
    ||(x>1680-pad&&x<2140+pad&&y>1640-pad&&y<1786+pad)
    ||(x>1370-pad&&x<1590+pad&&y>1250-pad&&y<1620+pad);
}
function placeStable(arr,n,fn,salt,pad){
  // A bounded deterministic sampler; skipped water/roads do not lower the target count.
  var spawned=0;
  for(var i=0;i<n*12&&spawned<n;i++){
    var x=70+terrainHash(i,salt,7)*(SIZE-140);
    var y=70+terrainHash(i,salt,11)*(SIZE-140);
    if(terrainBlocked(x,y)||landmarkClearing(x,y,pad)||onQinglanRoad(x,y)||isEncounterClearing(x,y,pad)||isAdventureClearing(x,y,pad))continue;
    if(arr===obstacles&&arr.some(function(o){return Math.hypot(o.x-x,o.y-y)<o.r+33}))continue;
    arr.push(fn(x,y,i));spawned++;
  }
}
function isLandmarkBlocked(x,y){
  // Solid shrine plinth and two gate columns; the gate's central arch stays open.
  if(x>1985&&x<2175&&y>1568&&y<1643)return true;
  if(y>1555&&y<1660&&(Math.abs(x-1689)<15||Math.abs(x-1811)<15))return true;
  for(var i=0;i<QINGLAN_LANTERNS.length;i++){
    var p=QINGLAN_LANTERNS[i];
    if(Math.hypot(x-p.x,y-p.y)<12)return true;
  }
  return false;
}


/* V5.5: authored landmark walkways and spiritual lanterns.
   All placement uses world-space anchors, shared with collision and clearing.
   This does not require changing existing save data. */
var lanternArt=new Image();lanternArt.src='assets/spirit-lantern.svg';
var QINGLAN_LANTERNS=[
 {x:1673,y:1730,scale:.91},{x:1827,y:1730,scale:.91},
 {x:1925,y:1701,scale:1.03},{x:2233,y:1701,scale:1.03}
];
function paintQinglanCourtyard(g=ctx){
  // Fork from the original east-west highway into the mountain gate
  // and then around the shrine. No waterways are crossed by this spur.
  var pattern=stonePattern(g);
  g.save();
  g.fillStyle='#314a3b82';
  g.beginPath();g.ellipse(2080,1684,171,107,-.06,0,Math.PI*2);g.fill();
  g.fillStyle='#b5ad8a';
  g.beginPath();g.ellipse(2080,1684,156,91,-.06,0,Math.PI*2);g.fill();
  g.save();g.beginPath();g.ellipse(2080,1684,147,83,-.06,0,Math.PI*2);g.clip();
  g.fillStyle=pattern;g.fillRect(1910,1585,340,215);g.restore();

  g.beginPath();g.moveTo(1750,1822);
  g.bezierCurveTo(1750,1780,1750,1745,1750,1697);
  g.bezierCurveTo(1760,1687,1809,1690,1856,1690);
  g.bezierCurveTo(1930,1690,1970,1733,2078,1740);
  g.lineCap='round';g.lineJoin='round';
  g.strokeStyle='#365343aa';g.lineWidth=60;g.stroke();
  g.strokeStyle='#b4a98c';g.lineWidth=52;g.stroke();
  g.strokeStyle=pattern;g.lineWidth=43;g.stroke();

  // Wear and repeated paving lines; intentionally deterministic.
  g.globalAlpha=.45;g.strokeStyle='#e2d1a5';g.lineWidth=2;
  for(var i=0;i<19;i++){
    var x=1940+i*15,y=1640+Math.sin(i*.82)*11;
    g.beginPath();g.moveTo(x,y);g.lineTo(x+11,y-2);g.stroke();
  }
  g.restore();
}
function paintShrineLanterns(now){
  if(!isArtReady(lanternArt))return;
  for(var i=0;i<QINGLAN_LANTERNS.length;i++){
    var p=QINGLAN_LANTERNS[i];
    if(p.x<camX-90||p.x>camX+W+90||p.y<camY-120||p.y>camY+H+25)continue;
    var w=48*p.scale,h=84*p.scale,flame=p.y-h*.69;
    ctx.save();
    ctx.globalAlpha=.75;
    ctx.globalCompositeOperation='screen';
    var r=52+(Math.sin(now*.0023+i*2.71)*5);
    var glow=ctx.createRadialGradient(p.x,flame,4,p.x,flame,r);
    glow.addColorStop(0,'#fff3bd70');glow.addColorStop(.38,'#dbeca336');glow.addColorStop(1,'#81c4a000');
    ctx.fillStyle=glow;ctx.beginPath();ctx.arc(p.x,flame,r,0,Math.PI*2);ctx.fill();
    ctx.restore();
    ctx.drawImage(lanternArt,p.x-w*.5,p.y-h,w,h);
  }
}
function paintLandmarkTitles(){
  ctx.save();ctx.textAlign='center';
  if(QINGLAN_GATE.x>camX-160&&QINGLAN_GATE.x<camX+W+160&&QINGLAN_GATE.y>camY-140&&QINGLAN_GATE.y<camY+H+160){
    ctx.font='bold 14px serif';ctx.fillStyle='#f2e2b5';ctx.shadowColor='#172f2a';ctx.shadowBlur=4;
    ctx.fillText('青岚山门',QINGLAN_GATE.x,QINGLAN_GATE.y-QINGLAN_GATE.h-11);
  }
  if(QINGLAN_SHRINE.x>camX-170&&QINGLAN_SHRINE.x<camX+W+170&&QINGLAN_SHRINE.y>camY-160&&QINGLAN_SHRINE.y<camY+H+160){
    ctx.font='bold 15px serif';ctx.fillStyle='#f2e2b5';ctx.shadowColor='#172f2a';ctx.shadowBlur=4;
    ctx.fillText('青岚祠',QINGLAN_SHRINE.x,QINGLAN_SHRINE.y-QINGLAN_SHRINE.h-12);
  }
  ctx.restore();
}


/* V5.5: the Cloudfall ledge is one coherent landmark: a textured
   waterfall sprite, a physical basin, shoreline reeds and moving spray. */
var cloudfallArt=new Image();cloudfallArt.src='assets/cloudfall-waterfall.svg';
var CLOUDFALL={x:1480,y:1547,rx:64,ry:28};
function paintCloudfall(now){
  var w=CLOUDFALL;
  if(w.x<camX-200||w.x>camX+W+200||w.y<camY-330||w.y>camY+H+80)return;
  ctx.save();
  ctx.fillStyle='#2e5149';ctx.beginPath();
  ctx.ellipse(w.x,w.y+10,76,35,-.04,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#c4c69a';ctx.beginPath();
  ctx.ellipse(w.x,w.y+6,68,30,0,0,Math.PI*2);ctx.fill();
  var pool=ctx.createRadialGradient(w.x-18,w.y,5,w.x,w.y+5,74);
  pool.addColorStop(0,'#b1ebe0');pool.addColorStop(.48,'#67bfc0');pool.addColorStop(1,'#265f77');
  ctx.fillStyle=pool;ctx.beginPath();
  ctx.ellipse(w.x,w.y+4,61,25,0,0,Math.PI*2);ctx.fill();
  ctx.globalAlpha=.65;ctx.strokeStyle='#e8f7d9';ctx.lineWidth=2;
  for(var i=0;i<6;i++){
    var t=now*.0015+i*1.6,px=w.x+Math.sin(t)*29,py=w.y+3+(i-3)*4;
    ctx.beginPath();ctx.ellipse(px,py,11+Math.sin(t*.8)*4,2,0,0,Math.PI);ctx.stroke();
  }
  ctx.globalAlpha=1;
  if(isArtReady(cloudfallArt))ctx.drawImage(cloudfallArt,w.x-104,w.y-287,208,287);
  else{
    ctx.fillStyle='#6a9c92';ctx.fillRect(w.x-26,w.y-160,52,155);
    ctx.fillStyle='#a0e5db';ctx.fillRect(w.x-17,w.y-160,34,156);
  }
  ctx.fillStyle='#b6cca0';
  for(var j=0;j<12;j++){
    var ang=j*1.91;
    var px=w.x+Math.cos(ang)*71,py=w.y+Math.sin(ang)*31+8;
    if(Math.abs(px-w.x)<28&&py<w.y+8)continue;
    ctx.fillRect(px,py-6,2,9);
    ctx.fillRect(px-4,py-5,3,7);
  }
  ctx.textAlign='center';ctx.font='bold 13px serif';
  ctx.shadowColor='#1d3d3c';ctx.shadowBlur=5;
  ctx.fillStyle='#edf2cc';ctx.fillText('流云瀑',w.x,w.y-292);
  ctx.restore();
}
