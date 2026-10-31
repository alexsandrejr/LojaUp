// Roteiro completo da loja num banco Postgres na memória (PGlite).
// Passa por todas as chamadas da API e confere as contas principais (custo com frete, estoque por cor,
// caixa, crediário, trocas). Rodar com: npm test
const test = require('node:test');
const assert = require('node:assert/strict');
const dbm = require('../server/db');
const { call, handlers } = require('../server/handler');
const { localDate, addDays } = require('../server/api/util');

const called = new Set();
const admin = { user: null };
const seller = { user: null };

// Chama a API e falha o teste se der erro
async function ok(ctx, method, args) {
  called.add(method);
  const r = await call(method, args, ctx);
  assert.ok(r.ok, `${method}: ${r.error}`);
  return r.data;
}
// Chama a API esperando erro
async function err(ctx, method, args) {
  called.add(method);
  const r = await call(method, args, ctx);
  assert.ok(!r.ok, `${method} deveria falhar`);
  return r;
}

const ids = {};
const variant = async (productId, color) => (await ok(admin, 'products.get', { id: productId })).variants.find((v) => v.color === color);

test.before(() => dbm.open({ dataDir: null }));
test.after(() => dbm.close());

test('configuração inicial', async () => {
  assert.equal((await ok(admin, 'auth.status')).needsSetup, true);
  await ok(admin, 'auth.setup', { storeName: 'Quintino Imports', name: 'Samuel', username: 'samuel', password: '1234' });
  await err(admin, 'auth.setup', { storeName: 'X', name: 'X', username: 'x', password: '1234' });
  await ok(admin, 'auth.logout');
  await err(admin, 'auth.login', { username: 'samuel', password: 'errada' });
  // O login não diferencia maiúsculas
  assert.equal((await ok(admin, 'auth.login', { username: 'SAMUEL', password: '1234' })).role, 'admin');
  await ok(admin, 'settings.save', { store_name: 'Quintino Imports', store_phone: '(85) 99999-0000', max_discount_percent_seller: '10' });
  assert.equal((await ok(admin, 'settings.get')).store_phone, '(85) 99999-0000');
  ids.sellerId = await ok(admin, 'users.save', { name: 'Vendedor', username: 'vend', password: '1234', role: 'vendedor' });
  assert.equal((await ok(admin, 'users.list')).length, 2);
});

test('produtos com cores', async () => {
  ids.supplier = await ok(admin, 'suppliers.save', { name: 'AliExpress' });
  const prod = (name, cost, price, colors) => ok(admin, 'products.save', {
    name, brand: 'Wearzone', category: 'Relógios', cost_price: cost, sale_price: price, min_stock: 1,
    variants: colors.map((color) => ({ color, stock: 0 })),
  });
  ids.pro = await prod('S11 Pro', 84, 189.9, ['Prata', 'Preto']);
  ids.mini = await prod('S11 Mini', 85, 179.9, ['Prata', 'Dourado']);
  ids.dune = await prod('Wearzone Dune', 319, 549.9, ['Preto']);
  const options = await ok(admin, 'products.options');
  assert.deepEqual(options.colors, ['Dourado', 'Prata', 'Preto']);
  assert.equal((await ok(admin, 'products.list', { search: 's11' })).length, 2);
  // Código de barras gerado e busca pelo leitor
  const v = await variant(ids.pro, 'Prata');
  assert.match(v.barcode, /^2\d{12}$/);
  assert.equal((await ok(admin, 'products.findBarcode', { code: v.barcode })).id, v.id);
  assert.ok((await ok(admin, 'products.searchVariants', { q: 'pro preto' })).length === 1);
});

test('compra com frete rateado (planilha)', async () => {
  const items = [];
  for (const [p, c, cost] of [[ids.pro, 'Prata', 84], [ids.pro, 'Preto', 84], [ids.mini, 'Prata', 85], [ids.mini, 'Dourado', 85], [ids.dune, 'Preto', 319]]) {
    items.push({ variant_id: (await variant(p, c)).id, quantity: 1, unit_cost: cost });
  }
  ids.purchase = await ok(admin, 'purchases.create', {
    supplier_id: ids.supplier, freight: 55, items, payment: { mode: 'avista', method: 'pix' },
  });
  const pu = await ok(admin, 'purchases.get', { id: ids.purchase });
  const landed = Object.fromEntries(pu.items.map((i) => [`${i.product_name} ${i.color}`, i.landed_unit_cost]));
  assert.equal(landed['S11 Pro Prata'], 91.03);
  assert.equal(landed['Wearzone Dune Preto'], 345.7);
  assert.equal(pu.total, 712);
  // Estoque por cor: cada variação com 1
  assert.equal((await variant(ids.pro, 'Prata')).stock, 1);
  assert.equal((await variant(ids.pro, 'Preto')).stock, 1);
  assert.equal((await ok(admin, 'purchases.list')).length, 1);
  assert.equal((await ok(admin, 'purchases.lastCost', { variantId: items[0].variant_id })).unit_cost, 84);
  assert.equal((await ok(admin, 'suppliers.get', { id: ids.supplier })).products.length, 3);
  assert.equal((await ok(admin, 'suppliers.priceComparison')).length, 3);
  assert.equal((await ok(admin, 'suppliers.list'))[0].purchase_total, 712);
  const other = await ok(admin, 'suppliers.save', { name: 'Fornecedor antigo' });
  await ok(admin, 'suppliers.delete', { id: other });
  assert.equal((await ok(admin, 'suppliers.list')).length, 1);
});

test('caixa e vendas', async () => {
  await err(admin, 'sales.create', { items: [{ variant_id: 1, quantity: 1 }], payments: [{ method: 'pix', amount: 1 }] });
  ids.cash = await ok(admin, 'cash.open', { amount: 100 });
  const pro = await variant(ids.pro, 'Prata');
  const mini = await variant(ids.mini, 'Dourado');
  const dune = await variant(ids.dune, 'Preto');
  ids.sale1 = await ok(admin, 'sales.create', { items: [{ variant_id: pro.id, quantity: 1 }], payments: [{ method: 'pix', amount: 189.9 }] });
  ids.sale2 = await ok(admin, 'sales.create', { items: [{ variant_id: mini.id, quantity: 1 }], payments: [{ method: 'credito', amount: 179.9, installments: 12 }] });
  ids.sale3 = await ok(admin, 'sales.create', { items: [{ variant_id: dune.id, quantity: 1 }], payments: [{ method: 'dinheiro', amount: 600 }] });
  // A venda do S11 Pro prata não mexe no preto
  assert.equal((await variant(ids.pro, 'Prata')).stock, 0);
  assert.equal((await variant(ids.pro, 'Preto')).stock, 1);
  const s3 = await ok(admin, 'sales.get', { id: ids.sale3 });
  assert.equal(s3.change_amount, 50.1);
  assert.equal(s3.payments[0].amount, 549.9);
  assert.equal((await ok(admin, 'sales.list', { search: 'dune' })).length, 1);
  assert.equal((await ok(admin, 'sales.list', { from: localDate(), to: localDate() })).length, 3);
  const cash = await ok(admin, 'cash.current');
  assert.equal(cash.expectedCash, 649.9);
  assert.equal(cash.salesInfo.qty, 3);
});

test('vendedor e limite de desconto', async () => {
  await ok(seller, 'auth.login', { username: 'vend', password: '1234' });
  await err(seller, 'users.list');
  await err(seller, 'finance.summary');
  const preto = await variant(ids.pro, 'Preto');
  const r = await err(seller, 'sales.create', { items: [{ variant_id: preto.id, quantity: 1 }], discount: 50, payments: [{ method: 'pix', amount: 139.9 }] });
  assert.equal(r.authRequired, true);
  await ok(seller, 'auth.authorize', { username: 'samuel', password: '1234' });
  ids.sale4 = await ok(seller, 'sales.create', {
    items: [{ variant_id: preto.id, quantity: 1 }], discount: 50, payments: [{ method: 'pix', amount: 139.9 }],
    authorization: { username: 'samuel', password: '1234' },
  });
  await ok(seller, 'auth.changePassword', { current: '1234', password: '4321' });
  await ok(seller, 'auth.logout');
  await ok(seller, 'auth.login', { username: 'vend', password: '4321' });
});

test('cancelamento, troca e vale', async () => {
  await ok(admin, 'sales.cancel', { id: ids.sale4, reason: 'Teste' });
  assert.equal((await variant(ids.pro, 'Preto')).stock, 1);
  await err(admin, 'sales.cancel', { id: ids.sale4, reason: 'De novo' });
  const s1 = await ok(admin, 'sales.get', { id: ids.sale1 });
  const ret = await ok(admin, 'returns.create', {
    saleId: ids.sale1, type: 'troca', refund_method: 'vale', reason: 'Troca de cor',
    items: [{ sale_item_id: s1.items[0].id, quantity: 1, back_to_stock: true }],
  });
  assert.equal(ret.voucher.amount, 189.9);
  assert.equal((await ok(admin, 'vouchers.get', { code: ret.voucher.code })).balance, 189.9);
  // Usa o vale numa venda do preto
  const preto = await variant(ids.pro, 'Preto');
  ids.sale5 = await ok(admin, 'sales.create', { items: [{ variant_id: preto.id, quantity: 1 }], payments: [{ method: 'vale', amount: 189.9, voucher_code: ret.voucher.code }] });
  assert.equal((await ok(admin, 'vouchers.get', { code: ret.voucher.code })).balance, 0);
  assert.equal((await ok(admin, 'returns.list')).length, 1);
  assert.ok((await ok(admin, 'returns.list'))[0].items_desc.includes('x1'));
  assert.equal((await ok(admin, 'vouchers.list')).length, 1);
});

test('clientes e crediário', async () => {
  const birth = `1990-${addDays(localDate(), 2).slice(5)}`;
  ids.customer = await ok(admin, 'customers.save', { name: 'Maria Souza', cpf: '123.456.789-09', phone: '85999990000', birth_date: birth, credit_limit: 500 });
  await err(admin, 'customers.save', { name: 'Outra', cpf: '12345678909' });
  const mini = await variant(ids.mini, 'Prata');
  ids.saleCred = await ok(admin, 'sales.create', {
    customer_id: ids.customer, items: [{ variant_id: mini.id, quantity: 1 }],
    payments: [{ method: 'crediario', amount: 179.9 }], crediario: { installments: 3, first_due: addDays(localDate(), -20) },
  });
  const credit = await ok(admin, 'customers.credit', { id: ids.customer });
  assert.equal(credit.balance, 179.9);
  assert.equal(credit.overdueCount, 1);
  const list = await ok(admin, 'installments.list', { status: 'vencida' });
  assert.equal(list.length, 1);
  assert.ok(list[0].charges.fee > 0);
  const group = await ok(admin, 'installments.pay', { customerId: ids.customer, method: 'dinheiro', items: [{ installment_id: list[0].id, amount: list[0].amount, interest: list[0].charges.fee }] });
  const receipt = await ok(admin, 'installments.receipt', { group });
  assert.equal(receipt.rows.length, 1);
  const c = await ok(admin, 'customers.get', { id: ids.customer });
  assert.equal(c.installments.filter((i) => i.status === 'aberta').length, 2);
  assert.equal(c.favorites[0].category, 'Relógios');
  assert.ok(c.sales[0].items_desc.includes('S11 Mini'));
  assert.equal((await ok(admin, 'customers.list', { filter: 'devedores' })).length, 1);
  assert.equal((await ok(admin, 'customers.list', { search: 'maria' })).length, 1);
  assert.equal((await ok(admin, 'customers.birthdays')).upcoming[0].days_until, 2);
  const analysis = await ok(admin, 'credit.analysis');
  assert.ok(analysis.receivedMonth > 0);
  await err(admin, 'customers.delete', { id: ids.customer });
});

test('estoque, inventário e promoções', async () => {
  const preto = await variant(ids.pro, 'Preto');
  await ok(admin, 'stock.adjust', { variantId: preto.id, mode: 'entrada', quantity: 5, reason: 'Reposição' });
  await ok(admin, 'stock.adjust', { variantId: preto.id, mode: 'saida', quantity: 1, reason: 'Defeito' });
  await ok(admin, 'stock.adjust', { variantId: preto.id, mode: 'ajuste', quantity: 3, reason: 'Contagem' });
  assert.equal((await variant(ids.pro, 'Preto')).stock, 3);
  assert.ok((await ok(admin, 'stock.movements', { variantId: preto.id })).length >= 5);
  const audit = await ok(admin, 'stock.audit');
  assert.ok(audit.every((r) => r.divergence === 0));
  assert.ok((await ok(admin, 'stock.low')).length > 0);
  assert.equal(await ok(admin, 'stock.defaultMin'), 2);

  const inv = await ok(admin, 'inventory.create', { category: 'Relógios' });
  await err(admin, 'inventory.create', {});
  await ok(admin, 'inventory.count', { inventoryId: inv, barcode: preto.barcode, quantity: 2 });
  await ok(admin, 'inventory.finish', { id: inv });
  assert.equal((await variant(ids.pro, 'Preto')).stock, 2);
  assert.equal((await ok(admin, 'inventory.get', { id: inv })).status, 'finalizado');
  const inv2 = await ok(admin, 'inventory.create', {});
  await ok(admin, 'inventory.cancel', { id: inv2 });
  assert.equal((await ok(admin, 'inventory.list')).length, 2);

  const promo = await ok(admin, 'promotions.save', { name: 'Black Friday', discount_type: 'percent', value: 10, scope: 'category', scope_value: 'Relógios' });
  await ok(admin, 'promotions.save', { name: 'Só o Dune', discount_type: 'fixed', value: 50, scope: 'product', scope_value: ids.dune });
  assert.equal((await variant(ids.pro, 'Preto')).promo_price, 170.91);
  const promos = await ok(admin, 'promotions.list');
  assert.equal(promos.find((p) => p.scope === 'product').product_name, 'Wearzone Dune');
  await ok(admin, 'promotions.delete', { id: promo });

  const tmp = await ok(admin, 'products.save', { name: 'Pulseira', sale_price: 20, variants: [{ color: 'Azul' }] });
  assert.equal(await ok(admin, 'products.delete', { id: tmp }), 'excluido');
  assert.equal(await ok(admin, 'products.delete', { id: ids.dune }), 'inativado');
  assert.equal((await ok(admin, 'products.list', { filter: 'zero', showInactive: true })).length >= 1, true);
});

test('financeiro', async () => {
  const today = localDate();
  const bill = await ok(admin, 'payables.save', { description: 'Aluguel', category: 'Aluguel', expense_type: 'fixa', amount: 800, due_date: today, repeat: 3 });
  await ok(admin, 'payables.pay', { id: bill, method: 'pix' });
  await ok(admin, 'payables.reopen', { id: bill });
  await ok(admin, 'payables.pay', { id: bill, method: 'pix' });
  const late = await ok(admin, 'payables.save', { description: 'Internet', category: 'Internet/Telefone', amount: 100, due_date: addDays(today, -3) });
  assert.equal((await ok(admin, 'payables.list', { status: 'vencida' })).length, 1);
  await ok(admin, 'payables.delete', { id: late });
  assert.ok((await ok(admin, 'payables.categories')).includes('Aluguel'));
  const rec = await ok(admin, 'receivables.save', { description: 'Venda fiado', amount: 50, due_date: today });
  await ok(admin, 'receivables.receive', { id: rec, method: 'pix' });
  await ok(admin, 'receivables.save', { description: 'Outra', amount: 30, due_date: addDays(today, 5) });
  assert.equal((await ok(admin, 'receivables.list', {})).length, 2);
  await ok(admin, 'receivables.delete', { id: rec });
  const dre = await ok(admin, 'finance.dre', { from: today.slice(0, 8) + '01', to: today });
  assert.equal(dre.fixed_expenses >= 800, true);
  assert.ok(dre.net_revenue > 0);
  const flow = await ok(admin, 'finance.cashflow', { from: addDays(today, -1), to: addDays(today, 60) });
  assert.ok(flow.totals.in > 0 && flow.totals.out_forecast > 0);
  const sum = await ok(admin, 'finance.summary');
  assert.equal(sum.payables_open, 1600);
});

test('relatórios e painel', async () => {
  const today = localDate();
  const from = addDays(today, -30);
  for (const groupBy of ['day', 'week', 'month']) {
    const series = await ok(admin, 'reports.revenue', { from, to: today, groupBy });
    assert.ok(series.some((r) => r.sales > 0), groupBy);
  }
  assert.equal((await ok(admin, 'reports.revenue', { from, to: today, groupBy: 'day' })).length, 31);
  assert.ok((await ok(admin, 'reports.products', { from, to: today })).length >= 3);
  await ok(admin, 'reports.stale', { days: 1 });
  for (const by of ['category', 'brand', 'size', 'color', 'seller', 'hour', 'weekday', 'payment']) {
    const rows = await ok(admin, 'reports.breakdown', { from, to: today, by });
    assert.ok(rows.length > 0, by);
  }
  // Tamanho vazio vira "Único" numa linha só
  const grid = await ok(admin, 'reports.sizeGrid', { from, to: today });
  assert.equal(grid.length, 1);
  assert.equal(grid[0].size, 'Único');
  await ok(admin, 'reports.purchaseSuggestions');
  const value = await ok(admin, 'reports.stockValue');
  assert.equal(value.length, 1);
  const dash = await ok(admin, 'insights.dashboard');
  assert.ok(dash.month.sales > 0);
  assert.equal(dash.series.length, 30);
  assert.ok(dash.alerts.some((a) => a.title.includes('backup')));
});

test('caixa: sangria e fechamento', async () => {
  await ok(admin, 'cash.movement', { type: 'suprimento', amount: 20 });
  await err(admin, 'cash.movement', { type: 'sangria', amount: 99999 });
  await ok(admin, 'cash.movement', { type: 'sangria', amount: 50 });
  const { expectedCash } = await ok(admin, 'cash.current');
  await ok(admin, 'cash.close', { counted: expectedCash - 2 });
  const hist = await ok(admin, 'cash.history');
  assert.equal(hist[0].difference, -2);
  assert.equal((await ok(admin, 'cash.get', { id: hist[0].id })).salesInfo.qty, 5);
});

test('cancelamento de compra', async () => {
  const preto = await variant(ids.pro, 'Preto');
  const id = await ok(admin, 'purchases.create', { items: [{ variant_id: preto.id, quantity: 2, unit_cost: 80 }], payment: { mode: 'parcelado', installments: 2 } });
  assert.equal((await variant(ids.pro, 'Preto')).stock, 4);
  await ok(admin, 'purchases.cancel', { id });
  assert.equal((await variant(ids.pro, 'Preto')).stock, 2);
});

test('backup e restauração', async () => {
  const info = await ok(admin, 'backup.info');
  const file = { ...info.header, tables: {} };
  for (const t of info.tables) {
    file.tables[t] = [];
    for (let offset = 0; ;) {
      const page = await ok(admin, 'backup.export', { table: t, offset });
      file.tables[t].push(...page.rows);
      offset += page.rows.length;
      if (page.done) break;
    }
  }
  await ok(admin, 'backup.downloaded');
  const salesBefore = file.tables.sales.length;
  // Estraga os dados e restaura
  await ok(admin, 'customers.save', { name: 'Cliente depois do backup' });
  await err(admin, 'backup.restoreStage', { reset: true, schema_version: 999 });
  await ok(admin, 'backup.restoreStage', { reset: true, schema_version: file.schema_version });
  for (const [table, rows] of Object.entries(file.tables)) {
    for (let i = 0; i < rows.length; i += 500) await ok(admin, 'backup.restoreStage', { table, rows: rows.slice(i, i + 500) });
  }
  const counts = await ok(admin, 'backup.restoreCommit');
  assert.equal(counts.sales, salesBefore);
  assert.equal(admin.user, null);
  await ok(admin, 'auth.login', { username: 'samuel', password: '1234' });
  assert.equal((await ok(admin, 'customers.list', { search: 'depois' })).length, 0);
  // Os ids continuam a partir do maior restaurado
  const newId = await ok(admin, 'customers.save', { name: 'Novo' });
  assert.ok(newId > ids.customer);
  assert.equal((await ok(admin, 'backup.info')).log[0].destination, 'Restauração');
});

test('todas as chamadas da API foram testadas', () => {
  const missing = Object.keys(handlers).filter((m) => !called.has(m));
  assert.deepEqual(missing, []);
});
