// Servidor local de desenvolvimento: recebe as chamadas da API em POST /api.
// O Vite (porta 5173) repassa /api para cá.
const http = require('http');
const dbm = require('./db');
const { call } = require('./handler');

const PORT = 5174;
const ctx = { user: null };

dbm.open();

http.createServer((req, res) => {
  if (req.method !== 'POST' || req.url !== '/api') {
    res.statusCode = 404;
    res.end();
    return;
  }
  let body = '';
  req.on('data', (c) => { body += c; });
  req.on('end', async () => {
    res.setHeader('Content-Type', 'application/json');
    try {
      const { method, args } = JSON.parse(body || '{}');
      res.end(JSON.stringify(await call(method, args, ctx)));
    } catch (e) {
      res.statusCode = 400;
      res.end(JSON.stringify({ ok: false, error: e.message }));
    }
  });
}).listen(PORT, '127.0.0.1', () => console.log(`API em http://127.0.0.1:${PORT}/api`));
