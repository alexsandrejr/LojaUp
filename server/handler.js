const dbm = require('./db');
const session = require('./session');
const { AppError } = require('./api/util');
const auth = require('./api/auth');

// Junta todos os métodos da API ("modulo.acao"). Os require são fixos para a Vercel incluir os arquivos.
const MODULES = [
  auth, require('./api/products'), require('./api/sales'), require('./api/customers'),
  require('./api/purchases'), require('./api/finance'), require('./api/reports'), require('./api/backup'),
];
const handlers = {};
for (const m of MODULES) {
  for (const [k, fn] of Object.entries(m)) if (k.includes('.') && typeof fn === 'function') handlers[k] = fn;
}

// Chamadas que conferem senha: contam as tentativas erradas e bloqueiam por um tempo
const PASSWORD_CHECKS = new Set(['auth.login', 'auth.authorize']);

function friendlyError(err) {
  const msg = err && err.message ? err.message : String(err);
  if (msg.startsWith('AUTH_REQUIRED:')) return { ok: false, error: msg.slice(14), authRequired: true };
  if (err && err.code === '23505') return { ok: false, error: 'Registro duplicado: já existe um cadastro com esses dados.' };
  if (err && err.code === '23503') return { ok: false, error: 'Este registro está vinculado a outros dados e não pode ser alterado/excluído.' };
  return { ok: false, error: err instanceof AppError ? msg : 'Erro inesperado: ' + msg };
}

// Executa um método da API numa transação e devolve { ok, data } ou { ok: false, error }.
// ctx.user é o usuário logado. Se ctx tiver "token" (cookie da sessão), o usuário é lido dele.
async function call(method, args, ctx) {
  const fn = handlers[method];
  if (!fn) return { ok: false, error: `Método desconhecido: ${method}` };
  const run = async () => {
    try {
      return {
        ok: true,
        data: await dbm.request(async () => {
          if ('token' in ctx) ctx.user = await session.userFromToken(ctx.token);
          return fn(args || {}, ctx);
        }),
      };
    } catch (err) {
      if (!(err instanceof AppError)) console.error(`[api] ${method}:`, err);
      return friendlyError(err);
    }
  };
  if (!PASSWORD_CHECKS.has(method)) return run();

  const username = String((args && args.username) || '').trim().toLowerCase();
  if (await dbm.request(() => auth.loginBlocked(username, ctx.ip))) {
    return { ok: false, error: 'Muitas tentativas com senha errada. Aguarde 15 minutos e tente de novo.' };
  }
  const out = await run();
  await dbm.request(() => (out.ok ? auth.clearLoginFailures(username) : auth.recordLoginFailure(username, ctx.ip)));
  return out;
}

module.exports = { call, handlers };
