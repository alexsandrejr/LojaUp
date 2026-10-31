// Preenche o banco LOCAL de desenvolvimento com dados de exemplo (itens da planilha da Quintino).
// Com o "npm run dev" rodando e o banco vazio (apague a pasta .data antes), rode: npm run seed
// Entra no sistema com o usuário "admin" e a senha "admin123" (só para testes locais).
const API = 'http://127.0.0.1:5174/api';
const LOGIN = { username: 'admin', password: 'admin123' };
let cookie = '';

async function api(method, args) {
  const r = await fetch(API, { method: 'POST', headers: { 'Content-Type': 'application/json', cookie }, body: JSON.stringify({ method, args }) });
  const set = r.headers.get('set-cookie');
  if (set) cookie = set.split(';')[0];
  const out = await r.json();
  if (!out.ok) throw new Error(`${method}: ${out.error}`);
  return out.data;
}

const today = new Date();
const ymd = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const plusDays = (n) => { const d = new Date(today); d.setDate(d.getDate() + n); return ymd(d); };

async function main() {
  if (!(await api('auth.status')).needsSetup) throw new Error('O banco já tem dados. Pare o npm run dev, apague a pasta .data e tente de novo.');
  await api('auth.setup', { storeName: 'Quintino Imports', name: 'Administrador', ...LOGIN });
  await api('settings.save', { store_phone: '(85) 90000-0000', store_address: 'Fortaleza - CE' });
  const supplier = await api('suppliers.save', { name: 'AliExpress' });
  const product = (name, cost, price, colors) => api('products.save', {
    name, brand: name.startsWith('S11') ? 'S11' : 'Wearzone', category: 'Smartwatches', cost_price: cost, sale_price: price, min_stock: 1,
    variants: colors.map((color) => ({ color })),
  });
  const pro = await product('S11 Pro', 84, 189.9, ['Prata', 'Preto']);
  const mini = await product('S11 Mini', 85, 179.9, ['Prata', 'Dourado']);
  const dune = await product('Wearzone Dune', 319, 549.9, ['Preto']);
  const v = async (id, color) => (await api('products.get', { id })).variants.find((x) => x.color === color).id;
  const items = [[pro, 'Prata', 84, 3], [pro, 'Preto', 84, 3], [mini, 'Prata', 85, 2], [mini, 'Dourado', 85, 2], [dune, 'Preto', 319, 1]];
  const purchaseItems = [];
  for (const [id, color, cost, qty] of items) purchaseItems.push({ variant_id: await v(id, color), quantity: qty, unit_cost: cost });
  await api('purchases.create', { supplier_id: supplier, freight: 55, items: purchaseItems, payment: { mode: 'avista', method: 'pix' } });
  const maria = await api('customers.save', { name: 'Maria Souza', phone: '85988887777', birth_date: `1992-${plusDays(1).slice(5)}`, credit_limit: 600 });
  await api('customers.save', { name: 'João Lima', phone: '85977776666', birth_date: '1988-03-12' });
  await api('cash.open', { amount: 100 });
  await api('sales.create', { items: [{ variant_id: await v(pro, 'Prata'), quantity: 1 }], payments: [{ method: 'pix', amount: 189.9 }] });
  await api('sales.create', { items: [{ variant_id: await v(mini, 'Dourado'), quantity: 1 }], payments: [{ method: 'credito', amount: 179.9, installments: 12 }] });
  await api('sales.create', {
    customer_id: maria, items: [{ variant_id: await v(pro, 'Preto'), quantity: 1 }],
    payments: [{ method: 'crediario', amount: 189.9 }], crediario: { installments: 3, first_due: plusDays(-5) },
  });
  await api('payables.save', { description: 'Aluguel', category: 'Aluguel', expense_type: 'fixa', amount: 800, due_date: plusDays(3), repeat: 3 });
  console.log(`Dados de exemplo criados. Entre com usuário "${LOGIN.username}" e senha "${LOGIN.password}".`);
}

main().catch((e) => { console.error(e.message); process.exit(1); });
