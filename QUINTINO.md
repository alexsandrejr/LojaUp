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

## Alterações já feitas

Em 29/10/2026. **Ainda não estão no git** (nenhum commit feito).

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

Requisitos neste PC:

- Node.js 22 ou superior (instalado: 24.20).
- Não precisa de compilador C++: o `better-sqlite3` 13 já traz o binário pronto para Windows
  (`prebuilds/win32-x64.node`, N-API), e ele funciona no Electron.

```bash
npm install
```

```bash
npm run dev
```

**Atenção ao rodar pelo terminal do VS Code:** ele define `ELECTRON_RUN_AS_NODE=1`, e com isso o app
quebra ao abrir (`Cannot read properties of undefined (reading 'setPath')` em `electron/main.js`). Nesse
terminal, rode assim:

```bash
env -u ELECTRON_RUN_AS_NODE npm run dev
```

No PowerShell: `Remove-Item Env:ELECTRON_RUN_AS_NODE; npm run dev`. Num terminal comum do Windows,
`npm run dev` funciona direto.

Mudanças nas telas (`src/`) aparecem na hora. Mudanças em `electron/` só valem depois de fechar e abrir o
app de novo.

`npm run dev` abre o app com recarregamento automático (F12 abre o DevTools). No primeiro uso ele pede o
nome da loja e cria o usuário administrador.

Outros comandos:

- `npm start`: gera o build das telas e abre o app sem o servidor de desenvolvimento.
- `npm run dist`: gera o instalador em `release/LojaUp Setup 1.0.0.exe`.

Onde ficam os dados:

- Desenvolvimento: `%APPDATA%\LojaUp-dev\dados\loja.db`
- Instalado: `%APPDATA%\LojaUp\dados\loja.db`

Para começar do zero durante os testes, feche o app e apague a pasta `%APPDATA%\LojaUp-dev`.

## Mapa do código

```
electron/main.js        janela, IPC, impressão, backup agendado
electron/db.js          SQLite e migrações (adicione novas entradas em MIGRATIONS; nunca altere as antigas)
electron/api/           regras de negócio: auth, products, sales, customers, purchases, finance, reports, backup
src/pages/              telas React (PDV, Vendas, Compras, Estoque, Financeiro, Relatórios, Configurações...)
src/components/ui.jsx   componentes compartilhados
src/lib/print.js        cupom, recibo, carnê, etiquetas
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

- Fazer o commit das alterações acima.
- Continuar o roteiro de teste.
- Atacar as lacunas da seção "O que falta adaptar". Nenhuma delas foi feita ainda.
