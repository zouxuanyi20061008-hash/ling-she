import {existsSync, readFileSync} from 'node:fs'
import {describe, expect, it} from 'vitest'
import meihua from '../src/classics/meihua.json'
import liuyao from '../src/classics/liuyao.json'
import bazi from '../src/classics/bazi.json'
import qimen from '../src/classics/qimen.json'

describe('藏经阁古籍底本',()=>{
  it('保留梅花三卷、序、目录和附录，并可打开五卷本拆字两卷及原图',()=>{
    const volumes=meihua.volumes
    expect(volumes.map(v=>v.id)).toEqual([
      'meihua-preface','meihua-contents','meihua-1','meihua-2','meihua-3',
      'meihua-appendix','meihua-scan-4','meihua-scan-5',
    ])
    const diagram=volumes.find(v=>v.id==='meihua-3').sections.find(s=>s.heading==='八卦方位圖')
    expect(diagram.facsimile).toMatch(/#page=103$/)
    expect(diagram.images[0].alt).toContain('八卦方位')
    const localDiagram=new URL('../public/classics/meihua-bagua-juan3.webp',import.meta.url)
    expect(existsSync(localDiagram)).toBe(true)
    expect(readFileSync(localDiagram).subarray(8,12).toString()).toBe('WEBP')
    expect(volumes.slice(-2).map(v=>new URL(v.facsimile).hash)).toEqual(['#page=145','#page=189'])
  })

  it('保留增删卜易四卷、重号、六神表和原卦式',()=>{
    const vols=liuyao.volumes.slice(2)
    expect(vols.map(v=>v.id)).toEqual(['liuyao-1','liuyao-2','liuyao-3','liuyao-4'])
    expect(vols[0].sections.filter(s=>s.heading.includes('又二十六'))).toHaveLength(4)
    expect(vols[1].sections.some(s=>s.heading.includes('千金賦'))).toBe(true)
    expect(vols[0].sections.flatMap(s=>s.blocks??[]).some(block=>block.type==='pre'&&block.text.includes('\n'))).toBe(true)
    const table=vols[0].sections.flatMap(s=>s.tables??[]).find(rows=>rows[0].some(c=>c.includes('甲乙日')))
    expect(table).toHaveLength(7)
    expect(liuyao.facsimile).toContain('NLC416-12jh005345-45344')
  })

  it('保留单一四库本三命通会的提要和十二卷，并记录见本原字',()=>{
    const volumes=bazi.volumes
    expect(volumes.map(v=>v.id)).toEqual(Array.from({length:13},(_,i)=>'bazi-'+i))
    expect(volumes.slice(1).every(v=>v.sections.length>10)).toBe(true)
    expect(volumes[10].sections.some(s=>/命口訣|命口诀/.test(s.heading))).toBe(true)
    expect(volumes[11].sections.some(s=>s.heading.includes('气象篇'))).toBe(true)
    expect(volumes[12].sections.some(s=>s.heading.includes('元理赋'))).toBe(true)
    expect(bazi.glyphs.some(g=>g.id==='SKQS_2636')).toBe(true)
    expect(volumes.slice(-3).every(v=>v.source.includes('oldid='))).toBe(true)
  })

  it('保留遁甲演义提要、四卷、十八局图及附图原影',()=>{
    expect(qimen.volumes.map(v=>v.title)).toEqual(['提要','卷一','卷二','卷三','卷四'])
    expect(qimen.volumes.every(v=>v.source.includes('oldid='))).toBe(true)
    const sections=qimen.volumes.flatMap(volume=>volume.sections)
    expect(sections.find(section=>section.heading==='遁甲源流').paragraphs[0]).toContain('四千三百二十局')
    expect(sections.find(section=>section.heading==='六丁符式').paragraphs.length).toBeGreaterThan(0)
    const charts=sections.filter(section=>section.heading.startsWith('十八局图'))
    expect(charts.map(section=>section.heading)).toEqual([
      '十八局图 · 阳遁一局、二局','十八局图 · 阳遁三局、四局','十八局图 · 阳遁五局、六局',
      '十八局图 · 阳遁七局、八局','十八局图 · 阳遁九局、阴遁九局','十八局图 · 阴遁八局、七局',
      '十八局图 · 阴遁六局、五局','十八局图 · 阴遁四局、三局','十八局图 · 阴遁二局、一局',
    ])
    const images=sections.flatMap(section=>section.images??[])
    expect(images).toHaveLength(16)
    for(const {src} of images){
      const image=new URL(`../public${src}`,import.meta.url)
      expect(readFileSync(image).subarray(8,12).toString()).toBe('WEBP')
    }
  })
})
