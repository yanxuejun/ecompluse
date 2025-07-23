import { NextRequest } from 'next/server';
import fs from 'fs';
import path from 'path';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY!;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY!;
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY!;

export async function POST(req: NextRequest) {
  const { filePath, prompt, model = 'gpt' } = await req.json();

  // 1. 读取 CSV 文件内容
  const absPath = path.join(process.cwd(), filePath);
  if (!fs.existsSync(absPath)) {
    return new Response('CSV file not found', { status: 404 });
  }
  const csvContent = fs.readFileSync(absPath, 'utf-8');

  // 2. 构造 prompt
  const fullPrompt = `
You are an e-commerce data analyst. Based on the following CSV data, generate a concise, beautiful HTML report suitable for email, including summary, highlights, and trend analysis. Output in English.
CSV data:
${csvContent}

Additional instructions:
${prompt || ''}
`;

  let html = '';
  if (model === 'gemini') {
    // Gemini API
    console.log('[Gemini] Request:', fullPrompt.slice(0, 1000));
    const geminiRes = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=' + GEMINI_API_KEY, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          { role: 'user', parts: [{ text: fullPrompt }] }
        ]
      })
    });
    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      console.log('[Gemini] Error:', errText);
      return new Response('Gemini API error: ' + errText, { status: 500 });
    }
    const geminiData = await geminiRes.json();
    html = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '';
    console.log('[Gemini] Response:', html.slice(0, 1000));
  } else if (model === 'deepseek') {
    // Deepseek API
    console.log('[Deepseek] Request:', fullPrompt.slice(0, 1000));
    const deepseekRes = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: 'You are a helpful assistant.' },
          { role: 'user', content: fullPrompt }
        ],
        max_tokens: 2048,
        temperature: 0.7
      })
    });
    if (!deepseekRes.ok) {
      const errText = await deepseekRes.text();
      console.log('[Deepseek] Error:', errText);
      return new Response('Deepseek API error: ' + errText, { status: 500 });
    }
    const deepseekData = await deepseekRes.json();
    html = deepseekData.choices?.[0]?.message?.content || '';
    console.log('[Deepseek] Response:', html.slice(0, 1000));
  } else {
    // OpenAI GPT
    console.log('[GPT] Request:', fullPrompt.slice(0, 1000));
    const gptRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: 'You are a helpful assistant.' },
          { role: 'user', content: fullPrompt }
        ],
        max_tokens: 2048,
        temperature: 0.7
      })
    });
    if (!gptRes.ok) {
      const errText = await gptRes.text();
      console.log('[GPT] Error:', errText);
      return new Response('OpenAI API error: ' + errText, { status: 500 });
    }
    const gptData = await gptRes.json();
    html = gptData.choices?.[0]?.message?.content || '';
    console.log('[GPT] Response:', html.slice(0, 1000));
  }

  // 4. 保存为 html 文件（与 csv 或 analyzed html 同目录，文件名加模型后缀）
  const modelSuffix = model ? `_${model}` : '';
  const htmlFilePath = absPath.replace(/(\.analyzed)?\.html$/, `${modelSuffix}.html`).replace(/\.csv$/, `${modelSuffix}.html`);
  fs.writeFileSync(htmlFilePath, html);

  // 5. 返回 HTML 路径
  const relHtmlPath = filePath.replace(/(\.analyzed)?\.html$/, `${modelSuffix}.html`).replace(/\.csv$/, `${modelSuffix}.html`);
  return new Response(JSON.stringify({ success: true, html, htmlFile: relHtmlPath }), {
    headers: { 'Content-Type': 'application/json' }
  });
} 