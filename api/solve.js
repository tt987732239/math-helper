export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: '只接受 POST 请求' });

  const { question } = req.body;
  if (!question) return res.status(400).json({ error: '题目不能为空' });

  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'API Key 未配置' });

  try {
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: '你是一位初中数学老师。请按以下格式回答数学题：\n1. 考点分析\n2. 解题步骤（分步列出）\n3. 最终答案\n4. 易错点提醒\n严格禁止使用 \\forall、\\boxed{}、\\operatorname、\\mathrm 等无关命令。只允许使用标准的数学公式，如 \\(...\\) 和 \\[...\\]。' },
          { role: 'user', content: `请解这道初中数学题：${question}` }
        ],
        max_tokens: 2000
      })
    });

    const data = await response.json();
    const answer = data.choices?.[0]?.message?.content || 'AI未能生成答案，请重试。';
    res.status(200).json({ success: true, answer });
  } catch (error) {
    console.error('API调用出错:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
}
