# Como colocar o LojaUp no ar

Este guia publica o sistema na internet, de graça, para usar no celular e no computador. São três contas:

| Serviço | Para quê | Plano |
|---|---|---|
| **GitHub** | Guarda o código e os backups diários | Grátis |
| **Supabase** | Banco de dados (onde ficam vendas, produtos, clientes...) | Grátis |
| **Vercel** | Deixa o sistema acessível num endereço da internet | Grátis (Hobby) |

Leva uns 30 minutos. Faça na ordem.

> **Guarde bem a senha do banco e o endereço de conexão.** Quem tiver esse endereço tem acesso a todos os
> dados da loja. Nunca mande por WhatsApp nem coloque em arquivos do projeto.

---

## 1. GitHub: o repositório

O repositório com o código precisa estar na sua conta do GitHub e ser **privado** (os backups ficam nele).

1. Entre em https://github.com e confira se o repositório do LojaUp aparece na sua conta.
2. Abra o repositório › **Settings** › em *Danger Zone*, confira que a visibilidade é **Private**.

## 2. Supabase: o banco de dados

1. Entre em https://supabase.com e crie a conta (dá para entrar com o GitHub).
2. Clique em **New project**:
   - **Name**: `lojaup`
   - **Database Password**: clique em *Generate a password* e **copie a senha** para um lugar seguro
     (um gerenciador de senhas ou um papel guardado). Ela não aparece de novo.
   - **Region**: **South America (São Paulo)**. Isso deixa o sistema mais rápido.
3. Clique em **Create new project** e espere uns 2 minutos até o projeto ficar pronto.
4. No topo da página do projeto, clique em **Connect**.
5. Na parte **Connection string**, escolha **Transaction pooler** (porta **6543**) e copie o endereço. Ele
   tem este formato:

   ```
   postgresql://postgres.abcdefghij:[YOUR-PASSWORD]@aws-0-sa-east-1.pooler.supabase.com:6543/postgres
   ```

6. Troque `[YOUR-PASSWORD]` (inclusive os colchetes) pela senha do passo 2. Esse é o seu **DATABASE_URL**.

   Se a senha tiver símbolos como `@`, `#`, `/` ou `%`, gere outra só com letras e números
   (Project Settings › Database › *Reset database password*) para evitar erro no endereço.

Não precisa criar tabelas: o sistema cria tudo sozinho no primeiro acesso.

## 3. Vercel: o site

1. Entre em https://vercel.com e crie a conta **com o GitHub** (*Continue with GitHub*). Escolha o plano
   **Hobby**.
2. Clique em **Add New…** › **Project** e, na lista, clique em **Import** ao lado do repositório do
   LojaUp. Se ele não aparecer, clique em *Adjust GitHub App Permissions* e libere o repositório.
3. Na tela de configuração:
   - **Framework Preset**: deixe **Vite** (a Vercel reconhece sozinha).
   - Abra **Environment Variables** e adicione:
     - **Key**: `DATABASE_URL`
     - **Value**: o endereço do passo 2.6
4. Clique em **Deploy** e espere terminar (1 a 2 minutos).
5. Clique em **Continue to Dashboard** e depois em **Visit**. O endereço é algo como
   `https://lojaup-seunome.vercel.app`.

### Primeiro acesso

Na primeira vez o sistema pede o **nome da loja** e cria o **usuário administrador** (nome de usuário e
senha). Use uma senha forte: o sistema fica na internet. Depois de 5 senhas erradas seguidas, o login fica
bloqueado por 15 minutos.

Em seguida, em **Configurações**, preencha os dados da loja e crie os vendedores, se houver.

### No celular

Abra o endereço no navegador do celular e use **Adicionar à tela inicial** (no Chrome: menu ⋮; no iPhone:
botão de compartilhar). Fica com um ícone igual a um aplicativo.

## 4. Backup diário automático

Todo dia, às 3h da manhã, o GitHub copia todos os dados para o repositório. Para ligar:

1. No GitHub, abra o repositório › **Settings** › **Secrets and variables** › **Actions**.
2. Clique em **New repository secret**:
   - **Name**: `DATABASE_URL`
   - **Secret**: o mesmo endereço do passo 2.6
3. Vá na aba **Actions** do repositório. Se aparecer um aviso pedindo para habilitar os workflows, clique
   para habilitar.
4. Clique em **Backup diário** › **Run workflow** › **Run workflow** para testar agora.
5. Em 1 ou 2 minutos deve aparecer um ✅. No sistema, em **Configurações › Backup**, o "Último backup"
   passa a mostrar a data de hoje.

O backup fica no ramo **backups**, arquivo `backup/lojaup-backup.json`. Cada dia é uma versão nova do
arquivo: o histórico dele guarda todos os dias.

Além do automático, em **Configurações › Backup › Baixar backup** você baixa uma cópia na hora, para
guardar no computador ou num pendrive.

> O backup diário também mantém o Supabase "acordado". No plano grátis, um projeto parado por 7 dias é
> pausado. Se isso acontecer, entre no Supabase e clique em **Restore project**.

### Restaurar um backup

1. Pegue o arquivo:
   - **Baixado pelo sistema**: já está no seu computador.
   - **Do GitHub**: abra o repositório, troque o ramo de `main` para `backups`, abra
     `backup/lojaup-backup.json` e clique no botão de download (*Download raw file*). Para um dia
     anterior, clique em **History**, escolha o dia e baixe o arquivo daquela versão.
2. No sistema, **Configurações › Backup › Restaurar backup › Escolher arquivo…**
3. Confirme. **Todos os dados atuais são substituídos** pelos do arquivo. Depois, entre de novo.

## 5. Impressora térmica (opcional)

Veja **Configurações › Impressora** no sistema. Lá está o passo a passo para o Chrome do computador da
loja imprimir o cupom direto na térmica, sem abrir a janela de impressão.

## Atualizações

Quando houver uma melhoria no código, ela é enviada para o ramo `main` do GitHub e a Vercel publica a nova
versão sozinha em 1 ou 2 minutos. Se a atualização mudar o banco de dados, o sistema ajusta as tabelas no
primeiro acesso, sem perder dados.

## Se algo der errado

| Sintoma | O que fazer |
|---|---|
| "Servidor sem banco de dados" | Falta a variável `DATABASE_URL` na Vercel (Settings › Environment Variables). Depois de adicionar, vá em **Deployments** › ⋯ no último › **Redeploy**. |
| "Erro inesperado" com *password authentication failed* | A senha no `DATABASE_URL` está errada. Corrija na Vercel e faça o Redeploy. |
| O sistema demora ou não abre depois de dias sem uso | O Supabase pode ter pausado o projeto. Entre no Supabase e clique em **Restore project**. |
| O backup diário mostra ❌ no GitHub | Confira o secret `DATABASE_URL` (passo 4). Clique no ❌ para ver a mensagem de erro. |
| Esqueci a senha do administrador | Se houver outro administrador, ele troca em Configurações › Usuários. Se não houver, peça ajuda a quem mantém o sistema. |

## Limites do plano grátis

São folgados para uma loja: o banco do Supabase tem 500 MB (anos de vendas) e a Vercel aceita 1 milhão
de acessos à API por mês. Pelos termos, o plano Hobby da Vercel é para uso pessoal e não comercial. Se um
dia for preciso trocar, os dados continuam no Supabase e o site pode ser publicado em outro serviço com
pequenas adaptações.
