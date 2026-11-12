// Netlify Function: приймає заявку з сайту і пересилає адміністратору в Telegram.
// Потрібні змінні оточення TELEGRAM_TOKEN і TELEGRAM_CHAT_ID.

const escapeHtml = (s) => String(s).replace(/[<>&]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c]));

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  let data;
  try {
    data = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, body: 'Bad JSON' };
  }

  const required = ['master', 'service', 'date', 'time', 'name', 'phone'];
  const missing = required.filter((key) => !data[key]);
  if (missing.length) {
    return { statusCode: 422, body: `Missing: ${missing.join(', ')}` };
  }

  const text = [
    '<b>Новий запис</b>',
    `Клієнт: ${escapeHtml(data.name)}`,
    `Телефон: ${escapeHtml(data.phone)}`,
    `Майстер: ${escapeHtml(data.master)}`,
    `Послуга: ${escapeHtml(data.service)}`,
    `Коли: ${escapeHtml(data.date)} о ${escapeHtml(data.time)}`,
  ].join('\n');

  const { TELEGRAM_TOKEN, TELEGRAM_CHAT_ID } = process.env;
  const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text, parse_mode: 'HTML' }),
  });

  if (!res.ok) {
    console.error('Telegram error', await res.text());
    return { statusCode: 502, body: 'Telegram error' };
  }
  return { statusCode: 200, body: JSON.stringify({ ok: true }) };
};
