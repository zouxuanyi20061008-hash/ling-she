// @vitest-environment node
// V20 regression: independent themes must retain legible foreground/background.
import {it,expect} from 'vitest'
import {readFileSync} from 'node:fs'
const style=readFileSync(new URL('../src/theme-refresh.css',import.meta.url),'utf8')
const stage=readFileSync(new URL('../src/SixYaoStage.jsx',import.meta.url),'utf8')
function luminance(hex){
  const rgb=[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255)
  const linear=rgb.map(v=>v<=.04045?v/12.92:Math.pow((v+.055)/1.055,2.4))
  return linear[0]*.2126+linear[1]*.7152+linear[2]*.0722
}
function contrast(a,b){
  const x=luminance(a),y=luminance(b)
  return (Math.max(x,y)+.05)/(Math.min(x,y)+.05)
}
it('all main reading palettes meet WCAG AA 4.5:1 text contrast',()=>{
  const pairs=[
    ['#fff8e9','#703e26'], // 六爻选中
    ['#543b29','#fff7e9'], // 六爻默认
    ['#f6eddb','#172e43'], // 奇门深夜
    ['#f3e9f9','#29243e'], // 紫微星垣
    ['#fff3db','#6e3c22'], // 八字简牍
    ['#25352a','#f9f2e3'], // 梅花书卷
    ['#344d3e','#fffaf0'], // 梅花卦义
    ['#435545','#f6f0e3'], // 藏经阁辅助正文
    ['#533e2d','#f2e6d4'], // 六爻专题提示
    ['#fff6e7','#75422b'] // 折叠详情
  ]
  for(const [fg,bg] of pairs)expect(contrast(fg,bg),fg+' on '+bg).toBeGreaterThanOrEqual(4.5)
})
it('eight arts retain separate visual skins and small-screen safeguards',()=>{
  for(const id of ['meihua','liuyao','qimen','bazi','liuren','taiyi','ziwei','fengshui'])
    expect(style).toContain('atlas-method--'+id)
  expect(style).toContain('scroll-snap-type:x proximity')
  expect(style).toContain('focus-visible')
  expect(style).toContain('prefers-reduced-motion')
  expect(style).toContain('.liuyao-cast-error button')
})
it('frontend maintains Chinese calendar and sealed local notes during UI changes',()=>{
  expect(stage).toContain("timeZone:'Asia/Shanghai'")
  expect(stage).toContain('中国历法 · 农历 / 公历换算')
  expect(stage).toContain("const CASE_ARCHIVE_KEY='wanxiang-liuyao-case-archive-v1'")
  expect(stage).toContain('if(openOnSuccess)')
  expect(stage).toContain('保留这六爻 · 重新排盘')
})
