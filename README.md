# 梅花易数 Web
React + TailwindCSS + FastAPI。单一 Render Docker Web Service 部署。手机打开 HTTPS URL 使用。
后端负责汉字拆分阴阳取数、本互变卦、动爻、体用五行。大模型只输出解释。
CJKVI 字形和笔画数据在 Docker build 时从 https://github.com/cjkvi/cjkvi-ids 下载；注意 GPLv2 许可。
AI 解卦默认关闭；服务端配置 LLM_API_KEY 才启用，建议同时配置 AI_ACCESS_CODE，禁止将密钥提交 Git。
模型默认 deepseek-chat，API 默认 https://api.deepseek.com/chat/completions。
重要：本项目为文化及反思工具，不用于确定性预测或替代专业建议。
