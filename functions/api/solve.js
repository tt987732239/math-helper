export async function onRequest(context) {
  const { request, env } = context;

  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    });
  }

  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: '只接受 POST 请求' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }

  try {
    const { question } = await request.json();
    if (!question) {
      return new Response(JSON.stringify({ error: '题目不能为空' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    const apiKey = env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'API Key 未配置' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

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

    return new Response(JSON.stringify({ success: true, answer }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: '服务器内部错误' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
}
