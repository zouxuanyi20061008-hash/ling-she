import { describe, expect, it } from 'vitest'
import { hexagramForLines } from '../src/casting-lessons.js'
import { TEXTS } from '../src/traditionContent.js'

const receivedOrder = `乾 坤 屯 蒙 需 讼 师 比 小畜 履 泰 否 同人 大有 谦 豫 随 蛊 临 观
噬嗑 贲 剥 复 无妄 大畜 颐 大过 坎 离 咸 恒 遁 大壮 晋 明夷 家人 睽 蹇 解
损 益 夬 姤 萃 升 困 井 革 鼎 震 艮 渐 归妹 丰 旅 巽 兑 涣 节 中孚 小过 既济 未济`.split(/\s+/)
const hexagrams = TEXTS.zhouyi

describe('藏经阁《周易》', () => {
  it('依通行卦序分上经三十卦和下经三十四卦，每卦可核对出处', () => {
    expect(hexagrams.map(hexagram => hexagram.heading)).toEqual(receivedOrder)
    expect(hexagrams.filter(hexagram => hexagram.volume === '《周易》 · 上经')).toHaveLength(30)
    expect(hexagrams.filter(hexagram => hexagram.volume === '《周易》 · 下经')).toHaveLength(34)
    expect(new Set(hexagrams.map(hexagram => hexagram.id)).size).toBe(64)
    expect(new Set(hexagrams.map(hexagram => hexagram.sourceUrl)).size).toBe(64)
    for (const hexagram of hexagrams) {
      expect(new URL(hexagram.sourceUrl).hostname).toBe('zh.wikisource.org')
      expect(hexagram.judgment).toBeTruthy()
      expect(hexagram.commentary).toBeTruthy()
      expect(hexagram.image).toBeTruthy()
    }
  })

  it('384 条常规爻辞的爻位与阴阳对应正确，乾坤另收用九、用六', () => {
    const patterns = [/^初[六九]$/, /^[六九]二$/, /^[六九]三$/, /^[六九]四$/, /^[六九]五$/, /^上[六九]$/]
    const signatures = new Set()
    for (const [index, hexagram] of hexagrams.entries()) {
      expect(hexagram.lines).toHaveLength(index < 2 ? 7 : 6)
      const regular = hexagram.lines.slice(0, 6)
      const bits = regular.map((line, position) => {
        expect(line.name).toMatch(patterns[position])
        expect(line.text).toBeTruthy()
        expect(line.image).toBeTruthy()
        return Number(line.name.includes('九'))
      })
      expect(hexagramForLines(bits).name).toBe(hexagram.heading)
      signatures.add(bits.join(''))
    }
    expect(signatures.size).toBe(64)
    expect(hexagrams[0].lines[6]).toMatchObject({ name: '用九', text: expect.any(String), image: expect.any(String) })
    expect(hexagrams[1].lines[6]).toMatchObject({ name: '用六', text: expect.any(String), image: expect.any(String) })
  })

  it('保留原乾、坤两篇的研读说明与位置', () => {
    expect(hexagrams[0]).toMatchObject({ id: 'yi-qian', heading: '乾', explanation: expect.stringContaining('自我修养') })
    expect(hexagrams[1]).toMatchObject({ id: 'yi-kun', heading: '坤', explanation: expect.stringContaining('承载之德') })
  })
})
