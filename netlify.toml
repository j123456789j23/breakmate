exports.handler = async function(event, context) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }
  try {
    const body = JSON.parse(event.body || '{}');
    const prompt = body.prompt;
    if (!prompt) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Missing prompt' }) };
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return { statusCode: 500, body: JSON.stringify({ error: 'Missing OPENAI_API_KEY' }) };
    }

    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        temperature: 0.7,
        messages: [
          { role: 'system', content: 'You are BreakMate, an empathetic breakup assistant. Keep outputs concise, respectful, and human. Avoid cliches.' },
          { role: 'user', content: prompt }
        ]
      })
    });
    if (!r.ok) {
      const txt = await r.text();
      return { statusCode: 500, body: JSON.stringify({ error: 'OpenAI error', details: txt }) };
    }
    const data = await r.json();
    const text = data?.choices?.[0]?.message?.content || '';
    const parts = text.split(/\n\s*\d+\.\s*|\n-\s*/).map(s=>s.trim()).filter(Boolean);
    const options = parts.length >= 3 ? parts.slice(0,3) : [text];
    return { statusCode: 200, body: JSON.stringify({ options }) };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Server error', details: String(e) }) };
  }
};
