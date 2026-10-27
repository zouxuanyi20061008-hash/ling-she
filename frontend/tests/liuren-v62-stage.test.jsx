// @vitest-environment jsdom
import React from 'react'
import {afterEach,it,expect,vi} from 'vitest'
import {render,screen,fireEvent,within,cleanup,waitFor} from '@testing-library/react'
import LiurenV58 from '../src/LiurenV58.jsx'
afterEach(()=>{cleanup();vi.unstubAllGlobals()})

const branches=['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥']
const sky=['亥','子','丑','寅','卯','辰','巳','午','未','申','酉','戌']
const titles=['太阴','天后','贵人','螣蛇','朱雀','六合',
              '勾陈','青龙','天空','白虎','太常','玄武']
const byEarth=Object.fromEntries(branches.map((p,i)=>[p,titles[i]]))
const byHeaven=Object.fromEntries(sky.map((p,i)=>[p,titles[i]]))
const base={
 version:'V62',day_ganzhi:'戊申',hour_branch:'巳',month_general:'辰',
 month_general_name:'天罡',day_stem_lodge:'巳',
 palaces:branches.map((earth,i)=>({earth,heaven:sky[i],
   heavenly_general:titles[i],general_element:'土',is_noble:earth==='寅'})),
 heaven_plate:Object.fromEntries(branches.map((v,i)=>[v,sky[i]])),
 four_lessons:[{number:1,upper:'辰',lower:'戊',upper_element:'土',lower_element:'土',
  relation:'无直接克',heavenly_general:'六合',general_element:'木'}],
 source:{earth_heaven_four_lessons:'https://zh.wikisource.org/wiki/六壬指南'},
 calendar_provenance:{previous_middle_term:{name:'春分',beijing_time:'2026-03-20T12:00:00+08:00'},
   next_middle_term:{name:'谷雨',beijing_time:'2026-04-20T12:00:00+08:00'},warnings:[]},
 heavenly_generals:{version:'V62',mode:'hour_branch',period:'昼贵',
   noble_branch:'丑',noble_ground_palace:'寅',direction:'顺行',
   day_stem:'戊',day_noble:'丑',night_noble:'未',manual_override:false,
   clock_basis:'卯至申固定昼，酉至寅固定夜',
   direction_basis:'贵人下临地盘亥子丑寅卯辰顺行',
   order:['贵人','螣蛇','朱雀','六合','勾陈','青龙','天空','白虎','太常','玄武','太阴','天后'],
   by_earth:byEarth,by_heaven:byHeaven},
 has_full_nine_methods:false,transmission_review:{version:'V62',method_family:'贼克'},
 three_transmissions:{status:'computed',method:'下贼上',initial_candidates:['丑'],
   transmissions:[{order:1,name:'初传',branch:'丑',earth_palace:'寅',heavenly_general:'贵人'},
    {order:2,name:'中传',branch:'寅',earth_palace:'卯',heavenly_general:'螣蛇'},
    {order:3,name:'末传',branch:'卯',earth_palace:'辰',heavenly_general:'朱雀'}]}
}
it('V62 defaults to fixed hour rules and shows 12 nobles on earth, lessons and transmissions',async()=>{
 const spy=vi.fn().mockResolvedValue({ok:true,json:async()=>base})
 vi.stubGlobal('fetch',spy)
 render(<LiurenV58/>)
 expect(screen.getByLabelText('贵人昼夜规则').value).toBe('hour_branch')
 fireEvent.click(screen.getByRole('button',{name:'起大六壬天地盘'}))
 expect(await screen.findByText(/下临地盘 寅 ·/)).toBeTruthy()
 const body=JSON.parse(spy.mock.calls[0][1].body)
 expect(body.noble_mode).toBeUndefined()
 const names=screen.getByRole('group',{name:'十二天将次序'})
 expect(within(names).getAllByText(/贵人|螣蛇|朱雀|六合|勾陈|青龙|天空|白虎|太常|玄武|太阴|天后/)).toHaveLength(12)
 const board=screen.getByRole('group',{name:'大六壬十二宫天地盘'})
 expect(within(board).getAllByRole('button')).toHaveLength(12)
 expect(within(board).getByText('贵人 · 土')).toBeTruthy()
 expect(screen.getByRole('group',{name:'大六壬三传'}).textContent).toContain('临地盘寅')
})
it('V62 manual night flag is explicit in request and result without guessing local sunrise',async()=>{
 const spy=vi.fn().mockResolvedValue({ok:true,json:async()=>{
    return {...base,heavenly_generals:{...base.heavenly_generals,mode:'night',
      period:'夜贵',manual_override:true,noble_branch:'未',noble_ground_palace:'申',
      direction:'逆行'}}
 }})
 vi.stubGlobal('fetch',spy)
 render(<LiurenV58/>)
 fireEvent.change(screen.getByLabelText('贵人昼夜规则'),{target:{value:'night'}})
 fireEvent.click(screen.getByRole('button',{name:'起大六壬天地盘'}))
 expect(await screen.findByText(/夜贵 未 ·/)).toBeTruthy()
 expect(JSON.parse(spy.mock.calls[0][1].body).noble_mode).toBe('night')
 expect(screen.getByText(/用户手动指定昼／夜贵/)).toBeTruthy()
})
