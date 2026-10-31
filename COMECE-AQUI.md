# Comece aqui: LojaUp no seu computador e na internet

Este roteiro é para o **Samuel**. Você não precisa saber programar: o **Claude** faz os comandos e explica
cada passo. Você só copia os textos indicados aqui, cola no Claude e acompanha.

Ao final você terá:

- o projeto numa pasta do seu computador, aberto no **VS Code**;
- uma cópia **privada** do sistema na sua conta do GitHub (é nela que ficam os backups da loja);
- o sistema funcionando na internet, no celular e no computador.

## O que você precisa ter

- O aplicativo **Claude** instalado no computador, com a sua conta.
- O **VS Code** com a extensão do **Claude**.
- Uma conta no **GitHub** (https://github.com). Se não tiver, crie uma antes de começar (é grátis).

O Claude instala o resto (Git, Node.js e GitHub CLI) e cria o seu repositório no GitHub.

---

## Parte 1: baixar o projeto (no aplicativo Claude)

1. Abra o aplicativo **Claude** e entre no modo que trabalha com arquivos do computador (**Code**). Quando ele
   pedir uma pasta para trabalhar, escolha **Documentos**.

   > Se o seu aplicativo não tiver esse modo, faça a Parte 1 pelo VS Code: abra o VS Code, vá em
   > **File › Open Folder…**, escolha **Documentos** e cole o texto abaixo na extensão do Claude.

2. Copie o texto abaixo inteiro e cole no Claude:

```text
Olá! Sou o Samuel, dono da loja Quintino Imports, e não sei programar. Quero que você deixe pronto no meu
computador Windows o LojaUp, o sistema de gestão da minha loja, fazendo você mesmo todo o trabalho:
instale os programas, crie as pastas, baixe o projeto e crie o meu repositório no GitHub. Só me chame
quando precisar de algo que só eu posso fazer (entrar na minha conta do GitHub no navegador). Fale comigo
em português simples e me conte, em uma frase, o que está fazendo em cada etapa.

Autorizações: você pode instalar com o winget, aceitando os termos de cada programa, o Git (Git.Git), o
Node.js LTS (OpenJS.NodeJS.LTS) e o GitHub CLI (GitHub.cli). Também pode criar o repositório privado
"lojaup" na minha conta do GitHub e enviar o projeto para ele. Para qualquer outra coisa, me pergunte antes.

Se você não conseguir executar comandos no meu computador, me avise logo no início e me guie para eu
fazer cada passo (onde clicar, o que digitar e o que deve aparecer na tela).

Etapas:

1. Programas. Rode git --version, node --version (precisa ser a versão 22 ou mais nova), gh --version e
   code --version. Instale o que faltar com:
   winget install --id <ID> -e --source winget --accept-source-agreements --accept-package-agreements
   Depois de instalar, atualize o PATH da sessão em vez de me pedir para reiniciar (no PowerShell:
   $env:Path = [Environment]::GetEnvironmentVariable('Path','Machine') + ';' + [Environment]::GetEnvironmentVariable('Path','User')).
   Se o comando code não existir, me avise: o VS Code precisa estar instalado.

2. Pasta e cópia do projeto. Crie a pasta %USERPROFILE%\Projetos, se ela não existir, e clone nela o
   repositório https://github.com/alexsandrejr/LojaUp na pasta LojaUp. Se a pasta LojaUp já existir, me pergunte antes
   de mexer nela. Dentro de LojaUp, rode git remote rename origin upstream: é desse repositório do
   Alexsandre que virão as atualizações.

3. Login no GitHub. Rode gh auth status. Se eu não estiver logado, rode em segundo plano
   gh auth login --hostname github.com --git-protocol https --web --scopes workflow
   leia a saída e me mostre o código de 8 caracteres e o endereço https://github.com/login/device. Eu abro
   o endereço, digito o código e autorizo. Espere o comando terminar e confirme com gh auth status. Se eu já
   estiver logado mas a lista "Token scopes" não tiver "workflow", rode gh auth refresh -h github.com
   -s workflow do mesmo jeito (sem essa permissão o GitHub recusa o envio do backup diário). Se esses
   comandos não funcionarem aí, me peça para abrir o Terminal do Windows e rodar gh auth login eu mesmo, me
   dizendo o que escolher em cada pergunta. Depois do login, rode gh auth setup-git.

4. Meu repositório privado. Dentro de LojaUp, rode:
   gh repo create lojaup --private --source . --remote origin --push
   Ele precisa ser privado: o backup diário vai guardar nele os dados dos meus clientes. Se já existir um
   repositório "lojaup" na minha conta, me pergunte o que fazer. Confirme com
   gh repo view --json visibility,url
   que a visibilidade é PRIVATE e me diga o endereço.

5. Teste. Rode npm install e depois npm test. Todos os testes precisam passar. Se algum falhar, me mostre
   a mensagem e pare.

6. VS Code. Abra a pasta do projeto no VS Code: code "%USERPROFILE%\Projetos\LojaUp"

Senhas: eu digito as minhas senhas só no navegador ou nas janelas de login. Você não precisa delas.

No final, me diga em poucas linhas: onde ficou a pasta do projeto, o endereço do meu repositório privado,
que os testes passaram e que o próximo passo é colar o segundo texto do COMECE-AQUI.md no Claude, dentro do
VS Code.
```

3. Acompanhe. O Claude faz tudo sozinho. A única hora em que ele vai te chamar é para entrar na sua conta
   do GitHub: ele mostra um código de 8 letras; você abre https://github.com/login/device no navegador,
   digita o código e clica em **Authorize**.

A Parte 1 terminou quando o VS Code abrir com a pasta **LojaUp** e o Claude disser que os testes passaram.

## Parte 2: colocar no ar (no VS Code)

1. No VS Code, com a pasta **LojaUp** aberta, abra a extensão do **Claude**.
2. Copie e cole:

```text
Olá! Sou o Samuel. Terminei a preparação do LojaUp no aplicativo Claude e agora quero colocar o sistema
no ar. Leia o CLAUDE.md e o PUBLICAR.md antes de começar.

1. Primeiro confira se a preparação ficou completa: git remote -v deve mostrar "origin" (meu repositório
   privado) e "upstream" (repositório do Alexsandre), e npm test deve passar. Se faltar algo, termine
   comigo seguindo a Parte 1 do COMECE-AQUI.md.
2. Depois me guie pelo PUBLICAR.md a partir da etapa 2 (Supabase), depois a Vercel, o backup diário no
   GitHub e o primeiro acesso ao sistema.

Um passo por vez: espere eu confirmar cada etapa antes de seguir. As senhas e o endereço do banco eu
mesmo colo direto nos sites; só me mostre onde.
```

3. O Claude vai te guiar pelo **Supabase** (banco de dados), pela **Vercel** (o site) e pelo **backup diário**
   no GitHub. O passo a passo completo, se quiser ler junto, está no [PUBLICAR.md](PUBLICAR.md).

> **Senhas:** a senha do banco e o endereço de conexão (`DATABASE_URL`) são como a chave da loja. Cole
> esses dados **você mesmo**, direto nos sites (Supabase, Vercel e GitHub), onde o Claude indicar. Não
> precisa mandar para o Claude nem para ninguém.

## Depois, no dia a dia

- **Usar o sistema:** abra o endereço da Vercel (algo como `https://lojaup-seunome.vercel.app`) no
  navegador. No celular, use **Adicionar à tela inicial** para ficar com um ícone de aplicativo.
- **Receber uma atualização do Alexsandre:** abra a pasta no VS Code e peça ao Claude:
  *"Atualize o LojaUp com a versão nova do Alexsandre."*
- **Dúvidas ou problemas:** peça ao Claude no VS Code. Ele conhece o projeto pelo `CLAUDE.md`.
