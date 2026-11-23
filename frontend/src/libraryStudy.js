import { LESSONS, QUIZZES } from './studyContent.js'
import { COURSE, COURSE_QUIZ } from './traditionContent.js'
import { FOUNDATION_STUDY } from './foundationStudy.js'
import { REN_YI_STUDY } from './renYiStudy.js'
import { STAR_LAND_STUDY } from './starLandStudy.js'

const MEIHUA_CHALLENGES = {
  1:{type:'board',question:'把数字 13 投到对应的八卦格',context:'按先天八卦序数，除以 8 取余，余 0 作 8。',
    options:['乾 · 1','兑 · 2','离 · 3','震 · 4','巽 · 5','坎 · 6','艮 · 7','坤 · 8'],columns:4,answer:4,
    hint:'13 去掉一个 8 后还剩多少？',why:'13 除以 8 余 5，先天八卦的第五格是巽。'},
  4:{type:'order',question:'按顺序排出求变卦的三步',context:'风泽中孚取上数 5、下数 2，两数之和为 7。',
    options:['把该爻的阴阳翻转','将 7 除以 6 取余','按余数找到动爻'],answer:[1,2,0],
    hint:'先得到余数，才能找到动爻的位置。',why:'7 除以 6 余 1，所以动的是最下方的初爻。确定位置后，再将那一爻的阴阳翻转。'},
  7:{type:'order',question:'给案例卡排出正确时间线',context:'你想记下一个找失物的例子，往后再看自己哪里想对了、哪里想错了。',
    options:['对照差异并复盘','写下原问题与事前判断','据实补记后来发生的结果'],answer:[1,2,0],
    hint:'哪一张需要在知道结果前就写好？',why:'先记事前判断，再如实补记结果，最后比较两份记录，才能看出自己哪里想错了。'},
}

const MEIHUA_HINTS = [
  '先想想你还缺哪一条可以问清楚的事实。', '', '回想“震东兑西”。',
  '先看金和木的生克，再把它们换回体和用。', '', '先区分古籍规则和本项目自己的约定。',
  '外应要发生在起卦当时，并且能被人观察到。', '',
]

const MEIHUA_LESSONS = LESSONS.map((lesson,index)=>({
  id:`meihua-${index+1}`,
  title:lesson.title,
  summary:lesson.subtitle,
  paragraphs:lesson.paragraphs,
  example:lesson.example,
  challenge:MEIHUA_CHALLENGES[index]??{type:'choice',...QUIZZES[lesson.exercise],hint:MEIHUA_HINTS[index]},
}))

// 顺序沿用现有课文，每组列出旧题库中归到本课的题目。
const LIUYAO_QUESTION_GROUPS = [
  [0],[1],[],[],[2,3],[4,5],[6,7],[8,9],[12],[10,11],[13],[14],[15,16],[17],[],
  [18],[19,20],[21],[22],[23],[24],[25,26],[],[27],[28],[29],[30],
]

const LIUYAO_HINTS = [
  '把三枚钱的分数相加，先看总数的阴阳。','从画在最下面的一爻起数。',
  '六神的第一位取决于当日的天干。','一旬只有十天，十二地支还会剩下两个。',
  '想想合同属于哪一类文书。','先把本卦里实际看见的内容记下来。','找能生金的五行。',
  '发动是线索之一，看看还缺哪些条件。','先找本卦所属的宫。','把辛亥和甲寅换成水与木。',
  '亥属水，午属火，先比水火。','先对照变爻原来的爻位。','日冲需要哪两个地支来比较？',
  '题目问本卦两爻之间的条件。','先记住辰是土月。','题目已给了旺相、静爻、日冲三个线索。',
  '“余气”在这张表里自成一项。','冲是一个已知条件，其他条件还能查。',
  '从甲子数到癸酉，看看哪两支还没出现。','“化”前面还有一个“动”字。',
  '同位的飞神和伏神可以有不同的地支。','先把两条线索都保留下来。',
  '能比较五行只是第一步。','同一爻可以同时有两种作用线索。','多一条线索代表多一个角度。',
  '把变爻与它原来的位置对上。','看看题目还给了哪些信息。','先辨别这是静爻还是动爻。',
  '找出需要记录的条件，再看其他作用。','原神这个名称先说明它能生哪一种五行。',
  '把知道结果之前和之后的记录分开。',
]

const LIUYAO_CHALLENGES = {
  1:{type:'order',question:'排好前三掷对应的爻位',context:'你已掷了三次，按时间先后点出每次应记录的位置。',
    options:['三爻','初爻','二爻'],answer:[1,2,0],hint:'从最下方逐爻向上记。',why:'第一掷画初爻，第二掷画二爻，第三掷画三爻，之后继续往上记。'},
  2:{type:'choice',question:'给八宫书架数一数，总共几张卦卡？',context:'一共有八个宫，每宫放八张不同的卦卡。',
    options:['16 张','64 张','8 张'],answer:1,hint:'有 8 组，每组 8 张。',why:'八宫每宫八卦，8 × 8 = 64。世应位由各卦所在的宫序来定。'},
  3:{type:'choice',question:'算六亲时，先比哪两项五行？',context:'你已经找到本卦的卦宫，也知道某一爻的地支。',
    options:['卦宫与该爻地支','当月与下个月','两枚铜钱的正反面'],answer:0,hint:'用卦宫作参照，再去看这一爻。',why:'纳甲给各爻配干支。算六亲时，以本卦卦宫的五行为参照，比较该爻地支的五行。'},
  14:{type:'choice',question:'两条线索怎么放进记录卡？',context:'同一爻既有日辰生扶，又有月建相冲。',
    options:['只填生扶','只填相冲','两条分别列出'],answer:2,hint:'每一条都描述了一个已看到的条件。',why:'日辰生扶与月建相冲可以并存。分开记录，之后可以和空亡、动变等条件继续对照。'},
  22:{type:'choice',question:'子月卯日这一例，哪一对形成回头克？',context:'坤之晋，有一处本位是酉金动而变巳火。',
    options:['变爻巳火克本位酉金','本位酉金克变爻巳火','卯日才是本位的变爻'],answer:0,hint:'在这一对里，巳是火，酉是金。',why:'火克金，巳火是变爻，所以巳火对同位的酉金形成回头克。日月影响需要另外列出。'},
}

function liuyaoQuestion(index){
  const {q,a,correct,why}=COURSE_QUIZ.liuyao[index]
  return {type:'choice',question:q,options:a,answer:correct,why,hint:LIUYAO_HINTS[index]}
}

const LIUYAO_LESSONS = COURSE.liuyao.map(([title,...paragraphs],index)=>{
  const oldQuestions=LIUYAO_QUESTION_GROUPS[index].map(liuyaoQuestion)
  const added=LIUYAO_CHALLENGES[index]
  return {id:`liuyao-${index+1}`,title,paragraphs,challenge:added??oldQuestions[0],
    bonus:added?oldQuestions:oldQuestions.slice(1)}
})

export const LIBRARY_STUDY = {
  ...FOUNDATION_STUDY,
  meihua:MEIHUA_LESSONS,
  liuyao:LIUYAO_LESSONS,
  ...REN_YI_STUDY,
  ...STAR_LAND_STUDY,
}

export const LIBRARY_TRIALS = Object.fromEntries(Object.entries(LIBRARY_STUDY).map(([method,lessons])=>[
  method,
  [
    ...lessons.map(({challenge},lessonIndex)=>({...challenge,lessonIndex})),
    ...lessons.flatMap(({bonus=[]},lessonIndex)=>bonus.map(challenge=>({...challenge,lessonIndex,bonus:true}))),
  ],
]))
