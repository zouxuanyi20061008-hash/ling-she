/** Hands-on beginner lessons: mirror deterministic rules, never claim predictions. */
export const EIGHT_TRIGRAMS=[
  {number:1,name:'乾',symbol:'☰',image:'天',element:'金',direction:'西北',lines:[1,1,1],hint:'健行、规则、主动承担'},
  {number:2,name:'兑',symbol:'☱',image:'泽',element:'金',direction:'西',lines:[1,1,0],hint:'沟通、言语、交流'},
  {number:3,name:'离',symbol:'☲',image:'火',element:'火',direction:'南',lines:[1,0,1],hint:'明亮、辨识、消息'},
  {number:4,name:'震',symbol:'☳',image:'雷',element:'木',direction:'东',lines:[1,0,0],hint:'发动、起步、变化'},
  {number:5,name:'巽',symbol:'☴',image:'风',element:'木',direction:'东南',lines:[0,1,1],hint:'往来、渗透、协调'},
  {number:6,name:'坎',symbol:'☵',image:'水',element:'水',direction:'北',lines:[0,1,0],hint:'险阻、流动、审慎'},
  {number:7,name:'艮',symbol:'☶',image:'山',element:'土',direction:'东北',lines:[0,0,1],hint:'停止、界限、稳固'},
  {number:8,name:'坤',symbol:'☷',image:'地',element:'土',direction:'西南',lines:[0,0,0],hint:'承载、合作、基础'}
]
/* Mirrors backend/app/core/hexagrams.py: rows = upper trigram, cols = lower trigram. */
export const HEXAGRAM_SHORT_NAMES=[
 ['乾','履','同人','无妄','姤','讼','遁','否'],
 ['夬','兑','革','随','大过','困','咸','萃'],
 ['大有','睽','离','噬嗑','鼎','未济','旅','晋'],
 ['大壮','归妹','丰','震','恒','解','小过','豫'],
 ['小畜','中孚','家人','益','巽','涣','渐','观'],
 ['需','节','既济','屯','井','坎','蹇','比'],
 ['大畜','损','贲','颐','蛊','蒙','艮','剥'],
 ['泰','临','明夷','复','升','师','谦','坤']
]
const trigramByLines=new Map(EIGHT_TRIGRAMS.map(t=>[t.lines.join(''),t]))
export function hexagramForLines(bits){
  if(!Array.isArray(bits)||bits.length!==6||bits.some(v=>v!==0&&v!==1))
    throw new Error('必须提供从初爻到上爻的六条阴阳线')
  const lower=trigramByLines.get(bits.slice(0,3).join(''))
  const upper=trigramByLines.get(bits.slice(3).join(''))
  return {name:HEXAGRAM_SHORT_NAMES[upper.number-1][lower.number-1],
    upper,lower,lines:[...bits]}
}
export function coinLine(faces){
  if(!Array.isArray(faces)||faces.length!==3||faces.some(n=>n!==2&&n!==3))
    throw new Error('请用三枚钱币，字面记2、背面记3')
  const sum=faces.reduce((s,n)=>s+n,0)
  const label={6:'老阴',7:'少阳',8:'少阴',9:'老阳'}[sum]
  const yang=sum===7||sum===9
  const moving=sum===6||sum===9
  return {sum,label,yang,moving,changedYang:moving?!yang:yang,
    faceLabels:faces.map(n=>n===2?'字':'背')}
}
export function analyzeSixCoins(numbers){
  if(!Array.isArray(numbers)||numbers.length>6||
    numbers.some(n=>!Number.isInteger(n)||n<6||n>9))
    throw new Error('六爻必须按从下到上的顺序记录6、7、8、9')
  const parsed=numbers.map(n=>coinLine([2,2,2].map((_,i)=>{
    // Use an exact three-face representation matching the sum n.
    return i<n-6?3:2
  })))
  const movingPositions=parsed.flatMap((x,i)=>x.moving?[i+1]:[])
  if(numbers.length!==6)return {complete:false,lines:parsed,movingPositions}
  const original=parsed.map(x=>x.yang?1:0)
  const changed=parsed.map(x=>x.changedYang?1:0)
  return {complete:true,lines:parsed,movingPositions,
    original:hexagramForLines(original),changed:hexagramForLines(changed)}
}
function validPositive(n){
  return Number.isSafeInteger(n)&&n>=1&&n<=99999999
}
export function meihuaTwoNumbers(a,b){
  if(!validPositive(a)||!validPositive(b))
    throw new Error('请输入两组 1～99999999 的正整数')
  const rem=(n,m)=>(n-1)%m+1
  const upper=EIGHT_TRIGRAMS[rem(a,8)-1]
  const lower=EIGHT_TRIGRAMS[rem(b,8)-1]
  const moving=rem(a+b,6)
  const original=hexagramForLines([...lower.lines,...upper.lines])
  const bits=[...original.lines]
  bits[moving-1]=1-bits[moving-1]
  const changed=hexagramForLines(bits)
  const ti=moving<=3?upper:lower
  const yong=moving<=3?lower:upper
  return {a,b,upper,lower,moving,original,changed,ti,yong,
    upperRemainder:a%8,lowerRemainder:b%8,movingRemainder:(a+b)%6}
}
export function trainingCoinExplanation(sum){
  const labels={6:'老阴（动）',7:'少阳（静）',8:'少阴（静）',9:'老阳（动）'}
  return labels[sum]||'无效爻数'
}
