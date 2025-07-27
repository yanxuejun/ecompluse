// send_subscription_email.js
// Usage: node send_subscription_email.js <email> <categories>
// Example: node send_subscription_email.js "yanxuejun@xgemi.com" "US_1,US_1604,US_188"

const fs = require('fs');
const path = require('path');
const { Resend } = require('resend');

async function main() {
  const [,, email, categories] = process.argv;
  if (!email || !categories) {
    console.error('Usage: node send_subscription_email.js <email> <categories>');
    process.exit(1);
  }

  const categoryList = categories.split(',').map(s => s.trim()).filter(Boolean);
  let htmlParts = [];

  for (const cat of categoryList) {
    const [country, id] = cat.split('_');
    if (!country || !id) continue;
    const dir = path.join(__dirname, '../gmc_data/output', country, id);
    if (!fs.existsSync(dir)) continue;
    const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));
    for (const file of files) {
      const filePath = path.join(dir, file);
      try {
        const content = fs.readFileSync(filePath, 'utf-8');
        htmlParts.push(`<div style="margin-bottom:32px;">${content}</div>`);
      } catch (e) {
        console.warn('Failed to read', filePath, e);
      }
    }
  }

  if (htmlParts.length === 0) {
    console.error('No HTML content found for the given categories.');
    process.exit(1);
  }

  const finalHtml = `
    <div style="font-family:Arial,sans-serif;">
      <h2>您的每周订阅报告</h2>
      ${htmlParts.join('\n')}
    </div>
  `;

  // Use Resend API
  const resend = new Resend(process.env.RESEND_API_KEY);
  try {
    const result = await resend.emails.send({
      from: process.env.RESEND_FROM || 'noreply@ecompulsedata.com',
      to: email,
      subject: '您的每周订阅报告',
      html: finalHtml,
    });
    console.log('Resend send result:', result);
    console.log('Email sent to', email);
  } catch (e) {
    console.error('Failed to send email:', e);
    process.exit(1);
  }
}

main(); 