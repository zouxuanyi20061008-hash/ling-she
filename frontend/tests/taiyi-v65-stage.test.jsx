// @vitest-environment jsdom
import React from 'react'
import {afterEach,it,expect,vi} from 'vitest'
import {render,screen,fireEvent,within,cleanup} from '@testing-library/react'
import TaiyiV64 from '../src/TaiyiV64.jsx'
afterEach(()=>{cleanup();vi.unstubAllGlobals()})
const names=['地主','阳德','和德','吕申','高丛','太阳','大炅','大神',
 '大威','天道','大武','武德','太簇','阴主','阴德','大义']
const way=['子','丑','艮','寅','卯','辰','巽','巳','午','未','坤','申','酉','戌','乾','亥']
const ring=way.map((direction,index)=>({index,direction,god:names[index],
 palace:direction==='艮'?3:direction==='巽'?9:null,
 has_wenchang:index===11,has_shiji:index===2,has_jishen:index===11}))
const palaceNumbers=[9,2,7,4,5,6,3,8,1]
const basis={
 version:'V65',
 year:{gregorian_year:2026,accumulated_years:10155943,in_cycle_number:343,
 five_yuan_name:'壬子元',five_yuan_number:5,ju:55,ju_label:'阳遁55局',
 taiyi_palace:{number:3,trigram:'艮',direction:'东北'},
 year_governing:'理天',year_of_palace:1,full_360_year_cycles:100,
 three_year_cycle:19,jishen:'申',sexagenary_year:'丙午'},
 nine_palaces:palaceNumbers.map(number=>({
 number,direction:'东北',trigram:number===3?'艮':'乾',
 is_taiyi:number===3,is_center_unoccupied:number===5})),
 palace_ring:[{number:1,trigram:'乾'},{number:2,trigram:'离'}],
 sixteen_spirits:ring,
 main_guest:{status:'partially_computed',heaven_eye_wenchang:{
 god:'武德',direction:'申',count_in_18:1,index:11},
 earth_eye_shiji:{god:'和德',direction:'艮',index:2},
 main_calculated:16,guest_calculated:null,verified_by_independent_ancient_case:false,
 main_general:{status:'computed',count:16,main_general:6,assistant_general:8,
   stop_palace:3,trace:[{order:1,direction:'申',god:'武德',added:1},
   {order:2,direction:'酉',god:'太簇',added:6}]},
 guest_general:{status:'pending',count:null,reason:'始击与太乙同宫',
 historical_alternative:{school:'《武备志》卷一百六十九',calculated_count:3,
 main_general:3,assistant_general:9,source:'https://www.shidianguji.com/'}}},
 sources:{historical_1624:'https://zh.wikisource.org/',
 historical_1561:'https://www.shidianguji.com/'}
}
it('V65 renders all sixteen positions, pending 2026 guest and separately labeled historical alternative',async()=>{
 const spy=vi.fn().mockResolvedValue({ok:true,json:async()=>basis})
 vi.stubGlobal('fetch',spy)
 render(<TaiyiV64/>)
 fireEvent.change(screen.getByLabelText('太乙岁计公历年'),{target:{value:'2026'}})
 fireEvent.click(screen.getByRole('button',{name:'计算太乙年局'}))
 expect(await screen.findByText(/2026年 · 壬子元/)).toBeTruthy()
 const sixteen=screen.getByRole('group',{name:'太乙十六神方位'})
 expect(within(sixteen).getAllByRole('button')).toHaveLength(16)
 expect(screen.getByRole('group',{name:'V65 主客逐宫投算证据'}).textContent).toContain('16 算')
 expect(screen.getByText(/同宫按宫数：3算/)).toBeTruthy()
 expect(screen.getByText(/此为独立异派结果/)).toBeTruthy()
 expect(screen.getByText(/仅部分已计算/)).toBeTruthy()
 fireEvent.click(within(sixteen).getAllByRole('button')[2])
 expect(screen.getByText(/选中：艮 · 和德/)).toBeTruthy()
 expect(JSON.parse(spy.mock.calls[0][1].body)).toEqual({gregorian_year:2026})
})
it('V65 two-sided independently verified year shows two calculated walk traces',async()=>{
 const full={...basis,year:{...basis.year,gregorian_year:1624},
 main_guest:{...basis.main_guest,status:'computed',
 verified_by_independent_ancient_case:true,guest_calculated:19,
 guest_general:{status:'computed',count:19,main_general:9,assistant_general:7,
 stop_palace:6,trace:[{order:1,direction:'辰',god:'太阳',added:1},
 {order:2,direction:'巽',god:'大炅',added:9}]}}}
 vi.stubGlobal('fetch',vi.fn().mockResolvedValue({ok:true,json:async()=>full}))
 render(<TaiyiV64/>)
 fireEvent.click(screen.getByRole('button',{name:'计算太乙年局'}))
 expect(await screen.findByText(/1624年 · 壬子元/)).toBeTruthy()
 expect(screen.getByText(/本年份文昌、始击、主客算已与独立古籍固定例盘逐项相符/)).toBeTruthy()
 expect(screen.getByText(/两方均已计算/)).toBeTruthy()
 expect(screen.getByText('19 算')).toBeTruthy()
})
