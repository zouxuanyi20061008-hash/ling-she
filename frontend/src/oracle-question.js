const questionTopics = [
  {
    matches: /(宠物|猫|狗).*(走失|丢了|不见|找不到)|找.*(宠物|猫|狗)/,
    subject: '找回宠物',
    gate: '最近的目击和活动线索',
    check: '从最后一次见到宠物的位置往外排查，向附近的人核实最近的目击线索。',
    focusWhy: '如果你问的是走失的宠物，可先看传统上代表动物的「子孙」。'
  },
  {
    matches: /失物|遗失|(钥匙|手机|钱包|财物|东西|物品).*(丢了|不见|找不到)|(找|丢).*(钥匙|手机|钱包|财物|东西|物品)/,
    subject: '找回失物',
    gate: '能确认的动线和线索',
    check: '回到最后一次确认见到的时间、地点，再按动线排查。',
    focusWhy: '如果你问的是丢失的财物，可先看代表财物的「妻财」。'
  },
  {
    matches: /健康|身体不适|生病|胸闷|失眠|症状|用药|治疗/,
    check: '身体状况以真实症状与专业评估为准。',
  },
  {
    matches: /合同|签约|协议|证件|文书|手续/,
    subject: '文书或手续的进度',
    gate: '未确认的条款和审批',
    check: '把尚未确认的条款或手续列出来，先核对哪一项卡住了。',
    focusWhy: '如果你主要问合同、通知或手续，可先看代表文书的「父母」。'
  },
  {
    matches: /面试|求职|跳槽|升职|入职|招聘|录用|职位|工作|事业|找工|offer/i,
    subject: '录用或工作进展',
    gate: '对方的决定和流程',
    check: '如果还没有明确答复，可以问清预计何时回复、自己还需补什么。',
    focusWhy: '如果你主要问职位或录用，可先看代表职位和职责的「官鬼」。'
  },
  {
    matches: /考试|成绩|高考|志愿|复习|学业|学校|学习/,
    subject: '这次学业目标能否达成',
    gate: '明确的考核要求和真实反馈',
    check: '用当前成绩或练习反馈，找出最该补的一项。',
    focusWhy: '如果你问的是考试文书、成绩通知或报名手续，可先看「父母」。'
  },
  {
    matches: /财运|投资|赚钱|生意|收入|买卖|借钱|货款|经营|盈利|收益|回款/,
    subject: '这笔钱或生意能否推进',
    gate: '对方能落实的款项和条件',
    check: '核对款项、付款时间和可能的成本，先分清已确认和口头约定。',
    focusWhy: '如果你主要问钱款或经营所得，可先看代表财物的「妻财」。'
  },
  {
    matches: /合作|感情|恋爱|婚姻|恋人|复合|分手|前任|相亲|男友|女友|对方|沟通|和好/,
    subject: '这段关系或合作能否往下走',
    gate: '对方的回应和行动',
    check: '用一次具体沟通核对双方意愿，留意对方是否愿意落实下一步。',
    focusWhy: '如果重点是双方往来的另一方，可先看代表对方的「应爻」。'
  },
]

export function getOracleQuestionTopic(question) {
  return questionTopics.find(topic=>topic.matches.test(question))
}

const contextualMeihuaReadings = {
  比和: ({subject,gate})=>`${subject}，盘里有配合的空间。用${gate}核对双方的条件能否接上。`,
  用生体: ({subject,gate})=>`${subject}，盘里偏有外部助力。先看${gate}有没有明确进展。`,
  体生用: ({subject})=>`${subject}，这盘更像是你要先投入时间或精力。投入前先把边界说清楚。`,
  体克用: ({subject})=>`${subject}，这盘有你能主动调整的地方。可以先推进自己能落实的一步。`,
  用克体: ({subject,gate})=>`${subject}，眼下偏受外部条件牵制。先看${gate}，再判断卡点有没有松动。`,
}

export function getContextualMeihuaReading(relation,topic) {
  return topic?.subject?contextualMeihuaReadings[relation]?.(topic):undefined
}
