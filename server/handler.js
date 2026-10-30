const { AppError } = require('./api/util');

// Junta todos os métodos da API ("modulo.acao")
const handlers = {};
for (const mod of ['auth', 'products', 'sales', 'customers', 'purchases', 'finance', 'reports', 'backup']) {
  const m = require(`./api/${mod}`);
  for (const [k, fn] of Object.entries(m)) if (k.includes('.') && typeof fn === 'function') handlers[k] = fn;
}

// Executa um método da API e devolve { ok, data } ou { ok: false, error }
async function call(method, args, ctx) {
  const fn = handlers[method];
  if (!fn) return { ok: false, error: `Método desconhecido: ${method}` };
  try {
    return { ok: true, data: await fn(args || {}, ctx) };
  } catch (err) {
    const msg = err && err.message ? err.message : String(err);
    if (!(err instanceof AppError)) console.error(`[api] ${method}:`, err);
    if (msg.startsWith('AUTH_REQUIRED:')) return { ok: false, error: msg.slice(14), authRequired: true };
    let friendly = msg;
    if (/UNIQUE constraint failed/.test(msg)) friendly = 'Registro duplicado: já existe um cadastro com esses dados.';
    else if (/FOREIGN KEY constraint failed/.test(msg)) friendly = 'Este registro está vinculado a outros dados e não pode ser alterado/excluído.';
    else if (!(err instanceof AppError)) friendly = 'Erro inesperado: ' + msg;
    return { ok: false, error: friendly };
  }
}

module.exports = { call, handlers };
