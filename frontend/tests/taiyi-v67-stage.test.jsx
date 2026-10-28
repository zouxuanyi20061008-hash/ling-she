// @vitest-environment jsdom
import React from 'react'
import {afterEach,it,expect,vi} from 'vitest'
import {render,screen,fireEvent,within,cleanup} from '@testing-library/react'
import TaiyiV64 from '../src/TaiyiV64.jsx'
afterEach(()=>{cleanup();vi.unstubAllGlobals()})
const DS='子丑艮寅卯辰巽巳午未坤申酉戌乾亥'.split('')
const G='地主 阳德 和德 吕申 高丛 太阳 大炅 大神 大威 天道 大武 武德 太簇 阴主 阴德 大义'.split(' ')
const sky=DS.map((direction,index)=>({index,direction,god:G[index],
 has_wenchang:index===11,has_shiji:index===2,has_jishen:index===11,
 palace:direction==='艮'?3:null}))
const mock={
 version:'V67',same_palace_rule:'wubeizhi',
 year:{gregorian_year:2026,accumulated_years:10155943,in_cycle_number:343,
 five_yuan_name:'壬子元',five_yuan_number:5,ju:55,ju_label:'阳遁55局',
 taiyi_palace:{number:3,trigram:'艮',direction:'东北'},
 year_governing:'理天',year_of_palace:1,full_360_year_cycles:100,
 three_year_cycle:19,jishen:'申',sexagenary_year:'丙午'},
 nine_palaces:[9,2,7,4,5,6,3,8,1].map(number=>({
 number,trigram:number===3?'艮':'乾',direction:'东北',
 is_taiyi:number===3,is_center_unoccupied:number===5,
 dingji_eye_here:number===7,dingji_big_general_here:number===2,
 dingji_assistant_here:number===6,
 any_general_five:false})),
 palace_ring:[{number:1,trigram:'乾'},{number:2,trigram:'离'}],
 sixteen_spirits:sky,
 main_guest:{
 status:'computed',same_palace_rule_label:'《武备志》同宫取本宫宫数',
 heaven_eye_wenchang:{index:11,direction:'申',god:'武德',count_in_18:1},
 earth_eye_shiji:{index:2,direction:'艮',god:'和德'},
 main_calculated:16,guest_calculated:3,verified_by_independent_ancient_case:true,
 main_general:{status:'computed',count:16,main_general:6,assistant_general:8,
 stop_palace:3,trace:[{order:1,direction:'申',god:'武德',added:1}]},
 guest_general:{status:'computed',count:3,main_general:3,assistant_general:9,
 stop_palace:3,special_rule_applied:true,
 trace:[{order:1,direction:'艮',god:'起算目临太乙',added:3}]}
 },
 dingji_v67:{version:'V67',status:'computed',year_branch:'午',
 harmony_branch:'未',wenchang_sky_direction:'申',
 dingji_ground_direction:'坤',dingji_ground_god:'大武',
 count:22,main_general:2,assistant_general:6,
 rule:'wubeizhi',trace:[
 {direction:'坤',god:'大武',added:7},
 {direction:'酉',god:'太簇',added:6},
 {direction:'乾',god:'阴德',added:1},
 {direction:'子',god:'地主',added:8}],
 rotated_sixteen:DS.map((direction,i)=>({
 ground:direction,heaven:DS[(i+1)%16],
 is_year_ground:direction==='午',is_dingji_eye:direction==='坤'})),
 sources:{annual_dingji:'https://ctext.org/wiki.pl?chapter=948786&if=gb'}},
 middle_five_states:{case_count:0,cases:[],taiyi_can_enter_center:false},
 historical_case_audit:{ju:55,status:'verified_original_text'},school_disagreements:[],
 sources:{historical_1624:'https://zh.wikisource.org/',
 historical_1561:'https://www.shidianguji.com/'}
}
it('V67 annual Dingji actually renders 22 as 7+6+1+8 and the rotation evidence',async()=>{
 const spy=vi.fn().mockResolvedValue({ok:true,json:async()=>mock})
 vi.stubGlobal('fetch',spy)
 render(<TaiyiV64/>)
 fireEvent.click(screen.getByRole('button',{name:'计算太乙年局'}))
 expect(await screen.findByText(/2026年 · 壬子元/)).toBeTruthy()
 const area=screen.getByRole('group',{name:'V67 定计目及大参将真实计算'})
 expect(area.textContent).toContain('六合神')
 expect(area.textContent).toContain('22')
 expect(area.textContent).toContain('定计大将')
 expect(area.textContent).toContain('定计参将')
 const trace=within(area).getByRole('group',{name:'定计逐宫加算明细'})
 expect(trace.textContent).toContain('坤 大武 +7')
 const details=within(area).getByText('查看十六神天地盘旋转的完整依据')
 fireEvent.click(details)
 expect(within(area).getByRole('group',{name:'定计十六神旋盘证据'}).textContent).toContain('定计目')
 expect(JSON.parse(spy.mock.calls[0][1].body)).toEqual({gregorian_year:2026})
})
it('V67 center 5 keeps original numeric major and assistant generals without Taiyi moving',async()=>{
 const variant={...mock,year:{...mock.year,gregorian_year:2027},
 nine_palaces:mock.nine_palaces.map(p=>({...p,any_general_five:p.number===5})),
 middle_five_states:{case_count:2,taiyi_can_enter_center:false,
 cases:[{side:'主方',kind:'大将',number:5},
        {side:'主方',kind:'参将',number:5}]}}
 vi.stubGlobal('fetch',vi.fn().mockResolvedValue({ok:true,json:async()=>variant}))
 render(<TaiyiV64/>)
 fireEvent.click(screen.getByRole('button',{name:'计算太乙年局'}))
 const area=await screen.findByRole('group',{name:'V67 中五将不出及太乙不入中宫'})
 expect(area.textContent).toContain('主方 大将：中五不出')
 expect(area.textContent).toContain('主方 参将：中五不出')
 expect(screen.getByText('太乙中五不游')).toBeTruthy()
})
it('V67 old V66 response remains renderable with no Dingji reference',async()=>{
 const prior={...mock,version:'V66',dingji_v67:undefined,middle_five_states:undefined}
 vi.stubGlobal('fetch',vi.fn().mockResolvedValue({ok:true,json:async()=>prior}))
 render(<TaiyiV64/>)
 fireEvent.click(screen.getByRole('button',{name:'计算太乙年局'}))
 expect(await screen.findByText(/2026年 · 壬子元/)).toBeTruthy()
 expect(screen.queryByRole('group',{name:'V67 定计目及大参将真实计算'})).toBeNull()
})
