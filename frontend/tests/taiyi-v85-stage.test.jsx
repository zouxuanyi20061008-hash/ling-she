

it('V90 shows only the nine reviewed NCL scan pages and does not guess the Volume 9 leaf',async()=>{
 const pageMap=[
  [1,'序文开篇'],[2,'序文续页'],[3,'序文续页'],[4,'空白页'],
  [5,'卷一题名与目录起页'],[6,'卷一目录续页'],[7,'卷一目录续页'],
  [8,'卷一目录末页'],[9,'卷一正文起页']
 ].map(([scan_page,classification])=>({
  scan_page,classification,visual_observation:'已视觉核验',
  viewer_url:scan_page===1?'https://commons.wikimedia.org/wiki/File:NCL-06604.pdf':
   'https://commons.wikimedia.org/w/index.php?page='+scan_page+'&title=File%3ANCL-06604.pdf',
  visually_reviewed:true
 }))
 const locator={
  version:'V90',
  scan_structure:{
   visually_reviewed_page_count:9,volume_one_body_start_page:9,
   volume_nine_start_page:null
  },
  scan_page_map:pageMap,
  siku_transcription_baseline:{
   text:'假令阴遁第三纪第五十二局乙卯时太乙在八宫阳德为天目巳为计神',
   transcription_sources:[
    {label:'维基文库·四库全书本卷九',url:'https://zh.wikisource.org/zh-hans/test'},
    {label:'中国哲学书电子化计划·卷九',url:'https://ctext.org/wiki.pl?chapter=435698&if=en'},
    {label:'知命书院·卷九转录',url:'https://shuyuan.zhiming.life/read/test'}
   ]
  }
 }
 vi.stubGlobal('fetch',vi.fn().mockResolvedValue({ok:true,json:async()=>({
  ...base,hour_v90_scan_locator:locator
 })}))
 render(<TaiyiV77Hour/>)
 fireEvent.click(screen.getByRole('button',{name:'计算太乙时计基础盘'}))
 const area=await screen.findByRole('group',{name:'V90 太乙明钞本扫描页序定位'})
 expect(area.textContent).toContain('9 / 124')
 expect(area.textContent).toContain('PDF第9页')
 expect(area.textContent).toContain('卷九目标叶：尚未定位')
 expect(area.textContent).toContain('四库转录仅为检索底文')
 expect(within(area).getByRole('link',{name:/PDF第5页/})).toBeTruthy()
 expect(within(area).getByRole('link',{name:'维基文库·四库全书本卷九'})).toBeTruthy()
})

it('V90 legacy V89 response without scan locator remains compatible',async()=>{
 vi.stubGlobal('fetch',vi.fn().mockResolvedValue({ok:true,json:async()=>({
  ...base,hour_v89_digitized_witness_census:{version:'V89'}
 })}))
 render(<TaiyiV77Hour/>)
 fireEvent.click(screen.getByRole('button',{name:'计算太乙时计基础盘'}))
 expect(await screen.findByRole('region',{name:'V77 太乙时计八宫与计神结果'})).toBeTruthy()
 expect(screen.queryByRole('group',{name:'V90 太乙明钞本扫描页序定位'})).toBeNull()
})
