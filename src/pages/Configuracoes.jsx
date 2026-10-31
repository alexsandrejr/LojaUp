import { useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Save, Printer, Cloud, Download, Upload, Plus, CircleCheck, TriangleAlert } from 'lucide-react';
import { api } from '../api';
import { useApp } from '../App';
import { Modal, Field, useLoad, useAction, useConfirm, PageHeader, Loading, Tabs, Empty, useToast } from '../components/ui';
import { dateTime, birthdayMessage, DEFAULT_BIRTHDAY_MESSAGE } from '../lib/format';
import { printHtml, saleReceipt } from '../lib/print';

function useSettingsForm() {
  const { settings, reloadSettings } = useApp();
  const [s, setS] = useState(settings);
  const [run, busy] = useAction();
  const set = (k) => (e) => setS({ ...s, [k]: e && e.target ? (e.target.type === 'checkbox' ? (e.target.checked ? '1' : '0') : e.target.value) : e });
  const save = async (keys) => {
    const values = Object.fromEntries(keys.map((k) => [k, s[k]]));
    await run(() => api('settings.save', values), 'Configurações salvas!');
    await reloadSettings();
  };
  return { s, set, save, busy, setS };
}

function Loja() {
  const { s, set, save, busy } = useSettingsForm();
  return (
    <div className="card card-body" style={{ maxWidth: 760 }}>
      <div className="form-grid">
        <Field label="Nome da loja (aparece no cupom)" className="c-8"><input className="input" value={s.store_name} onChange={set('store_name')} /></Field>
        <Field label="CNPJ / CPF" className="c-4"><input className="input" value={s.store_document} onChange={set('store_document')} /></Field>
        <Field label="Endereço" className="c-8"><input className="input" value={s.store_address} onChange={set('store_address')} /></Field>
        <Field label="Telefone / WhatsApp" className="c-4"><input className="input" value={s.store_phone} onChange={set('store_phone')} /></Field>
        <Field label="Mensagem no rodapé do cupom" className="c-12"><textarea className="textarea" value={s.receipt_footer} onChange={set('receipt_footer')} /></Field>
        <Field label="Prazo para trocas (dias)" className="c-4"><input type="number" className="input" value={s.return_days} onChange={set('return_days')} /></Field>
      </div>
      <div className="row end mt"><button className="btn btn-primary" disabled={busy} onClick={() => save(['store_name', 'store_document', 'store_address', 'store_phone', 'receipt_footer', 'return_days'])}><Save size={16} />Salvar</button></div>
    </div>
  );
}

function Impressora() {
  const { s, set, save, busy } = useSettingsForm();
  const toast = useToast();
  const keys = ['printer_width', 'print_auto'];
  async function test() {
    await save(keys);
    const fake = {
      id: 123, created_at: new Date().toISOString().replace('T', ' ').slice(0, 19), user_name: 'Teste', customer_name: 'Cliente Teste', status: 'concluida',
      items: [{ description: 'Relógio S11 Pro Prata', quantity: 1, unit_price: 189.9, discount: 0 }, { description: 'Pulseira Silicone Preta', quantity: 2, unit_price: 29.9, discount: 5 }],
      subtotal: 249.7, discount: 5, total: 244.7, payments: [{ method: 'dinheiro', amount: 244.7 }], change_amount: 5.3, installments: [],
    };
    try { await printHtml(saleReceipt(fake, s), s); } catch (e) { toast.error(e.message); }
  }
  return (
    <div className="card card-body" style={{ maxWidth: 760 }}>
      <div className="alert alert-info mb small">
        <Printer size={18} />
        <div>O cupom abre a janela de impressão do navegador. Escolha nela a impressora térmica: o navegador lembra a última usada. Instale antes o driver Windows da impressora (Elgin, Bematech, Epson, Daruma, Tanca, Knup…).</div>
      </div>
      <div className="form-grid">
        <Field label="Largura da bobina" className="c-4">
          <select className="select" value={s.printer_width} onChange={set('printer_width')}><option value="80">80 mm</option><option value="58">58 mm</option></select>
        </Field>
        <label className="checkbox c-12"><input type="checkbox" checked={s.print_auto === '1'} onChange={set('print_auto')} />Imprimir o cupom automaticamente ao concluir cada venda</label>
      </div>
      <div className="card card-body mt small" style={{ background: 'var(--surface-2)' }}>
        <div className="strong" style={{ marginBottom: 6 }}>Imprimir direto, sem a janela de impressão (computador da loja)</div>
        <ol style={{ margin: 0, paddingLeft: 18, lineHeight: 1.6 }}>
          <li>Defina a impressora térmica como <b>impressora padrão</b> do Windows.</li>
          <li>Crie um atalho do Google Chrome na área de trabalho.</li>
          <li>Clique com o botão direito no atalho › Propriedades. No campo <b>Destino</b>, depois de <span className="mono">chrome.exe"</span>, acrescente um espaço e <span className="mono">--kiosk-printing</span>.</li>
          <li>Feche todas as janelas do Chrome e abra o LojaUp por esse atalho. A partir daí o cupom sai direto na impressora padrão.</li>
        </ol>
      </div>
      <div className="row end mt">
        <button className="btn" onClick={test}><Printer size={16} />Imprimir teste</button>
        <button className="btn btn-primary" disabled={busy} onClick={() => save(keys)}><Save size={16} />Salvar</button>
      </div>
    </div>
  );
}

// Envia o backup ao servidor em partes, para respeitar o limite de tamanho de cada requisição
const RESTORE_CHUNK = 1000;

function Backup() {
  const { data: info, reload } = useLoad('backup.info', {}, []);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState('');
  const fileRef = useRef(null);
  const confirm = useConfirm();
  const toast = useToast();
  if (!info) return <Loading />;

  async function download() {
    setBusy(true);
    try {
      const fresh = await api('backup.info');
      const file = { ...fresh.header, tables: {} };
      for (const [i, table] of fresh.tables.entries()) {
        setProgress(`Lendo os dados… ${Math.round((i / fresh.tables.length) * 100)}%`);
        file.tables[table] = [];
        for (let offset = 0; ;) {
          const page = await api('backup.export', { table, offset });
          file.tables[table].push(...page.rows);
          offset += page.rows.length;
          if (page.done) break;
        }
      }
      const name = `LojaUp-backup-${file.created_at.replace(' ', '_').replace(/:/g, '').slice(0, 15)}.json`;
      const url = URL.createObjectURL(new Blob([JSON.stringify(file)], { type: 'application/json' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 10000);
      await api('backup.downloaded');
      toast.success(`Backup baixado: ${name}`);
      reload();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusy(false);
      setProgress('');
    }
  }

  async function restore(f) {
    if (!f) return;
    let data;
    try { data = JSON.parse(await f.text()); } catch (e) { data = null; }
    if (!data || data.format !== 'lojaup-backup' || !data.tables) { toast.error('Este arquivo não é um backup do LojaUp.'); return; }
    const ok = await confirm({
      title: 'Restaurar backup', danger: true, confirmText: 'Restaurar',
      message: `Os dados atuais serão SUBSTITUÍDOS pelos do backup de ${dateTime(data.created_at)}.\n\nSe quiser guardar os dados atuais, baixe um backup antes. Depois da restauração será preciso entrar novamente. Continuar?`,
    });
    if (!ok) return;
    setBusy(true);
    try {
      await api('backup.restoreStage', { reset: true, schema_version: data.schema_version });
      const tables = Object.entries(data.tables);
      for (const [i, [table, rows]] of tables.entries()) {
        setProgress(`Enviando os dados… ${Math.round((i / tables.length) * 100)}%`);
        for (let k = 0; k < rows.length; k += RESTORE_CHUNK) await api('backup.restoreStage', { table, rows: rows.slice(k, k + RESTORE_CHUNK) });
      }
      setProgress('Aplicando…');
      await api('backup.restoreCommit');
      toast.success('Backup restaurado! Entre novamente.');
      setTimeout(() => window.location.reload(), 800);
    } catch (e) {
      toast.error(e.message);
      setBusy(false);
      setProgress('');
    }
  }

  const days = info.lastBackup ? Math.floor((Date.now() - new Date(info.lastBackup.replace(' ', 'T')).getTime()) / 86400000) : null;
  return (
    <div className="grid grid-2">
      <div className="col" style={{ gap: 16 }}>
        <div className="card">
          <div className="card-header"><Cloud size={17} /><h3>Backup automático</h3></div>
          <div className="card-body col">
            {days == null || days > 2
              ? <div className="alert alert-danger small"><TriangleAlert size={16} /><div>{days == null ? 'Nenhum backup feito ainda.' : `Último backup há ${days} dias.`} O backup automático roda todo dia pelo GitHub. Se ele parou, confira a aba Actions do repositório. Enquanto isso, baixe uma cópia em “Baixar backup”.</div></div>
              : <div className="alert alert-success small"><CircleCheck size={16} /><div>Último backup: <b>{dateTime(info.lastBackup)}</b></div></div>}
            <div className="small muted">Todo dia, de madrugada, uma cópia completa dos dados é guardada no repositório privado do GitHub (pasta <span className="mono">backup</span>, ramo <span className="mono">backups</span>). O histórico do arquivo guarda as cópias de todos os dias.</div>
          </div>
        </div>

        <div className="card">
          <div className="card-header"><h3>Histórico</h3></div>
          {!info.log.length ? <Empty>Nenhum backup registrado.</Empty> : (
            <div className="table-wrap" style={{ maxHeight: 260 }}>
              <table className="table table-compact"><tbody>{info.log.map((l) => (
                <tr key={l.id}><td className="small nowrap">{dateTime(l.created_at)}</td><td className="small">{l.destination}</td><td>{l.status === 'ok' ? <span className="badge badge-success">ok</span> : <span className="badge badge-danger" title={l.message}>erro</span>}</td><td className="small muted">{l.message}</td></tr>
              ))}</tbody></table>
            </div>
          )}
        </div>
      </div>

      <div className="col" style={{ gap: 16 }}>
        <div className="card">
          <div className="card-header"><Download size={17} /><h3>Baixar backup</h3></div>
          <div className="card-body col">
            <div className="small muted">Baixa um arquivo com todos os dados da loja. Guarde-o no computador, no OneDrive ou num pendrive.</div>
            <button className="btn btn-primary btn-lg" disabled={busy} onClick={download}><Download size={18} />{busy && progress ? progress : 'Baixar backup agora'}</button>
          </div>
        </div>

        <div className="card">
          <div className="card-header"><Upload size={17} /><h3>Restaurar backup</h3></div>
          <div className="card-body col">
            <div className="small muted">Substitui todos os dados pelos de um arquivo de backup (baixado aqui ou do GitHub).</div>
            <input ref={fileRef} type="file" accept=".json,application/json" style={{ display: 'none' }} onChange={(e) => { restore(e.target.files[0]); e.target.value = ''; }} />
            <button className="btn" disabled={busy} onClick={() => fileRef.current.click()}><Upload size={16} />{busy && progress ? progress : 'Escolher arquivo…'}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Usuarios() {
  const { user } = useApp();
  const { data, reload } = useLoad('users.list', {}, []);
  const [editing, setEditing] = useState(null);
  const [run, busy] = useAction();
  return (
    <>
      <div className="row mb"><div className="small muted">Vendedores acessam PDV, caixa, vendas, produtos, estoque e clientes. Administradores acessam tudo (financeiro, relatórios, custos e configurações).</div><div className="spacer" /><button className="btn btn-primary" onClick={() => setEditing({ role: 'vendedor', active: true })}><Plus size={16} />Novo usuário</button></div>
      <div className="card" style={{ maxWidth: 900 }}>
        {!data ? <Loading /> : (
          <table className="table">
            <thead><tr><th>Nome</th><th>Usuário</th><th>Perfil</th><th>Situação</th><th>Criado em</th></tr></thead>
            <tbody>{data.map((u) => (
              <tr key={u.id} className={`clickable ${u.active ? '' : 'dim'}`} onClick={() => setEditing({ ...u, active: !!u.active, password: '' })}>
                <td className="strong">{u.name}{u.id === user.id && <span className="badge" style={{ marginLeft: 6 }}>você</span>}</td><td>{u.username}</td>
                <td><span className={`badge ${u.role === 'admin' ? 'badge-primary' : ''}`}>{u.role === 'admin' ? 'Administrador' : 'Vendedor'}</span></td>
                <td>{u.active ? <span className="badge badge-success">Ativo</span> : <span className="badge">Inativo</span>}</td><td>{dateTime(u.created_at)}</td>
              </tr>
            ))}</tbody>
          </table>
        )}
      </div>
      {editing && (
        <Modal title={editing.id ? 'Editar usuário' : 'Novo usuário'} onClose={() => setEditing(null)} size="sm"
          footer={<><button className="btn" onClick={() => setEditing(null)}>Cancelar</button><button className="btn btn-primary" disabled={busy} onClick={async () => { await run(() => api('users.save', editing), 'Usuário salvo!'); setEditing(null); reload(); }}>Salvar</button></>}>
          <div className="col">
            <Field label="Nome"><input className="input" autoFocus value={editing.name || ''} onChange={(e) => setEditing({ ...editing, name: e.target.value })} /></Field>
            <Field label="Usuário (login)"><input className="input" value={editing.username || ''} onChange={(e) => setEditing({ ...editing, username: e.target.value })} /></Field>
            <Field label={editing.id ? 'Nova senha (deixe em branco para manter)' : 'Senha'}><input type="password" className="input" value={editing.password || ''} onChange={(e) => setEditing({ ...editing, password: e.target.value })} /></Field>
            <Field label="Perfil"><select className="select" value={editing.role} onChange={(e) => setEditing({ ...editing, role: e.target.value })}><option value="vendedor">Vendedor</option><option value="admin">Administrador</option></select></Field>
            {editing.id && <label className="checkbox"><input type="checkbox" checked={editing.active} onChange={(e) => setEditing({ ...editing, active: e.target.checked })} />Usuário ativo</label>}
          </div>
        </Modal>
      )}
    </>
  );
}

function Regras() {
  const { s, set, save, busy } = useSettingsForm();
  const keys = ['max_discount_percent_seller', 'card_max_installments', 'credit_max_installments', 'credit_late_fee_percent', 'credit_interest_month_percent', 'credit_block_overdue_days', 'default_min_stock', 'stale_days'];
  const num = (k, label, hint) => <Field label={label} hint={hint} className="c-4"><input type="number" className="input" value={s[k]} onChange={set(k)} /></Field>;
  return (
    <div className="card card-body" style={{ maxWidth: 900 }}>
      <div className="strong mb" style={{ marginBottom: 8 }}>Vendas</div>
      <div className="form-grid mb">
        {num('max_discount_percent_seller', 'Desconto máximo do vendedor (%)', 'Acima disso pede senha do administrador')}
        {num('card_max_installments', 'Máximo de parcelas no cartão')}
      </div>
      <div className="strong mb" style={{ marginBottom: 8 }}>Crediário</div>
      <div className="form-grid mb">
        {num('credit_max_installments', 'Máximo de parcelas')}
        {num('credit_late_fee_percent', 'Multa por atraso (%)')}
        {num('credit_interest_month_percent', 'Juros de mora (% ao mês)')}
        {num('credit_block_overdue_days', 'Bloquear crediário com atraso acima de (dias)', '0 = não bloquear')}
      </div>
      <div className="strong mb" style={{ marginBottom: 8 }}>Estoque</div>
      <div className="form-grid">
        {num('default_min_stock', 'Estoque mínimo padrão (novos produtos)')}
        {num('stale_days', 'Considerar encalhado após (dias sem vender)')}
      </div>
      <div className="row end mt"><button className="btn btn-primary" disabled={busy} onClick={() => save(keys)}><Save size={16} />Salvar</button></div>
    </div>
  );
}

const MESSAGE_VARS = [['{nome}', 'Primeiro nome do cliente'], ['{nome_completo}', 'Nome completo do cliente'], ['{loja}', 'Nome da loja']];

function Aniversarios() {
  const { s, set, save, busy, setS } = useSettingsForm();
  const ref = useRef(null);
  const text = s.birthday_message || '';
  // Insere a variável onde está o cursor
  const insert = (v) => {
    const el = ref.current;
    const a = el ? el.selectionStart : text.length, b = el ? el.selectionEnd : text.length;
    setS({ ...s, birthday_message: text.slice(0, a) + v + text.slice(b) });
    setTimeout(() => { if (el) { el.focus(); el.setSelectionRange(a + v.length, a + v.length); } });
  };
  return (
    <div className="card card-body" style={{ maxWidth: 760 }}>
      <div className="form-grid">
        <Field label="Mensagem de parabéns enviada pelo WhatsApp" className="c-12" hint="Clique numa variável para colocá-la onde está o cursor. Para emojis, use Windows + ponto (.)">
          <textarea ref={ref} className="textarea" rows={5} value={text} onChange={set('birthday_message')} />
        </Field>
        <div className="c-12 chip-list">
          {MESSAGE_VARS.map(([v, label]) => <button key={v} type="button" className="chip" title={label} onClick={() => insert(v)}>{v}<span className="muted small">— {label}</span></button>)}
        </div>
        <div className="c-12">
          <div className="small muted" style={{ marginBottom: 4 }}>Como o cliente vai receber (exemplo: Maria Souza)</div>
          <div className="card card-body" style={{ whiteSpace: 'pre-wrap', background: 'var(--surface-2)' }}>{birthdayMessage({ name: 'Maria Souza' }, s)}</div>
        </div>
        <label className="checkbox c-12"><input type="checkbox" checked={s.birthday_popup === '1'} onChange={set('birthday_popup')} />Avisar os aniversariantes (de hoje e dos próximos 7 dias) na primeira vez que cada usuário entra no sistema no dia</label>
      </div>
      <div className="row end mt">
        <button className="btn" onClick={() => setS({ ...s, birthday_message: DEFAULT_BIRTHDAY_MESSAGE })}>Restaurar mensagem padrão</button>
        <button className="btn btn-primary" disabled={busy} onClick={() => save(['birthday_message', 'birthday_popup'])}><Save size={16} />Salvar</button>
      </div>
    </div>
  );
}

function Senha() {
  const [f, setF] = useState({ current: '', password: '', password2: '' });
  const [run, busy] = useAction();
  const toast = useToast();
  return (
    <div className="card card-body col" style={{ maxWidth: 420 }}>
      <Field label="Senha atual"><input type="password" className="input" value={f.current} onChange={(e) => setF({ ...f, current: e.target.value })} /></Field>
      <Field label="Nova senha"><input type="password" className="input" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} /></Field>
      <Field label="Repita a nova senha"><input type="password" className="input" value={f.password2} onChange={(e) => setF({ ...f, password2: e.target.value })} /></Field>
      <button className="btn btn-primary" disabled={busy} onClick={async () => {
        if (f.password !== f.password2) { toast.error('As senhas não conferem.'); return; }
        await run(() => api('auth.changePassword', f), 'Senha alterada!');
        setF({ current: '', password: '', password2: '' });
      }}>Alterar senha</button>
    </div>
  );
}

export default function Configuracoes() {
  const [params] = useSearchParams();
  const [tab, setTab] = useState(params.get('tab') || 'loja');
  return (
    <>
      <PageHeader title="Configurações" />
      <Tabs value={tab} onChange={setTab} tabs={[
        { id: 'loja', label: 'Dados da loja' }, { id: 'impressora', label: 'Impressora' }, { id: 'backup', label: 'Backup' },
        { id: 'usuarios', label: 'Usuários' }, { id: 'regras', label: 'Regras e limites' }, { id: 'aniversarios', label: 'Aniversários' }, { id: 'senha', label: 'Minha senha' },
      ]} />
      {tab === 'loja' && <Loja />}
      {tab === 'impressora' && <Impressora />}
      {tab === 'backup' && <Backup />}
      {tab === 'usuarios' && <Usuarios />}
      {tab === 'regras' && <Regras />}
      {tab === 'aniversarios' && <Aniversarios />}
      {tab === 'senha' && <Senha />}
    </>
  );
}
