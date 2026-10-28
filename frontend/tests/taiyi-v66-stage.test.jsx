// @vitest-environment jsdom
import React from 'react'
import {afterEach,it,expect,vi} from 'vitest'
import {render,screen,fireEvent,within,cleanup} from '@testing-library/react'
import TaiyiV64 from '../src/TaiyiV64.jsx'
afterEach(()=>{cleanup();vi.unstubAllGlobals()})
const directions=['子','丑','艮','寅','卯','辰','巽','巳','午','未','坤','申','酉','戌','乾','亥']
const gods=['地主','阳德','和德','吕申','高丛','太阳','大炅','大神',
 '大威','天道','大武','武德','太簇','阴主','阴德','大义']
const sample={
 version:'V66',same_palace_rule:'wubeizhi',
 year:{gregorian_year:2026,accumulated_years:10155943,in_cycle_number:343,
 five_yuan_name:'壬子元',five_yuan_number:5,ju:55,ju_label:'阳遁55局',
 taiyi_palace:{number:3,trigram:'艮',direction:'东北'},
 year_governing:'理天',year_of_palace:1,full_360_year_cycles:100,
 three_year_cycle:19,jishen:'申',sexagenary_year:'丙午'},
 nine_palaces:[9,2,7,4,5,6,3,8,1].map(number=>({
 number,trigram:number===3?'艮':'乾',direction:'东北',
 is_taiyi:number===3,is_center_unoccupied:number===5})),
 palace_ring:[{number:1,trigram:'乾'},{number:2,trigram:'离'}],
 sixteen_spirits:directions.map((direction,index)=>({index,direction,
 god:gods[index],palace:direction==='艮'?3:null,
 has_wenchang:index===11,has_shiji:index===2,has_jishen:index===11})),
 main_guest:{
 status:'computed',same_palace_rule_label:'《武备志》同宫取本宫宫数（V66 默认）',
 heaven_eye_wenchang:{index:11,direction:'申',god:'武德',count_in_18:1},
 earth_eye_shiji:{index:2,direction:'艮',god:'和德'},
 main_calculated:16,guest_calculated:3,verified_by_independent_ancient_case:true,
 main_general:{status:'computed',count:16,main_general:6,assistant_general:8,
 stop_palace:3,trace:[{order:1,direction:'申',god:'武德',added:1},
 {order:2,direction:'酉',god:'太簇',added:6}]},
 guest_general:{status:'computed',count:3,main_general:3,assistant_general:9,
 stop_palace:3,special_rule_applied:true,
 trace:[{order:1,direction:'艮',god:'起算目临太乙',added:3}]}
 },
 historical_case_audit:{ju:55,status:'verified_original_text'},
 school_disagreements:[],
 sources:{historical_1624:'https://zh.wikisource.org/',
 historical_1561:'https://www.shidianguji.com/'}
}
it('V66 shows real same-palace 3 count with 16 spirit chart and source provenance',async()=>{
 const spy=vi.fn().mockResolvedValue({ok:true,json:async()=>sample})
 vi.stubGlobal('fetch',spy)
 render(<TaiyiV64/>)
 expect(screen.getByLabelText('太乙同宫计算口径').value).toBe('wubeizhi')
 fireEvent.change(screen.getByLabelText('太乙岁计公历年'),{target:{value:'2026'}})
 fireEvent.click(screen.getByRole('button',{name:'计算太乙年局'}))
 expect(await screen.findByText(/2026年 · 壬子元/)).toBeTruthy()
 expect(JSON.parse(spy.mock.calls[0][1].body)).toEqual({gregorian_year:2026})
 const group=screen.getByRole('group',{name:'V65 主客逐宫投算证据'})
 expect(group.textContent).toContain('3 算')
 expect(screen.getByText(/同宫特例已计算/)).toBeTruthy()
 expect(screen.getByText(/第55局已与独立古籍原文逐项核对/)).toBeTruthy()
 expect(screen.getByRole('group',{name:'太乙十六神方位'}).querySelectorAll('button')).toHaveLength(16)
})
it('V66 user selecting conservative calls API with explicit school and shows pending',async()=>{
 const conservative={...sample,main_guest:{...sample.main_guest,
 status:'partially_computed',
 same_palace_rule_label:'保守口径：与太乙同宫保留待算（V65）',
 guest_calculated:null,verified_by_independent_ancient_case:false,
 guest_general:{status:'pending',count:null,reason:'同宫起算，保持待校勘',
 historical_alternative:{school:'《武备志》',calculated_count:3,main_general:3,
 assistant_general:9,source:'https://www.shidianguji.com/'}}},
 historical_case_audit:null}
 const spy=vi.fn().mockResolvedValue({ok:true,json:async()=>conservative})
 vi.stubGlobal('fetch',spy)
 render(<TaiyiV64/>)
 fireEvent.change(screen.getByLabelText('太乙同宫计算口径'),{target:{value:'conservative'}})
 fireEvent.click(screen.getByRole('button',{name:'计算太乙年局'}))
 expect(await screen.findByText(/2026年 · 壬子元/)).toBeTruthy()
 expect(JSON.parse(spy.mock.calls[0][1].body)).toEqual({
 gregorian_year:2026,same_palace_rule:'conservative'})
 expect(screen.getByText(/仅部分已计算/)).toBeTruthy()
 expect(screen.getByText(/同宫按宫数：3算/)).toBeTruthy()
})
it('V66 disputed 58th-year values show both ancient witnesses without overwriting',async()=>{
 const dispute={...sample,school_disagreements:[{
 topic:'阳遁58局文昌阴德的主算',chosen_school:'《武备志》',
 chosen_main_count:12,other_school:'《太乙秘书》',other_main_count:13,
 chosen_source:'https://www.shidianguji.com/',
 other_source:'https://libokang.com/'}]}
 vi.stubGlobal('fetch',vi.fn().mockResolvedValue({ok:true,json:async()=>dispute}))
 render(<TaiyiV64/>)
 fireEvent.click(screen.getByRole('button',{name:'计算太乙年局'}))
 const c=await screen.findByRole('group',{name:'太乙古籍异文比对'})
 expect(within(c).getByText(/主算12/)).toBeTruthy()
 expect(within(c).getByText(/主算13/)).toBeTruthy()
})
