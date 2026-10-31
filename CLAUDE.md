# LojaUp

Sistema web de gestão da loja Quintino Imports (relógios e smartwatches): telas React (Vite) e uma API Node
em `api/index.js` + `server/`, publicadas na Vercel, com banco Postgres no Supabase. Visão geral e comandos
no `README.md`.

## Com quem você fala

Quem usa este projeto é o **Samuel**, dono da loja. Ele **não programa**. Fale em português simples, sem
jargão, como um **guia** ao lado dele:

- Um passo por vez. Diga o que vai fazer e por quê, em uma frase, e espere a confirmação dele antes de
  instalar programas, criar ou apagar arquivos, ou enviar algo ao GitHub.
- Quando o passo depender dele (clicar num site, fazer login, colar uma senha), descreva exatamente onde
  clicar e o que deve aparecer na tela. Peça que ele conte o que viu antes de seguir.
- Termine cada etapa dizendo o que ficou pronto e qual é a próxima.

## Tarefas comuns

| O Samuel pede | Siga |
|---|---|
| Publicar / colocar no ar / configurar Supabase, Vercel ou backup | `PUBLICAR.md`, na ordem, conferindo cada etapa com ele |
| Preparar o computador / baixar o projeto | `COMECE-AQUI.md` |
| Atualizar o sistema com a versão nova do Alexsandre | seção "Atualizar" abaixo |
| Testar no computador antes de publicar | `npm run dev`, abrir http://localhost:5173 |

## Senhas e dados da loja

- O endereço de conexão do banco (`DATABASE_URL`) dá acesso a todos os dados. O próprio Samuel cola esse
  endereço e as senhas direto nos sites (Supabase, Vercel, GitHub); você mostra onde colar. Ele fica só nesses
  sites e na variável de ambiente, fora de arquivos do projeto, commits e mensagens do chat.
- O repositório do Samuel (`origin`) é **privado**: o ramo `backups` guarda dados de clientes (nomes,
  telefones, CPF). Mantenha-o privado.

## Repositórios

- `origin`: cópia privada do Samuel. A Vercel publica sozinha cada push no `main`.
- `upstream`: repositório público do Alexsandre, de onde vêm as atualizações.

### Atualizar

1. `git fetch upstream`, depois `git merge upstream/main`.
2. `npm install` e `npm test`. Siga só com o teste **verde**; se falhar, explique ao Samuel e peça ajuda ao
   Alexsandre.
3. `git push origin main`. Em 1 ou 2 minutos a Vercel publica.

## Regras do código

- Banco: novas mudanças de tabela entram como **novo item** no array `MIGRATIONS` de `server/db.js`. Os itens
  existentes já rodaram no banco de produção e ficam como estão.
- `npm test` passa por todas as chamadas da API (`tests/`). Rode antes de qualquer push.
- Notas do projeto, decisões e pendências: `QUINTINO.md`.
