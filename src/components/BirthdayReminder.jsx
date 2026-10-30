import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';
import { api } from '../api';
import { useApp } from '../App';
import { Modal } from './ui';
import { birthdayMessage, date, formatPhone, today, whatsappLink } from '../lib/format';

// Aviso de aniversariantes: aparece uma vez por dia para cada usuário, ao entrar no sistema
export default function BirthdayReminder() {
  const { user, settings } = useApp();
  const nav = useNavigate();
  const [data, setData] = useState(null);
  const seenKey = `lojaup.aniversarios.${user.id}`;
  const enabled = settings.birthday_popup === '1';

  useEffect(() => {
    if (!enabled) return;
    let seen = null;
    try { seen = localStorage.getItem(seenKey); } catch (e) { /* ignora */ }
    if (seen === today()) return;
    api('customers.birthdays').then((d) => { if (d.today.length || d.upcoming.length) setData(d); }).catch(() => {});
  }, [seenKey, enabled]);

  if (!data) return null;
  const close = () => {
    try { localStorage.setItem(seenKey, today()); } catch (e) { /* ignora */ }
    setData(null);
  };
  const row = (c, when) => {
    const link = whatsappLink(c.phone, birthdayMessage(c, settings));
    return (
      <div key={c.id} className="row" style={{ padding: '9px 0', borderBottom: '1px solid var(--border)' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="strong">{c.name}</div>
          <div className="small muted">{when} · {c.phone ? formatPhone(c.phone) : 'sem telefone cadastrado'}</div>
        </div>
        {link && <a className="btn btn-sm" href={link} target="_blank" rel="noreferrer"><MessageCircle size={14} />Enviar parabéns</a>}
      </div>
    );
  };

  return (
    <Modal title="🎂 Aniversariantes" onClose={close}
      footer={<>
        <button className="btn" onClick={() => { close(); nav('/clientes?filter=aniversariantes'); }}>Ver todos do mês ({data.month_count})</button>
        <div className="spacer" />
        <button className="btn btn-primary" autoFocus onClick={close}>Fechar</button>
      </>}>
      {data.today.length > 0 && (
        <>
          <div className="strong">Fazem aniversário hoje</div>
          {data.today.map((c) => row(c, `Hoje, ${date(c.birth_date).slice(0, 5)}`))}
        </>
      )}
      {data.upcoming.length > 0 && (
        <>
          <div className="strong" style={{ marginTop: data.today.length ? 18 : 0 }}>Próximos 7 dias</div>
          {data.upcoming.map((c) => row(c, `${date(c.birth_date).slice(0, 5)}, ${c.days_until === 1 ? 'amanhã' : `em ${c.days_until} dias`}`))}
        </>
      )}
      <div className="small muted mt">Este aviso aparece uma vez por dia. A mensagem do WhatsApp pode ser editada em Configurações › Aniversários.</div>
    </Modal>
  );
}
