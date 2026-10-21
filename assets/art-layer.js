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
var bankArt=new Image();bankArt.src='assets/riverbank-edge.svg';
function isArtReady(img){return !!(img&&img.complete&&img.naturalWidth>0)}
function scenePathGeometry(){
  ctx.beginPath();ctx.moveTo(80,1530);
  ctx.bezierCurveTo(360,1530,600,1660,835,1760);
  ctx.bezierCurveTo(920,1798,990,1800,streamCenter(1800),1800);
  ctx.bezierCurveTo(1290,1800,1530,1800,1750,1800);
  ctx.bezierCurveTo(2150,1800,2550,2100,3450,2210);
}
function paintStoneRoad(){
  ctx.save();ctx.lineCap='round';ctx.lineJoin='round';
  scenePathGeometry();ctx.strokeStyle='#324c3a88';ctx.lineWidth=96;ctx.stroke();
  scenePathGeometry();ctx.strokeStyle='#c0ad80';ctx.lineWidth=82;ctx.stroke();
  scenePathGeometry();ctx.strokeStyle=isArtReady(pathArt)?ctx.createPattern(pathArt,'repeat'):'#aa9675';ctx.lineWidth=71;ctx.stroke();
  ctx.restore();
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
function paintBambooStand(x,y,scale){
  if(!isArtReady(bambooArt))return false;
  var width=76*scale,height=94*scale;
  ctx.save();ctx.fillStyle='#193d3140';ctx.beginPath();ctx.ellipse(x+6,y+2,width*.48,width*.13,0,0,Math.PI*2);ctx.fill();
  ctx.drawImage(bambooArt,x-width*.5,y-height,width,height);ctx.restore();return true;
}
