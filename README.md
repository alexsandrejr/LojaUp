<p align="center">
  <img src=".github/assets/social-preview.png" alt="LojaUp — Sistema de gestão para lojas" width="100%">
</p>

<p align="center">
  <a href="LICENSE"><img alt="Licença MIT" src="https://img.shields.io/badge/licen%C3%A7a-MIT-7c3aed?style=for-the-badge"></a>
</p>

<p align="center">
  <img alt="React" src="https://img.shields.io/badge/React-20232A?style=flat-square&logo=react&logoColor=61DAFB">
  <img alt="Node.js" src="https://img.shields.io/badge/Node.js-339933?style=flat-square&logo=nodedotjs&logoColor=white">
  <img alt="PostgreSQL" src="https://img.shields.io/badge/PostgreSQL-4169E1?style=flat-square&logo=postgresql&logoColor=white">
  <img alt="Vercel" src="https://img.shields.io/badge/Vercel-000000?style=flat-square&logo=vercel&logoColor=white">
  <img alt="Supabase" src="https://img.shields.io/badge/Supabase-3FCF8E?style=flat-square&logo=supabase&logoColor=white">
</p>

<p align="center">
  <b>Sistema web de gestão para lojas, para usar no computador e no celular.</b><br>
  Roda de graça na Vercel com o banco de dados no Supabase.
</p>

> **Vai usar o sistema na sua loja?** Comece pelo [**COMECE-AQUI.md**](COMECE-AQUI.md): o Claude prepara
> tudo com você, mesmo sem saber programar.

<p align="center">
  <a href="#-módulos">Módulos</a> ·
  <a href="#-publicar">Publicar</a> ·
  <a href="#-desenvolvimento">Desenvolvimento</a> ·
  <a href="#-licença">Licença</a>
</p>

---

## 🧩 Módulos

| Módulo | O que faz |
|---|---|
| 📊 **Painel do dono** | Resumo do dia/mês, projeção do mês, lucro e uma lista automática de alertas: contas atrasadas, crediário vencido, itens que vão acabar, dinheiro parado em encalhados, grade de tamanhos desequilibrada, perdas de estoque, diferenças de caixa, queda de faturamento, excesso de desconto, aniversariantes, clientes sumidos, backup atrasado. |
| 🛒 **PDV (frente de caixa)** | Leitor de código de barras, busca por nome/cor/tamanho, `3*código` para quantidade, promoções automáticas, desconto por item ou na venda, pagamento dividido (dinheiro, Pix, débito, crédito parcelado, crediário, vale-troca), troco, cupom na impressora térmica (pela impressão do navegador). Atalhos: <kbd>F2</kbd> buscar, <kbd>F4</kbd> cliente, <kbd>F6</kbd> desconto, <kbd>F10</kbd> finalizar, <kbd>Esc</kbd> cancelar. |
| 💵 **Caixa** | Abertura com fundo de troco, sangria, suprimento, fechamento com conferência (esperado × contado), relatório impresso e histórico de diferenças. |
| 🔁 **Vendas e trocas** | Histórico, reimpressão, cancelamento (devolve estoque e estorna), trocas e devoluções com vale-troca, dinheiro, estorno ou abatimento no crediário. |
| 👕 **Produtos** | Cor, tamanho, marca, modelo, categoria; grade cor × tamanho gerada automaticamente; código de barras interno (EAN-13) quando a peça não tem; etiquetas com código de barras (folha A4 ou impressora de etiquetas); margem e markup. |
| 📦 **Estoque** | Estoque por variação, alerta de estoque baixo, entradas/saídas/ajustes com motivo, inventário com leitor de código de barras, histórico completo e auditoria de diferenças/perdas. |
| 🚚 **Compras e fornecedores** | Cadastro de fornecedores, compras com frete e despesas rateadas no custo, custo médio automático, contas a pagar geradas (à vista ou parcelado), comparação de preços entre fornecedores. |
| 💰 **Financeiro** | Contas a pagar (fixas/variáveis, recorrentes) e a receber, fluxo de caixa realizado + previsto, DRE simplificado (lucro bruto e líquido) e ponto de equilíbrio. |
| 🤝 **Clientes e crediário** | Cadastro, histórico de compras, preferências, limite de crédito, parcelas, juros e multa por atraso, recebimento com recibo, carnê, cobrança pelo WhatsApp, análise de inadimplência (aging) e nota de pontualidade do cliente. |
| 📈 **Relatórios** | Faturamento diário/semanal/mensal, lucro por produto, curva ABC, encalhados com sugestão de desconto, sugestão de compra pelo ritmo de vendas, grade de tamanhos (vendas × estoque), vendas por categoria/marca/tamanho/cor/vendedor/pagamento/dia/horário, valor do estoque. |
| ☁️ **Backup** | Automático todo dia (GitHub Actions, num repositório privado) e botão para baixar uma cópia a qualquer hora. Restauração a partir do arquivo. |

**Usuários:** **Administrador** (acesso total) e **Vendedor** (PDV, caixa, vendas, produtos, estoque, clientes — sem custos, financeiro e relatórios). Desconto acima do limite e crediário fora das regras pedem a senha do administrador.

---

## 🚀 Publicar

1. [**COMECE-AQUI.md**](COMECE-AQUI.md): baixa o projeto e cria a sua cópia privada no GitHub, com a ajuda
   do Claude.
2. [**PUBLICAR.md**](PUBLICAR.md): Supabase, Vercel e backup diário, todos no plano grátis.

---

## 🔧 Desenvolvimento

Requisitos: [Node.js](https://nodejs.org) 22 ou superior.

```bash
npm install
```

```bash
npm run dev
```

Abra http://localhost:5173. Em desenvolvimento o banco é o [PGlite](https://pglite.dev) (Postgres que roda
dentro do Node), gravado em `.data/`; não precisa instalar nada. Com a variável `DATABASE_URL`, o sistema
usa um Postgres de verdade (o Supabase).

| Comando | O que faz |
|---|---|
| `npm run dev` | Telas (Vite, porta 5173) e API local (porta 5174), com recarregamento automático |
| `npm test` | Roteiro completo da loja num banco na memória, passando por todas as chamadas da API |
| `npm run seed` | Dados de exemplo no banco local (com o `npm run dev` rodando) |
| `npm run build` | Gera as telas prontas para publicar em `dist/` |

### Estrutura do código

```
api/index.js        função da Vercel (POST /api)
server/             regras de negócio e banco
  db.js             conexão Postgres (Supabase ou PGlite) e migrações
  http.js           requisição HTTP e cookie da sessão
  handler.js        despacha "modulo.acao" numa transação
  session.js        login com sessão em cookie assinado
  api/              auth, products, sales, customers, purchases, finance, reports, backup
src/                telas React
  pages/            telas
  components/       componentes compartilhados
  lib/print.js      cupom, recibo, carnê, vale-troca, fechamento de caixa e etiquetas
scripts/backup.js   backup diário (GitHub Actions)
tests/              testes de ponta a ponta
```

Para evoluir o banco, adicione uma nova entrada no array `MIGRATIONS` em `server/db.js` (nunca altere as
anteriores): a atualização é aplicada sozinha no primeiro acesso depois da publicação, sem perder dados.

---

## 🧾 Observação fiscal

O cupom impresso é **não fiscal**. Para emissão de NFC-e/NF-e é necessário integrar um emissor homologado
(com certificado digital da loja).

---

## 📄 Licença

Baseado no [LojaUp](https://github.com/pixel444-dev/LojaUp) de [@pixel444-dev](https://github.com/pixel444-dev),
distribuído sob a **licença MIT** — veja [`LICENSE`](LICENSE). Esta versão troca o aplicativo desktop
(Electron + SQLite) por um sistema web (Vercel + Supabase).
