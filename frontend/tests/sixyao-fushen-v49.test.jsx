// @vitest-environment jsdom
import React from 'react'
import {it,expect,vi,afterEach} from 'vitest'
import {cleanup,fireEvent,render,screen} from '@testing-library/react'
import {FuShenStudy} from '../src/SixYaoStage.jsx'
afterEach(cleanup)

function makeChart(withV49=true){
 const entry={
   position:2,
   flying:{ganzhi:'辛亥',liuqin:'子孙',element:'水',moving:false},
   hidden:{ganzhi:'甲寅',liuqin:'妻财',element:'木'},
   flying_hidden_relation:'飞生伏'
 }
 return {fushen:{
   palace:'乾',pure_hexagram:'乾为天',
   missing_relatives:['妻财'],
   by_relative:{'妻财':[entry]},
   boundary:'未裁定伏神是否可用',
   reference:'https://www.shidianguji.com/book/XYXZSBY/chapter/1lzxsny7d9s7d',
   selected:{status:'hidden_in_palace',category:'妻财',entries:[entry],
     note:'本卦用神不现',day_month_review:{
       note:'日月须先确认',day_branch:null,month_branch:null
     },
     ...(withV49?{condition_review:{version:'V49',rows:[{
       position:2,hidden_void:null,flying_void:null,
       hidden_month_break:null,flying_month_break:null,
       hidden_month_grade:null,day_relation_to_hidden:null,
       month_relation_to_hidden:null,other_actual_movers:[],
       conditions:[
         {id:'hidden_calendar_generation',title:'伏神得日月生候选',
          observed:null,note:'日月未知'},
         {id:'flying_generates_hidden',title:'飞神生伏候选',
          observed:true,note:'仅为五行方向'}
       ]
     }]}}:{})
   }
 }}
}

it('V49 displays distinct hidden/flying unknown conditions and classical structure',()=>{
 const pick=vi.fn()
 render(<FuShenStudy chart={makeChart()} onChoose={pick} busy={false}/>)
 expect(screen.getByText('V49 · 伏神与飞神的实际日月证据')).toBeTruthy()
 expect(screen.getByText(/伏神旬空：日辰未知/)).toBeTruthy()
 expect(screen.getByText(/飞神旬空：日辰未知/)).toBeTruthy()
 expect(screen.getByText(/伏神逢月冲：月建未知/)).toBeTruthy()
 expect(screen.getByText(/月令：月建未提供/)).toBeTruthy()
 expect(screen.getByText('飞生伏')).toBeTruthy()
 fireEvent.click(screen.getByText(/展开六项古籍条件候选/))
 expect(screen.getByText(/伏神得日月生候选：缺资料/)).toBeTruthy()
 expect(screen.getByText(/飞神生伏候选：条件线索存在/)).toBeTruthy()
 fireEvent.click(screen.getByRole('button',{name:/妻财 · 1 处伏神/}))
 expect(pick).toHaveBeenCalledWith('妻财')
})

it('older records without V49 condition block still render flying and hidden pair',()=>{
 render(<FuShenStudy chart={makeChart(false)} onChoose={()=>{}} busy={false}/>)
 expect(screen.getByText('飞生伏')).toBeTruthy()
 expect(screen.queryByText('V49 · 伏神与飞神的实际日月证据')).toBeNull()
})
