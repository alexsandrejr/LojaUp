// Chamada à API do servidor (POST /api)
export async function api(method, args) {
  const r = await fetch('/api', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ method, args }),
  });
  let res;
  try {
    res = await r.json();
  } catch (e) {
    throw new Error(`Servidor indisponível (HTTP ${r.status}).`);
  }
  if (!res.ok) {
    const err = new Error(res.error || 'Erro desconhecido');
    err.authRequired = !!res.authRequired;
    throw err;
  }
  return res.data;
}
