// Servidor local de desenvolvimento: recebe as chamadas da API em POST /api.
// O Vite (porta 5173) repassa /api para cá.
const http = require('http');
const dbm = require('./db');
const { handle } = require('./http');

const PORT = 5174;

dbm.open();

http.createServer((req, res) => {
  if (req.url !== '/api') {
    res.statusCode = 404;
    res.end();
    return;
  }
  handle(req, res).catch((e) => {
    console.error(e);
    res.statusCode = 500;
    res.end();
  });
}).listen(PORT, '127.0.0.1', () => console.log(`API em http://127.0.0.1:${PORT}/api`));
