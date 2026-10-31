// Recebe POST /api com { method, args }, cuida do cookie da sessão e responde { ok, data | error }.
// Usado pela função da Vercel (api/index.js) e pelo servidor local (server/dev.js).
const { call } = require('./handler');
const session = require('./session');

const MAX_BODY = 4 * 1024 * 1024; // a Vercel aceita até 4,5 MB por requisição

async function readJson(req) {
  // A Vercel já entrega o corpo lido em req.body
  if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) return req.body;
  if (typeof req.body === 'string' || Buffer.isBuffer(req.body)) return JSON.parse(String(req.body) || '{}');
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > MAX_BODY) throw new Error('Requisição grande demais.');
    chunks.push(chunk);
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
}

const header = (req, name) => String(req.headers[name] || '');
const clientIp = (req) => header(req, 'x-forwarded-for').split(',')[0].trim() || (req.socket && req.socket.remoteAddress) || null;
const isHttps = (req) => header(req, 'x-forwarded-proto') === 'https' || !!(req.socket && req.socket.encrypted);

async function handle(req, res) {
  const send = (status, body, cookie) => {
    res.statusCode = status;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    if (cookie) res.setHeader('Set-Cookie', cookie);
    res.end(JSON.stringify(body));
  };
  if (req.method !== 'POST') return send(405, { ok: false, error: 'Use POST.' });
  // Só aceita JSON: um formulário de outro site não consegue mandar esse tipo sem permissão do navegador
  if (!header(req, 'content-type').includes('application/json')) return send(415, { ok: false, error: 'Envie JSON.' });
  let body;
  try {
    body = await readJson(req);
  } catch (e) {
    return send(400, { ok: false, error: e.message });
  }
  const ctx = { token: session.readCookie(req.headers.cookie), ip: clientIp(req), user: null };
  const out = await call(body.method, body.args, ctx);
  // Renova a sessão a cada chamada; apaga o cookie se a sessão acabou
  const secure = isHttps(req);
  const cookie = ctx.user ? session.setCookie(ctx.user, secure) : ctx.token ? session.clearCookie(secure) : null;
  return send(200, out, cookie);
}

module.exports = { handle };
