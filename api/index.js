// Função da Vercel: atende POST /api. A conexão com o banco vem da variável DATABASE_URL.
const dbm = require('../server/db');
const { handle } = require('../server/http');

function notConfigured(req, res) {
  res.statusCode = 500;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify({ ok: false, error: 'Servidor sem banco de dados: defina a variável DATABASE_URL na Vercel e publique de novo.' }));
}

if (process.env.DATABASE_URL) dbm.open();

module.exports = process.env.DATABASE_URL ? handle : notConfigured;
