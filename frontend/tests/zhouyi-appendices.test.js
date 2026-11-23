import { describe, expect, it } from 'vitest'
import { ZHOUYI_APPENDICES } from '../src/zhouyiAppendices.js'

const texts = Object.fromEntries(ZHOUYI_APPENDICES.map(book => [book.id, book.sections]))
const joined = id => texts[id].flatMap(section => section.paragraphs).join('')

describe('藏经阁《周易》易传', () => {
  it('每篇使用固定版本，原文按底本篇章收齐', () => {
    expect(ZHOUYI_APPENDICES.map(({ title }) => title)).toEqual([
      '文言传', '系辞上传', '系辞下传', '说卦传', '序卦传', '杂卦传',
    ])
    expect(ZHOUYI_APPENDICES.map(({ sections }) => sections.length)).toEqual([2, 12, 9, 11, 2, 1])
    expect(ZHOUYI_APPENDICES.map(({ sections }) =>
      sections.reduce((count, section) => count + section.paragraphs.length, 0))).toEqual([23, 25, 35, 47, 63, 31])
    for (const { source, sections } of ZHOUYI_APPENDICES) {
      const url = new URL(source)
      expect(url.hostname).toBe('zh.wikisource.org')
      expect(url.searchParams.get('oldid')).toMatch(/^\d+$/)
      expect(new Set(sections.map(section => section.heading)).size).toBe(sections.length)
      for (const { paragraphs } of sections) {
        expect(paragraphs.length).toBeGreaterThan(0)
        expect(paragraphs.every(text => text.length > 4 && !text.includes('编辑'))).toBe(true)
      }
    }
  })

  it('文言有乾坤两篇，保留卦名「乾」与不同义的「干」', () => {
    expect(texts['yi-wenyan'].map(section => section.heading)).toEqual(['乾文言', '坤文言'])
    expect(joined('yi-wenyan')).toContain('贞者事之干也')
    expect(joined('yi-wenyan')).toContain('乾元用九')
    expect(joined('yi-wenyan')).toContain('天玄而地黄。')
    expect(joined('yi-xici-shang')).toContain('乾之策，二百一十有六')
    expect(joined('yi-shuogua')).toContain('乾为天、为圜、为君')
  })

  it('各传保留典型段落和原有结尾', () => {
    expect(joined('yi-xici-shang')).toContain('大衍之数五十，其用四十有九')
    expect(joined('yi-xici-shang')).toMatch(/默而成之，不言而信，存乎德行。$/)
    expect(joined('yi-xici-xia')).toContain('易穷则变，变则通，通则久')
    expect(joined('yi-xici-xia')).toMatch(/失其守者其辞屈。$/)
    expect(joined('yi-shuogua')).toContain('天地定位，山泽通气')
    expect(joined('yi-xugua')).toMatch(/故受之以未济；终焉。$/)
    expect(joined('yi-zagua')).toMatch(/^乾刚坤柔，比乐师忧。.*君子道长，小人道消也。$/)
  })
})
