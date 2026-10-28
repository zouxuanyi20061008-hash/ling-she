// @vitest-environment jsdom
import React from 'react'
import {afterEach,it,expect,vi} from 'vitest'
import {render,screen,fireEvent,within,cleanup} from '@testing-library/react'
import ZiweiV68 from '../src/ZiweiV68.jsx'
afterEach(()=>{cleanup();vi.unstubAllGlobals()})
const br='子丑寅卯辰巳午未申酉戌亥'.split('')
const chart={
 version:'V69',year_ganzhi:'壬申',ming_ganzhi:'乙酉',shen_branch:'未',
 ming_branch:'酉',ziwei_branch:'卯',tianfu_branch:'丑',hour_branch:'巳',
 great_limit_direction:'顺行',five_element_bureau:{label:'水二局',number:2},
 calendar:{solar_date:'1992-02-08',lunar:{display:'1992年1月4日'},verification:'lunar_python'},
 input:{clock:'09:00'},rules:{leap_month:'闰月当本月',year_boundary:'农历正月初一',ming_shen:'寅起正月'},
 ziwei_trace:{day:4,borrowed:0,quotient:2,borrow_direction:'不借数',result:'卯'},
 auxiliary_star_positions:{左辅:'辰',右弼:'戌',文昌:'巳'},
 four_transform_school_label:'《紫微斗数全书》卷二',
 four_transformations:[
  {name:'化禄',star:'天梁',branch:'午',palace_name:'夫妻'},
  {name:'化权',star:'紫微',branch:'卯',palace_name:'官禄'},
  {name:'化科',star:'天府',branch:'丑',palace_name:'财帛'},
  {name:'化忌',star:'武曲',branch:'亥',palace_name:'命宫'}
 ],
 four_transform_disagreement:{chosen_star:'天府',quanshu_star:'天府',common_star:'左辅'},
 auxiliary_rules:{month:'辅弼按月',hour:'昌曲按时',year_stem:'禄存按干',year_branch:'天马按支',
  variant:'壬化科两套口径'},
 palaces:br.map((branch,i)=>({branch,ganzhi:'甲'+branch,
  name:branch==='酉'?'命宫':'第'+i+'宫',is_ming:branch==='酉',
  is_shen:branch==='未',main_stars:branch==='卯'?['紫微']:[],
  auxiliary_stars:branch==='辰'?['左辅']:[],
  four_transformations:branch==='丑'?[{name:'化科',star:'天府'}]:[],
  great_limit:null
 })),
 not_implemented:['流年四化'],warnings:[]
}
it('V69 renders four transformations and actual auxiliary stars in twelve palace grid',async()=>{
 const spy=vi.fn().mockResolvedValue({ok:true,json:async()=>chart})
 vi.stubGlobal('fetch',spy)
 render(<ZiweiV68/>)
 fireEvent.click(screen.getByRole('button',{name:'计算紫微命盘'}))
 const area=await screen.findByRole('group',{name:'V69 生年四化落宫'})
 expect(within(area).getAllByText(/化/)).toHaveLength(4)
 expect(area.textContent).toContain('天府')
 const grid=screen.getByRole('group',{name:'V69 紫微十二宫星盘'})
 expect(within(grid).getAllByRole('button')).toHaveLength(12)
 expect(within(grid).getByText('左辅')).toBeTruthy()
 expect(within(grid).getByText('天府化科')).toBeTruthy()
 fireEvent.click(within(grid).getByRole('button',{name:/甲丑/}))
 expect(screen.getByRole('region',{name:'当前选中的紫微宫位'}).textContent).toContain('天府化科')
 expect(screen.getByText(/壬年异文：本次化科采用天府/)).toBeTruthy()
 expect(JSON.parse(spy.mock.calls[0][1].body).four_transform_school).toBeUndefined()
})
it('V69 other school submits an explicit option, never silently replaces original',async()=>{
 const spy=vi.fn().mockResolvedValue({ok:true,json:async()=>({
   ...chart,four_transform_school_label:'现代通行表',
   four_transform_disagreement:{...chart.four_transform_disagreement,chosen_star:'左辅'},
 })})
 vi.stubGlobal('fetch',spy)
 render(<ZiweiV68/>)
 fireEvent.change(screen.getByLabelText('紫微四化流派'),{target:{value:'common'}})
 fireEvent.click(screen.getByRole('button',{name:'计算紫微命盘'}))
 expect(await screen.findByRole('group',{name:'V69 生年四化落宫'})).toBeTruthy()
 expect(JSON.parse(spy.mock.calls[0][1].body).four_transform_school).toBe('common')
 expect(screen.getByText(/壬年异文：本次化科采用左辅/)).toBeTruthy()
})
