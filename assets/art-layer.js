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
