const crypto = require('crypto');
const dbm = require('../db');

class AppError extends Error {}

const fail = (msg) => { throw new AppError(msg); };
const r2 = (n) => Math.round((Number(n) || 0) * 100) / 100;
const pad = (n) => String(n).padStart(2, '0');

// Data e hora atuais no fuso da loja. O servidor pode estar em outro fuso (na Vercel, UTC).
const TZ = 'America/Sao_Paulo';
const clock = new Intl.DateTimeFormat('en-CA', {
  timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
});
function nowParts() {
  return Object.fromEntries(clock.formatToParts(new Date()).map((p) => [p.type, p.value]));
}
function localDate() {
  const p = nowParts();
  return `${p.year}-${p.month}-${p.day}`;
}
function localDateTime() {
  const p = nowParts();
  return `${p.year}-${p.month}-${p.day} ${p.hour}:${p.minute}:${p.second}`;
}
// Conta de datas 'AAAA-MM-DD' (não depende do fuso)
const ymd = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
function addDays(dateStr, days) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return ymd(new Date(y, m - 1, d + days));
}
function addMonths(dateStr, months) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const target = new Date(y, m - 1 + months, 1);
  const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  target.setDate(Math.min(d, lastDay));
  return ymd(target);
}
function daysBetween(a, b) {
  const pa = a.split('-').map(Number), pb = b.split('-').map(Number);
  return Math.round((new Date(pb[0], pb[1] - 1, pb[2]) - new Date(pa[0], pa[1] - 1, pa[2])) / 86400000);
}

function requireUser(ctx) {
  if (!ctx.user) fail('Sessão expirada. Faça login novamente.');
  return ctx.user;
}
function requireAdmin(ctx) {
  const u = requireUser(ctx);
  if (u.role !== 'admin') fail('Apenas administradores podem realizar esta operação.');
  return u;
}

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(String(password), salt, 64).toString('hex');
  return `${salt}:${hash}`;
}
function verifyPassword(password, stored) {
  const [salt, hash] = String(stored).split(':');
  if (!salt || !hash) return false;
  const test = crypto.scryptSync(String(password), salt, 64);
  return crypto.timingSafeEqual(test, Buffer.from(hash, 'hex'));
}

const SETTING_DEFAULTS = {
  store_name: 'Minha Loja',
  store_document: '',
  store_address: '',
  store_phone: '',
  receipt_footer: 'Obrigado pela preferência! Trocas em até 30 dias com etiqueta.',
  printer_name: '',
  printer_width: '80',
  print_auto: '0',
  print_silent: '1',
  default_min_stock: '2',
  stale_days: '60',
  credit_block_overdue_days: '30',
  credit_late_fee_percent: '2',
  credit_interest_month_percent: '3',
  credit_max_installments: '6',
  card_max_installments: '6',
  max_discount_percent_seller: '10',
  last_backup_at: '',
  return_days: '30',
  // Mesmo texto de DEFAULT_BIRTHDAY_MESSAGE em src/lib/format.js
  birthday_message: 'Feliz aniversário, {nome}! 🎉 A {loja} preparou um presente especial para você. Venha nos visitar!',
  birthday_popup: '1',
};

async function getSetting(key) {
  const row = await dbm.get().prepare('SELECT value FROM settings WHERE key = ?').get(key);
  return row ? row.value : SETTING_DEFAULTS[key] ?? null;
}
async function getSettingNum(key) {
  return Number(await getSetting(key)) || 0;
}
async function setSetting(key, value) {
  await dbm.get().prepare('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value')
    .run(key, value == null ? '' : String(value));
}
async function allSettings() {
  const out = { ...SETTING_DEFAULTS };
  for (const row of await dbm.get().prepare('SELECT key, value FROM settings').all()) out[row.key] = row.value;
  return out;
}

// Gera um EAN-13 interno (prefixo 2, reservado para uso interno da loja)
async function generateBarcode() {
  const db = dbm.get();
  for (let attempt = 0; attempt < 50; attempt++) {
    let base = '2' + String(Date.now()).slice(-7) + String(Math.floor(Math.random() * 10000)).padStart(4, '0');
    base = base.slice(0, 12);
    let sum = 0;
    for (let i = 0; i < 12; i++) sum += Number(base[i]) * (i % 2 === 0 ? 1 : 3);
    const code = base + ((10 - (sum % 10)) % 10);
    if (!(await db.prepare('SELECT 1 FROM product_variants WHERE barcode = ?').get(code))) return code;
  }
  fail('Não foi possível gerar código de barras');
}

module.exports = {
  AppError, fail, r2, TZ, localDate, localDateTime, addDays, addMonths, daysBetween,
  requireUser, requireAdmin, hashPassword, verifyPassword,
  getSetting, getSettingNum, setSetting, allSettings, generateBarcode, SETTING_DEFAULTS,
};
