const QIMEN_DOOR_FOCUS = {
  '休门': ['休整', '先看是否有条件放缓节奏、留出恢复时间'],
  '生门': ['经营和增长', '先看手头哪些资源能支持下一步'],
  '伤门': ['冲突和损伤', '先看哪一步容易起冲突，能否把风险说清楚'],
  '杜门': ['阻隔和保守', '先看有没有信息缺口，或要守住的边界'],
  '景门': ['消息和呈现', '先看消息是否清楚、材料能否让人看明白'],
  '死门': ['停顿和收尾', '先看哪些步骤已经走不通，哪些该先做收尾'],
  '惊门': ['意外消息和惊扰', '先核实让人不安的消息，再考虑怎么回应'],
  '开门': ['启动和沟通', '先看有没有适合接洽、尝试启动的入口'],
}

export function qimenReading(chart) {
  const { origin_door: door, rotated_door_display_palace: doorNumber } = chart.duty_origin ?? {}
  const palace = chart.palaces?.find(entry => entry.number === doorNumber && entry.actual_gate === door)
  const focus = QIMEN_DOOR_FOCUS[door]
  const timeReason = `本次由${chart.solar_term}${chart.yuan}定为${chart.ju_label}，起局时柱为${chart.hour_ganzhi}。`
  if (!chart.has_rotated_stars_and_gates || !palace || !focus) {
    return {
      title: '先核对这次起局的时间',
      takeaway: `这次排到${chart.ju_label}。先看九宫里的地盘，也就是这局排定的基础位置。`,
      reasons: [timeReason],
      next: '打开九宫盘，点任意宫位核对这次的地盘天干。',
    }
  }
  const place = `${palace.name ?? '第'}${palace.number}宫`
  return {
    title: '这局先看哪一格',
    takeaway: `先看${place}的${door}。${focus[1]}。`,
    reasons: [
      `这次取${chart.solar_term}${chart.yuan}起${chart.ju_label}，按${chart.hour_ganzhi}时排门，值使门落在${place}。值使是这局读门的起点。`,
      `${door}的传统主题是${focus[0]}，可用来提问和核对现实情况。一宫只能给一条观察线索。`,
    ],
    next: `打开九宫盘，点${place}核对该格的门、星和神。`,
  }
}

const BAZI_TEN_GODS = {
  '比肩': ['与日主五行相同、阴阳相同', '同伴与协作'],
  '劫财': ['与日主五行相同、阴阳不同', '同辈竞争与资源分配'],
  '食神': ['由日主五行所生、阴阳相同', '培养技能与产出'],
  '伤官': ['由日主五行所生、阴阳不同', '表达与突破常规'],
  '偏财': ['由日主的五行制约、阴阳相同', '可调配的资源和机会'],
  '正财': ['由日主的五行制约、阴阳不同', '资源的积累和管理'],
  '七杀': ['在五行里制约日主、阴阳相同', '挑战与约束'],
  '正官': ['在五行里制约日主、阴阳不同', '规矩与责任'],
  '偏印': ['生助日主的五行、阴阳相同', '学习与借助外部支持'],
  '正印': ['生助日主的五行、阴阳不同', '学习与稳定的支持'],
}

export function baziReading(chart) {
  const { day_master: master, day_master_element: element, flow, luck } = chart
  const day = chart.pillars.find(pillar => pillar.kind === 'day')?.ganzhi ?? chart.day_ganzhi
  const month = chart.pillars.find(pillar => pillar.kind === 'month')
  const dayMaster = `${master}${element ?? ''}`
  const reference = day
    ? `日柱是${day}，第一个字「${master}」就是日主${element ? `，属${element}` : ''}。其他天干的十神都跟它比。`
    : `日主「${dayMaster}」是出生那天的天干。其他天干的十神都跟这个字比。`
  if (flow) {
    const [relation, theme] = BAZI_TEN_GODS[flow.month.stem_ten_god] ?? []
    const phase = flow.luck_at_target?.phase
    const comparison = relation && flow.month.stem
      ? `相对你的${dayMaster}日主，流月${flow.month.stem}${flow.month.stem_element ?? ''}${relation}，所以叫「${flow.month.stem_ten_god}」。`
      : reference
    return {
      title: '你查的时刻落在哪一年、哪一月',
      takeaway: `所选时刻属于${flow.year.ganzhi}年、${flow.month.ganzhi}月。${theme ? `传统读法可先留意「${theme}」这个主题。` : ''}`,
      reasons: [
        `年以立春为界，月按十二个交节时刻划分。你选的时刻落在从「${flow.month.jie_name}」开始的这段时间内。`,
        phase ? `${comparison}同一时刻也落在第${phase.order}步${phase.ganzhi}大运。` : comparison,
      ],
    }
  }
  if (luck) {
    const first = luck.luck_decades?.[0]
    const time = luck.start_at_beijing.slice(0, 10)
    return {
      title: '从哪一步开始看大运',
      takeaway: `按这次所选口径，从${time}开始排${first ? `第一步${first.ganzhi}大运` : '大运'}。`,
      reasons: [
        `以出生月柱${luck.month_ganzhi}为起点${luck.direction}。出生时刻到${luck.reference_jie.name}的间隔按三天折一年换算。`,
        reference,
      ],
      next: '打开十年大运，逐步对照起止日期。这里显示的是传统的时间分段。',
    }
  }
  const [relation, theme] = BAZI_TEN_GODS[month?.stem_ten_god] ?? []
  return {
    title: '先找日主，再读其他三个天干',
    takeaway: theme
      ? `你的日主是${dayMaster}。跟月干对照，传统上可先看「${theme}」这个主题。`
      : `你的日主是${dayMaster}。可以从日柱开始，拿它跟月柱的第一个字对照。`,
    reasons: [
      reference,
      relation && month.stem && `月干「${month.stem}」${month.stem_element ? `属${month.stem_element}，` : ''}${relation}，所以这一对叫「${month.stem_ten_god}」。`,
    ].filter(Boolean),
    next: '打开四柱表，试着找年干和时干各对应哪一种十神。',
  }
}

export function liurenReading(chart) {
  const transmissions = chart.three_transmissions
  const items = transmissions.transmissions ?? []
  const setup = `代表当前节气时段的月将是${chart.month_general}。把它放在起课的${chart.hour_branch}时格，再按当天的干支排四课。`
  if (transmissions.status !== 'computed' || items.length !== 3) {
    const candidates = transmissions.initial_candidates ?? []
    return {
      title: '这课先看四课，三传待核',
      takeaway: '本课的天地盘和四课已排出。传统取法还不足以得到一组已核对的三传。',
      reasons: [
        setup,
        candidates.length > 1
          ? `初传有${candidates.join('、')}这几种候选。先知道有哪些分歧，再看各条依据。`
          : transmissions.reason ?? '现有起点和取传依据可在四课、三传中核对。',
      ],
      next: '打开三传，看这次哪些依据还需要核对。',
    }
  }
  const [first, middle, last] = items.map(item => item.branch)
  const { method = '' } = transmissions
  const relation = method.startsWith('下贼上') ? '下贼上' :
    method.startsWith('上克下') ? '上克下' : null
  const firstLesson = relation
    ? chart.four_lessons.find(lesson => lesson.relation === relation && lesson.upper === first)
    : null
  let selection = `本课依照天地盘和四课的位置取${first}作初传，完整取法可以在三传里核对。`
  if (firstLesson) {
    const lower = `下方的${firstLesson.lower}${firstLesson.lower_element}`
    const upper = `上方的${firstLesson.upper}${firstLesson.upper_element}`
    const relationInWords = relation === '下贼上' ? `${lower}制约${upper}` : `${upper}制约${lower}`
    selection = `第${firstLesson.number}课${relationInWords}，所以取这组上方的${first}作初传，再沿天盘找中传和末传。`
  } else if (method.startsWith('比用')) {
    selection = `四课出现几个起点，「比用」取与日干阴阳相同的候选，因此从${first}开始。`
  } else if (method.startsWith('遥克')) {
    selection = `四课的上下字没有直接制约，改查它们和日干的关系，因此取与日干相克的${first}作初传。`
  } else if (method.startsWith('八专')) {
    selection = `日干和日支排在同一地盘位置，四课有重复。按本类课的数位规则取${first}作初传。`
  } else if (method.startsWith('伏吟')) {
    selection = `月将和起课时支相同，天地盘的位置重合。这类课用专门的取法，从${first}开始读。`
  } else if (method.startsWith('反吟')) {
    selection = `月将和起课时支相对，天地盘相差六格。按这次的取法，从${first}开始读。`
  }
  return {
    title: '这课按什么顺序读',
    takeaway: firstLesson
      ? `先看事情开头有什么相互制约的条件。本课按${first}、${middle}、${last}读起头、经过和收尾。`
      : `先看${first}，再看${middle}，最后看${last}。这是传统上读本课起头、经过和收尾的顺序。`,
    reasons: [setup, selection],
    next: '打开三传，逐项对照这三个位置和发用规则。',
  }
}
