// Backup em arquivo JSON com todas as tabelas.
// - "Baixar backup": as telas pedem cada tabela em páginas (backup.export) e montam o arquivo.
// - "Restaurar": as telas enviam o arquivo em partes (backup.restoreStage), guardadas em backup_staging, e
//   backup.restoreCommit troca todos os dados de uma vez, numa transação só.
// - Backup diário: scripts/backup.js (GitHub Actions) usa dumpAll().
const dbm = require('../db');
const { fail, requireAdmin, getSetting, setSetting, localDateTime } = require('./util');

const FORMAT = 'lojaup-backup';
const PAGE = 2000;

async function log(destination, file, status, message) {
  await dbm.get().prepare('INSERT INTO backup_log (destination, file, status, message) VALUES (?, ?, ?, ?)').run(destination, file, status, message || null);
}

async function tableRows(table, offset = 0, limit = null) {
  return dbm.get().prepare(`SELECT * FROM ${table} ORDER BY 1 ${limit ? `LIMIT ${limit} OFFSET ${offset}` : ''}`).all();
}

function header() {
  return { format: FORMAT, schema_version: dbm.schemaVersion, created_at: localDateTime() };
}

// Backup completo (usado pelo backup automático)
async function dumpAll() {
  const tables = {};
  for (const t of dbm.TABLES) tables[t] = await tableRows(t);
  return { ...header(), tables };
}

// Registra um backup feito (atualiza o "último backup" do painel)
async function markDone(destination, file) {
  await setSetting('last_backup_at', localDateTime());
  await log(destination, file, 'ok');
}

module.exports = {
  dumpAll,
  markDone,

  'backup.info': async (_, ctx) => {
    requireAdmin(ctx);
    const db = dbm.get();
    return {
      lastBackup: await getSetting('last_backup_at'),
      log: await db.prepare('SELECT * FROM backup_log ORDER BY id DESC LIMIT 30').all(),
      tables: dbm.TABLES,
      header: header(),
    };
  },

  // Uma página de uma tabela, para montar o arquivo de backup nas telas
  'backup.export': async ({ table, offset = 0 }, ctx) => {
    requireAdmin(ctx);
    if (!dbm.TABLES.includes(table)) fail('Tabela inválida.');
    const rows = await tableRows(table, Number(offset) || 0, PAGE);
    return { rows, done: rows.length < PAGE };
  },

  'backup.downloaded': async (_, ctx) => {
    requireAdmin(ctx);
    await markDone('Download', null);
    return true;
  },

  // Recebe parte dos dados de um backup. reset = true apaga o que foi enviado antes.
  'backup.restoreStage': async ({ reset, schema_version, table, rows }, ctx) => {
    requireAdmin(ctx);
    const db = dbm.get();
    if (reset) {
      if (schema_version !== dbm.schemaVersion) {
        fail(`Este backup é de outra versão do banco (${schema_version}); a atual é ${dbm.schemaVersion}.`);
      }
      await db.prepare('DELETE FROM backup_staging').run();
    }
    if (!table) return true;
    if (!dbm.TABLES.includes(table)) fail(`Tabela desconhecida no backup: ${table}`);
    if (!Array.isArray(rows)) fail('Arquivo de backup inválido.');
    await db.prepare('INSERT INTO backup_staging (tbl, data) SELECT ?, jsonb_array_elements(?::jsonb) RETURNING id').run(table, JSON.stringify(rows));
    return true;
  },

  // Troca todos os dados pelos do backup enviado
  'backup.restoreCommit': async (_, ctx) => {
    requireAdmin(ctx);
    const db = dbm.get();
    const staged = await db.prepare('SELECT tbl, COUNT(*) c FROM backup_staging GROUP BY tbl').all();
    const counts = Object.fromEntries(staged.map((r) => [r.tbl, r.c]));
    if (!counts.users) fail('O backup não tem usuários. Envie o arquivo novamente.');
    await db.exec(`TRUNCATE ${dbm.TABLES.join(', ')} RESTART IDENTITY`);
    for (const t of dbm.TABLES) {
      if (!counts[t]) continue;
      await db.prepare(`INSERT INTO ${t} SELECT (jsonb_populate_record(NULL::${t}, data)).* FROM backup_staging WHERE tbl = ? ORDER BY id`).run(t);
      if (t !== 'settings') {
        await db.prepare(`SELECT setval(pg_get_serial_sequence('${t}', 'id'), COALESCE(MAX(id), 0) + 1, false) FROM ${t}`).get();
      }
    }
    await db.prepare('DELETE FROM backup_staging').run();
    await log('Restauração', null, 'ok', 'Dados restaurados de um arquivo de backup');
    ctx.user = null;
    return counts;
  },
};
