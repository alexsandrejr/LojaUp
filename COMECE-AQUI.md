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

O Claude instala o resto (Git e Node.js), sempre pedindo sua permissão antes.

---

## Parte 1: baixar o projeto (no aplicativo Claude)

1. Abra o aplicativo **Claude** e entre no modo que trabalha com arquivos do computador (**Code**). Quando ele
   pedir uma pasta para trabalhar, escolha **Documentos**.

   > Se o seu aplicativo não tiver esse modo, faça a Parte 1 pelo VS Code: abra o VS Code, vá em
   > **File › Open Folder…**, escolha **Documentos** e cole o texto abaixo na extensão do Claude.

2. Copie o texto abaixo inteiro e cole no Claude:

```text
Olá! Sou o Samuel, dono da loja Quintino Imports, e não sei programar. Quero preparar no meu computador
Windows o LojaUp, o sistema de gestão da loja, para depois publicá-lo na internet com a sua ajuda pelo
VS Code. Me guie um passo por vez, em português simples, e peça minha confirmação antes de instalar
programas, criar pastas ou enviar algo para a internet.

Se você não conseguir executar comandos no meu computador, me diga isso logo no início e me guie para
eu mesmo fazer cada passo (onde clicar, o que digitar e o que deve aparecer na tela).

Faça nesta ordem:

1. Confira se o Git, o Node.js (versão 22 ou mais nova) e o comando "code" do VS Code estão instalados
   (git --version, node --version, code --version). Se faltar o Git ou o Node.js, me peça permissão e
   instale com o winget (Git.Git e OpenJS.NodeJS.LTS). Se depois de instalar o comando ainda não for
   encontrado, me explique como fechar e abrir você de novo e continuamos de onde paramos.
2. Crie a pasta Projetos dentro da minha pasta de usuário (%USERPROFILE%\Projetos) e clone nela o
   repositório ENDERECO_DO_REPOSITORIO, na pasta LojaUp.
3. Dentro da pasta LojaUp, renomeie o remoto "origin" para "upstream" (git remote rename origin upstream).
   É de lá que virão as atualizações do Alexsandre.
4. Me ensine a criar um repositório vazio e PRIVADO na minha conta do GitHub, em https://github.com/new:
   nome "lojaup", visibilidade "Private", sem README, sem .gitignore e sem licença. O repositório precisa
   ser privado porque o backup diário vai guardar nele os dados dos meus clientes. Espere eu te passar o
   endereço do repositório criado.
5. Adicione esse endereço como remoto "origin" e envie o ramo main (git push -u origin main). Se abrir uma
   janela de login do GitHub, me avise que sou eu que entro nela com a minha conta.
6. Confira comigo no GitHub que o repositório aparece como "Private" e tem os arquivos.
7. Rode npm install e depois npm test. Todos os testes precisam passar. Se algum falhar, me mostre a
   mensagem e pare.
8. Abra a pasta do projeto no VS Code (code "%USERPROFILE%\Projetos\LojaUp").

Senhas: sou eu que digito as minhas senhas, direto nos sites ou nas janelas de login. Não me peça para
colar senhas aqui no chat.

No final, me diga em poucas linhas o que ficou pronto e que o próximo passo é abrir o Claude no VS Code.
```

3. Siga o que o Claude pedir. Nos sites (GitHub) é **você** quem clica e faz login. O Claude mostra onde.

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
