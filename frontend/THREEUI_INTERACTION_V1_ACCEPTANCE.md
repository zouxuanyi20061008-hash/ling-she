# ThreeUI 交互借鉴与首页八卦探象 V1 验收

## 参考项目审查

- 项目：[`MengTo/threeui`](https://github.com/MengTo/threeui)
- 审查版本：Community `1.2.0`
- 授权：应用与 Community 组件代码为 MIT；字体及第三方资源另有授权说明。
- 本次仅研究公开交互模式，没有复制、打包或重新分发 ThreeUI 源码、图片、字体或场景资源。

### 组件审查结论

| 组件 | 实际特征 | 对书院的结论 |
|---|---|---|
| `TempleNightScene` | 指针响应的 WebGL 夜景；渲染器直接依赖 `three` | 可作为以后独立场景候选，不放入首页关键路径 |
| `BookshelfScene` | WebGL 3D 书架，内置内容是 Codex、Claude Code、Cursor 等开发工具书 | 内容主题不适合直接作为中国典籍书架 |
| `KoiStudies` | 独立 iframe 场景，引用包内根路径资源 | 需要额外处理资源部署与移动端成本 |
| `AnimatedTopDock` | 指针邻近反馈、弹性尺寸与多种导航形态 | 值得借鉴其明确状态、触控反馈和动效节制 |

当前前端为 React 18.3.1。ThreeUI Community 包虽声明支持 React 18，但还包含 Three.js peer dependency 与独立资源路径。首轮没有必要为了一个首页互动入口引入全套运行时。

## 本次实现

- 新增 `frontend/src/EightTrigramExplorer.jsx`，在书院欢迎页提供可点击的八卦环。
- 直接复用 `frontend/src/casting-lessons.js` 的 `EIGHT_TRIGRAMS` 数据，不另造卦名、卦数、方位或五行映射。
- 点选卦象后同步更新选中态、自然之象、后天方位、五行与简要象意。
- 增加「随机观象」作为轻量探索入口；界面明确标注这只是象意认识练习，不参与正式起卦。
- 增加键盘焦点、`aria-pressed`、动态说明区、窄屏布局与减少动态效果偏好。
- 更新站点标题为「万象书院 · 八门术数互动研习」。

## 性能与功能边界

- 不新增 npm 依赖。
- 不新增 WebGL、iframe、远程图片或外部 API 请求。
- 不修改任何后端算法、排盘数据结构、农历/节气口径或八门计算结果。
- 不改变「开始研习」、择术入境、藏经阁和八门入口的原有导航回调。

## 自动化验收

测试文件：`frontend/tests/arts-hub-interaction.test.jsx`

覆盖：
1. 八个卦象均可访问，默认选中乾卦。
2. 点选兑卦后选中状态、象意、方位、五行同步更新。
3. 随机观象使用既有八卦数据，并保留非正式起卦提示。
4. 原首页「开始研习」导航回调不回归。

此交互组件仅供认识八卦象意，不是正式起卦或断卦功能。
