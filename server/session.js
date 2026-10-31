// Sessão de login num cookie assinado (HMAC). O cookie guarda só o id do usuário, a validade e uma marca
// da senha: trocar a senha ou desativar o usuário derruba as sessões abertas.
const crypto = require('crypto');
const dbm = require('./db');

const COOKIE = 'lojaup_sessao';
const MAX_AGE = 7 * 24 * 3600; // 7 dias, renovados a cada uso

// Chave de assinatura: SESSION_SECRET, se definida; senão, gerada uma vez e guardada no banco
let secret = process.env.SESSION_SECRET || null;
async function loadSecret() {
  if (secret) return;
  const db = dbm.get();
  await db.prepare("INSERT INTO app_secrets (key, value) VALUES ('session', ?) ON CONFLICT (key) DO NOTHING").run(crypto.randomBytes(32).toString('hex'));
  secret = (await db.prepare("SELECT value FROM app_secrets WHERE key = 'session'").get()).value;
}

const mac = (data) => crypto.createHmac('sha256', secret).update(data).digest('base64url');
const passwordMark = (u) => crypto.createHash('sha256').update(u.password_hash).digest('base64url').slice(0, 16);

function sign(user) {
  const data = Buffer.from(JSON.stringify({ u: user.id, p: passwordMark(user), e: Math.floor(Date.now() / 1000) + MAX_AGE })).toString('base64url');
  return `${data}.${mac(data)}`;
}

// Usuário do token, ou null se o token for inválido, vencido ou de uma senha antiga. Roda dentro da
// transação da chamada.
async function userFromToken(token) {
  await loadSecret();
  const [data, sig] = String(token || '').split('.');
  if (!data || !sig) return null;
  const expected = Buffer.from(mac(data));
  const given = Buffer.from(sig);
  if (given.length !== expected.length || !crypto.timingSafeEqual(given, expected)) return null;
  let payload;
  try { payload = JSON.parse(Buffer.from(data, 'base64url').toString('utf8')); } catch (e) { return null; }
  if (!payload.e || payload.e < Date.now() / 1000) return null;
  const u = await dbm.get().prepare('SELECT * FROM users WHERE id = ? AND active = 1').get(payload.u);
  return u && passwordMark(u) === payload.p ? u : null;
}

function readCookie(header) {
  for (const part of String(header || '').split(';')) {
    const [k, ...v] = part.trim().split('=');
    if (k === COOKIE) return v.join('=');
  }
  return null;
}

function cookie(value, secure, maxAge = MAX_AGE) {
  return `${COOKIE}=${value}; Path=/; Max-Age=${maxAge}; HttpOnly; SameSite=Strict${secure ? '; Secure' : ''}`;
}

module.exports = {
  sign, userFromToken, readCookie,
  setCookie: (user, secure) => cookie(sign(user), secure),
  clearCookie: (secure) => cookie('', secure, 0),
};
