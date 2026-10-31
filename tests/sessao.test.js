// Sessão por cookie, bloqueio por senha errada e regras da requisição HTTP (server/http.js)
const test = require('node:test');
const assert = require('node:assert/strict');
const dbm = require('../server/db');
const { handle } = require('../server/http');

// Faz uma requisição falsa a POST /api e devolve { status, body, cookie }
async function post(method, args, { cookie, ip = '10.0.0.1', contentType = 'application/json', httpMethod = 'POST' } = {}) {
  const req = {
    method: httpMethod,
    headers: { 'content-type': contentType, cookie, 'x-forwarded-for': ip, 'x-forwarded-proto': 'https' },
    body: { method, args },
  };
  const res = {
    headers: {},
    setHeader(k, v) { this.headers[k.toLowerCase()] = v; },
    end(s) { this.text = s; },
  };
  await handle(req, res);
  const setCookie = res.headers['set-cookie'];
  return { status: res.statusCode, body: JSON.parse(res.text), setCookie, cookie: setCookie ? setCookie.split(';')[0] : cookie };
}

test.before(() => dbm.open({ dataDir: null }));
test.after(() => dbm.close());

test('login cria a sessão no cookie', async () => {
  const setup = await post('auth.setup', { storeName: 'Loja', name: 'Samuel', username: 'samuel', password: '1234' });
  assert.ok(setup.body.ok);
  assert.match(setup.setCookie, /^lojaup_sessao=[\w-]+\.[\w-]+; Path=\/; Max-Age=604800; HttpOnly; SameSite=Strict; Secure$/);
  const status = await post('auth.status', {}, { cookie: setup.cookie });
  assert.equal(status.body.data.user.username, 'samuel');
  // Sem cookie, não há usuário
  assert.equal((await post('auth.status')).body.data.user, null);
  assert.equal((await post('settings.get')).body.ok, false);
});

test('cookie adulterado ou de senha antiga não vale', async () => {
  const login = await post('auth.login', { username: 'samuel', password: '1234' });
  const [name, value] = login.cookie.split('=');
  const [data, sig] = value.split('.');
  const forged = Buffer.from(JSON.stringify({ u: 1, p: 'x', e: 9999999999 })).toString('base64url');
  const bad = await post('auth.status', {}, { cookie: `${name}=${forged}.${sig}` });
  assert.equal(bad.body.data.user, null);
  assert.match(bad.setCookie, /Max-Age=0/);
  assert.equal((await post('auth.status', {}, { cookie: `${name}=${data}.x${sig.slice(1)}` })).body.data.user, null);

  // Trocar a senha derruba as outras sessões, mas mantém a atual
  const other = await post('auth.login', { username: 'samuel', password: '1234' });
  const change = await post('auth.changePassword', { current: '1234', password: 'nova1' }, { cookie: login.cookie });
  assert.ok(change.body.ok);
  assert.equal((await post('auth.status', {}, { cookie: change.cookie })).body.data.user.username, 'samuel');
  assert.equal((await post('auth.status', {}, { cookie: other.cookie })).body.data.user, null);
  await post('auth.changePassword', { current: 'nova1', password: '1234' }, { cookie: change.cookie });
});

test('logout apaga o cookie', async () => {
  const login = await post('auth.login', { username: 'samuel', password: '1234' });
  const out = await post('auth.logout', {}, { cookie: login.cookie });
  assert.match(out.setCookie, /Max-Age=0/);
});

test('usuário desativado perde a sessão', async () => {
  const admin = await post('auth.login', { username: 'samuel', password: '1234' });
  const id = (await post('users.save', { name: 'Vend', username: 'vend', password: '1234', role: 'vendedor' }, { cookie: admin.cookie })).body.data;
  const vend = await post('auth.login', { username: 'vend', password: '1234' });
  assert.equal((await post('auth.status', {}, { cookie: vend.cookie })).body.data.user.role, 'vendedor');
  await post('users.save', { id, name: 'Vend', username: 'vend', role: 'vendedor', active: false }, { cookie: admin.cookie });
  assert.equal((await post('auth.status', {}, { cookie: vend.cookie })).body.data.user, null);
});

test('bloqueio após 5 senhas erradas', async () => {
  for (let i = 0; i < 5; i++) {
    const r = await post('auth.login', { username: 'samuel', password: 'errada' }, { ip: '10.0.0.9' });
    assert.equal(r.body.error, 'Usuário ou senha inválidos.');
  }
  // Até a senha certa é recusada durante o bloqueio
  const blocked = await post('auth.login', { username: 'Samuel', password: '1234' }, { ip: '10.0.0.10' });
  assert.match(blocked.body.error, /Muitas tentativas/);
  await dbm.request(() => dbm.get().prepare('DELETE FROM login_attempts').run());
  assert.ok((await post('auth.login', { username: 'samuel', password: '1234' })).body.ok);
});

test('só aceita POST com JSON', async () => {
  assert.equal((await post('auth.status', {}, { httpMethod: 'GET' })).status, 405);
  assert.equal((await post('auth.status', {}, { contentType: 'text/plain' })).status, 415);
});
