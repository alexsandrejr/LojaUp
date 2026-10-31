// Backup diário (GitHub Actions, .github/workflows/backup.yml): grava todos os dados num arquivo JSON.
// Uso: DATABASE_URL=... node scripts/backup.js [arquivo]   (padrão: backup/lojaup-backup.json)
const fs = require('fs');
const path = require('path');
const dbm = require('../server/db');
const { dumpAll, markDone } = require('../server/api/backup');

// Uma linha por registro: o git guarda só o que mudou de um dia para o outro
function serialize(data) {
  const { tables, ...head } = data;
  const parts = Object.entries(tables).map(([t, rows]) => `${JSON.stringify(t)}: [${rows.length ? '\n' + rows.map((r) => JSON.stringify(r)).join(',\n') + '\n' : ''}]`);
  return `${JSON.stringify(head).slice(0, -1)},\n"tables": {\n${parts.join(',\n')}\n}}\n`;
}

async function main() {
  if (!process.env.DATABASE_URL) throw new Error('Defina a variável DATABASE_URL (conexão do Supabase).');
  const out = process.argv[2] || path.join('backup', 'lojaup-backup.json');
  dbm.open();
  const data = await dbm.request(() => dumpAll());
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, serialize(data));
  await dbm.request(() => markDone('GitHub (automático)', path.basename(out)));
  await dbm.close();
  const rows = Object.values(data.tables).reduce((a, r) => a + r.length, 0);
  console.log(`Backup gravado em ${out}: ${rows} registros.`);
}

module.exports = { serialize };

if (require.main === module) {
  main().catch((e) => {
    console.error('Falha no backup:', e.message);
    process.exit(1);
  });
}
