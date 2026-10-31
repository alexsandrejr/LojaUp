# LojaUp para a Quintino Imports

Notas de avaliação do [LojaUp](https://github.com/pixel444-dev/LojaUp) como substituto da planilha
`Quintino_Imports_Planilha_Completa_Recriada.xlsx`. As alterações feitas no código estão listadas em
[Alterações já feitas](#alterações-já-feitas).

## A loja

- Loja física de importados, focada em relógios e smartwatches.
- Compra em lojas do exterior (AliExpress e similares), em pequenos lotes. Não importa em contêiner e não
  emite nota fiscal.
- Quando o pedido chega: anota o preço pago, soma frete e imposto de importação (Remessa Conforme, quando
  houver) ao custo do produto e define o preço de venda.
- Vende na loja e entrega por bairro (às vezes para outras cidades). Aceita Pix, débito, dinheiro e crédito
  de 1x a 12x sem juros na maquininha.
- O lucro é dividido: **30% para o dono, 70% fica na loja** (percentuais ajustáveis).

## Como a planilha funciona hoje

| Aba | Função |
|---|---|
| Config | Divisão do lucro (30/70), taxa padrão do cartão, frete total e valor total do lote de compra |
| Estoque | Código, produto, cor, qtd. inicial, custo de compra, frete rateado, custo real, qtd. vendida e estoque atual |
| Vendas | Uma linha por produto vendido: cliente, forma de pagamento, valor, entrega cobrada/paga, taxa da maquininha, lucro, margem, divisão 30/70, bairro, status do pagamento e da entrega |
| Despesas | Despesas gerais (data, descrição, categoria, valor) |
| Taxas por Bairro | Quanto se cobra do cliente e quanto se paga ao entregador por bairro |
| Precificação | Preço mínimo = (custo + entrega + lucro desejado) ÷ (1 − taxa de pagamento) |
| Calculadora Maquininha | Taxa real = valor da venda − valor que caiu na conta |
| Painel / Resumo | Faturamento, lucro líquido, pedidos não pagos, em rota, entregues, estoque |

Regras de cálculo principais:

- **Frete rateado por item** = custo do item × frete total ÷ valor total do lote (proporcional ao preço).
- **Taxa do cartão** = total da venda − valor líquido recebido. Se o líquido não foi informado, usa a taxa
  padrão da aba Config (só para crédito).
- **Lucro líquido da venda** = total − custo real × qtd − entrega paga pela loja − taxa do cartão.
- **Lucro após despesas** = soma dos lucros das vendas − despesas gerais. Esse valor é dividido 30/70.

### Problemas encontrados na planilha

1. O estoque é baixado pelo **nome** do produto, não pela variação (cor). Uma venda de "S11 Pro" baixa as
   duas cores ao mesmo tempo: as duas ficam com −1 e o painel mostra 0 unidades, quando o certo é 2.
2. O rateio do frete usa os totais de um único lote (aba Config). Uma segunda compra quebra o cálculo.
   As fórmulas também têm o custo digitado direto (`84*...`) em vez de referenciar a célula.
3. Não há campo para o **imposto de importação**.
4. "Taxas por Bairro" não alimenta as vendas; a lista "StatusRecebimento" não é usada; a coluna
   "Reposição" é multiplicada por zero.
5. Só cabe um produto por linha de venda.

## O que o LojaUp já cobre

| Necessidade | No LojaUp |
|---|---|
| Custo real com frete rateado | Compras com `freight` e `other_costs` rateados proporcionalmente ao valor de cada item (`electron/api/purchases.js`), gerando `landed_unit_cost` e custo médio ponderado |
| Estoque por cor | Produtos com variações (cor/tamanho) e movimentações de estoque por variação |
| Vendas com vários itens e formas de pagamento | PDV com carrinho e pagamento dividido (dinheiro, Pix, débito, crédito com parcelas, crediário, vale) |
| Despesas | Financeiro: contas a pagar fixas/variáveis/recorrentes, fluxo de caixa |
| Lucro | DRE simplificado, lucro por produto, curva ABC |
| Dados locais | Electron + SQLite, offline, backup automático (OneDrive/pendrive) |

## O que falta adaptar (lacunas)

1. **Imposto de importação** como campo próprio na compra (por enquanto pode ir em "outros custos").
2. **Taxa real da maquininha**: informar o valor líquido recebido e calcular a taxa e a % efetiva por venda.
   Hoje `sale_payments` guarda método, valor e parcelas, mas não o líquido.
3. **Entrega**: taxa por bairro (cobrada × paga ao entregador), bairro na venda e status da entrega
   (aguardando envio, em rota, entregue, retirada, cancelado).
4. **Status do pagamento** e data prevista de recebimento (cartão parcelado).
5. **Divisão do lucro 30/70** configurável, no painel e nos relatórios.
6. **Calculadora de preço** usando o custo real do produto.
7. Ajustes de texto: o projeto foi feito para loja de roupas (grade cor × tamanho, trocas etc.).

## Migração para web (Vercel + Supabase)

Decidido em 30/10/2026. O sistema deixa de ser desktop (Electron) e vira um site, para o Samuel usar no
celular e no computador, de qualquer lugar. **Não haverá mais versão desktop.**

Decisões:

- **Vercel** (telas + API) e **Supabase** (banco Postgres, região São Paulo), nos planos grátis.
  O Hobby da Vercel é, pelos termos, só para uso não comercial. O risco é baixo (sistema privado, um
  usuário, pouco uso) e os dados ficam no Supabase: se a Vercel bloquear, só as telas saem do ar e dá para
  publicá-las na Cloudflare Pages. Por isso o código não deve depender de nada específico da Vercel.
- Turso + Cloudflare foi descartado: limite de 10 ms de CPU e 50 chamadas externas por requisição no plano
  grátis da Cloudflare, e o Turso foi comprado pelo Supabase em 02/10/2026.
- A transformação inteira é feita aqui. O Samuel só cria as contas, cola as variáveis de ambiente e publica,
  seguindo o `PUBLICAR.md` (escrito na fase 9). Antes de entregar, fazer uma publicação de teste em contas
  próprias para validar o guia.
- Desenvolvimento e testes usam **PGlite** (Postgres que roda dentro do Node, sem instalar nada). Sem a
  variável de conexão, o sistema usa o PGlite local; com ela, usa o Supabase.
- Login continua por **nome de usuário**, com sessão por acesso (cookie) e bloqueio após senhas erradas.
- **Backup**: diário pelo GitHub Actions, guardado no repositório privado (isso também impede o Supabase de
  pausar por inatividade), mais os botões "Baixar backup" e "Restaurar backup".
- **Impressão** pelo navegador. Hoje o Samuel não usa impressora térmica, mas vai usar: manter os modelos de
  80/58 mm e documentar como o Chrome imprime direto sem perguntar.
- Repositório: privado no GitHub. No fim, transferir para a conta do Samuel ou adicioná-lo como colaborador.
- Fora do escopo por enquanto: catálogo de produtos, fotos e as lacunas listadas acima.

Como fica:

```
Celular / PC ──► Vercel ──► telas React
                       └──► /api (uma função Node com as regras de negócio)
                                  └──► Supabase Postgres (São Paulo)
```

A camada de banco imita a interface atual do `better-sqlite3` (`prepare(sql).get/all/run` e transações),
só que assíncrona. Assim os módulos da API mudam pouco: ganham `await` e ajustes de SQL.

Fases (marcar ao concluir, com commit ao fim de cada uma):

- [ ] 0. Repositório privado no GitHub e troca da origem (hoje aponta para `pixel444-dev/LojaUp`)
- [x] 1. Tirar o Electron: entrada `api/` para a Vercel e servidor local para desenvolvimento
- [x] 2. Camada de banco compatível, esquema Postgres, `npm run migrate`, RLS ligado em todas as tabelas
- [x] 3. Portar os módulos da API para Postgres e fixar o fuso `America/Sao_Paulo`
- [x] 4. Login com sessão em cookie, expiração e bloqueio por tentativas
- [ ] 5. Impressão pelo navegador
- [ ] 6. Backup: GitHub Actions diário + baixar/restaurar em Configurações
- [x] 7. Teste automático do roteiro (custo com frete, vendas, estoque, caixa, crediário, trocas)
- [ ] 8. Layout para celular (menu, tabelas, formulários; PDV, Produtos, Estoque, Painel, Clientes)
- [ ] 9. `PUBLICAR.md`, publicação de teste e entrega ao Samuel

## Alterações já feitas

Em 29/10/2026, no commit `cc52b4a`.

1. **Alinhamento das tabelas** (`src/styles.css`): os títulos das colunas numéricas ficavam à esquerda e os
   valores à direita, porque `.table th { text-align: left }` vinha depois de `th.num` no CSS e ganhava.
   Adicionada a regra `.table th.num { text-align: right; }`. Vale para todas as tabelas do sistema.
2. **Aviso diário de aniversariantes** (`src/components/BirthdayReminder.jsx`, consulta
   `customers.birthdays` em `electron/api/customers.js`): na primeira entrada do dia de cada usuário
   (admin ou vendedor), uma janela mostra quem faz aniversário hoje e nos próximos 7 dias, com botão de
   WhatsApp e um atalho para os aniversariantes do mês. O "já visto hoje" fica no `localStorage` de cada
   computador. Pode ser desligado em Configurações › Aniversários.
   Antes, o único aviso ficava no Painel (só o admin vê) e cobria só os próximos 7 dias.
3. **Mensagem de parabéns editável** (Configurações › Aniversários): texto com as variáveis `{nome}`,
   `{nome_completo}` e `{loja}`, com prévia e botão para restaurar o padrão. Ficou guardada nas
   configurações `birthday_message` e `birthday_popup` (`electron/api/util.js`). O texto padrão está
   repetido em `src/lib/format.js` (`DEFAULT_BIRTHDAY_MESSAGE`): se mudar um, mude o outro.
4. **WhatsApp na lista "Aniversariantes do mês"** (`src/pages/Clientes.jsx`): um ícone ao lado da data,
   para mandar parabéns a quem já fez aniversário no mês e não entrou no aviso.

Testado: a consulta de aniversariantes numa cópia do banco, o preenchimento da mensagem e o build. Ainda
falta conferir na tela a janela de aviso e a aba Aniversários.

## Avisos sobre o projeto

- O repositório foi publicado em 27/10/2026 com **um único commit** e quase nenhum uso público. Não há
  histórico de correções, então é preciso testar bem antes de colocar os dados reais da loja.
- Licença MIT: pode modificar e redistribuir, mantendo o arquivo `LICENSE`.

## Como rodar

Requisito: Node.js 22 ou superior (instalado neste PC: 24.20).

```bash
npm install
```

```bash
npm run dev
```

Depois abra http://localhost:5173 no navegador. O comando sobe dois servidores: o Vite (telas, porta 5173)
e a API local (`server/dev.js`, porta 5174). O Vite repassa as chamadas de `/api` para a API. Mudanças nas
telas aparecem na hora, e a API reinicia sozinha quando um arquivo de `server/` muda.

No primeiro uso o sistema pede o nome da loja e cria o usuário administrador.

Sem a variável `DATABASE_URL`, o sistema usa o PGlite (um Postgres que roda dentro do Node) e grava os
dados em `.data/pglite` (fora do git). Para começar do zero, pare o `npm run dev` e apague a pasta `.data`.
Para usar um Postgres de verdade (por exemplo o Supabase), defina `DATABASE_URL` antes de rodar.

As tabelas são criadas e atualizadas sozinhas na primeira chamada à API (migrações em `server/db.js`).

Outros comandos:

- `npm test`: roda o roteiro completo da loja num banco na memória (`tests/roteiro.test.js`) e confere as
  contas principais. Também falha se alguma chamada da API ficar sem teste.
- `npm run build`: gera as telas prontas para publicar em `dist/`.

## Mapa do código

```
api/index.js            função da Vercel (POST /api)
server/http.js          recebe POST /api, lê e renova o cookie da sessão
server/handler.js       despacha as chamadas "modulo.acao" numa transação; bloqueio por senha errada
server/session.js       sessão em cookie assinado (7 dias, renovada a cada uso)
server/dev.js           servidor local de desenvolvimento (POST /api)
server/db.js            banco Postgres (Supabase ou PGlite) e migrações (adicione novas entradas em MIGRATIONS;
                        depois da primeira publicação, nunca altere as antigas)
server/api/             regras de negócio: auth, products, sales, customers, purchases, finance, reports, backup
src/api.js              chamada à API pelas telas
src/pages/              telas React (PDV, Vendas, Compras, Estoque, Financeiro, Relatórios, Configurações...)
src/components/ui.jsx   componentes compartilhados
src/lib/print.js        cupom, recibo, carnê, etiquetas
tests/                  roteiro da loja (todas as chamadas da API) e sessão/login
```

## Roteiro de teste sugerido

1. Criar a loja e o administrador.
2. Cadastrar os produtos da planilha com variações de cor (S11 Pro prata/preto, S11 Mini prata/dourado,
   Wearzone Dune).
3. Lançar uma compra com os itens a R$ 84 / R$ 84 / R$ 85 / R$ 85 / R$ 319 e frete de R$ 55. Conferir se o
   custo real bate com a planilha (S11 Pro ≈ R$ 91,03; Wearzone Dune ≈ R$ 345,70).
4. Lançar as três vendas da planilha (uma em Pix, duas no crédito 12x) e conferir estoque e lucro.
5. Lançar uma despesa e ver o DRE.
6. Aniversários: entrar no sistema e ver se a janela de aviso aparece (o cliente de teste "weresflistons"
   faz aniversário em 31/10). Editar a mensagem em Configurações › Aniversários e conferir o texto que
   chega ao WhatsApp.

## Próximos passos

- Seguir as fases da [migração para web](#migração-para-web-vercel--supabase).
- As lacunas da seção "O que falta adaptar" ficam para depois da migração.
