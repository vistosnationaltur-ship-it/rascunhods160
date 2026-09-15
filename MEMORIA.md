# MEMÓRIA — Rascunho DS160

Log de sessões de trabalho. Mais recente no topo. Cada entrada: o que mudou,
onde no código, e o porquê quando não é óbvio.

---

## 2026-09-15 — Mês vira lista fixa nos campos de data (bug do robô)

- Gatilho: robô de automação (`Automação_DS160/fonte_dados_api.py`) travou
  buscando os dados do cliente Enzo Bordini Garutti — `data_nasc.split("/")`
  esperava 3 partes e achou 2. Causa: o campo "Data de nascimento" (único
  campo de data do schema **sem** sub-campos Dia/Mês/Ano — é uma caixa de
  texto única) tinha `"01/022003"` salvo (faltando uma barra), digitado à
  mão por alguém mexendo direto no cadastro do cliente.
- Investigando mais, achei um segundo problema do mesmo tipo no mesmo
  cliente: "Data Prevista da Viagem aos EUA" (que JÁ tem sub-campos Dia/
  Mês/Ano) tinha `"Janeiro "` (com espaço sobrando) no sub-campo Mês — que
  também é texto livre. Não travava o robô (só o campo de nascimento faz
  isso), mas passava dado errado silenciosamente.
- **Causa raiz comum:** todo sub-campo de data (inclusive "Mês") é um
  `<input type="text">` sem máscara em `CampoRenderer.tsx` — dá pra digitar
  qualquer coisa.
- **Correções:**
  - `src/components/preencher/CampoRenderer.tsx`: separado o `case "date"`
    do `case "address"` (antes compartilhavam o mesmo bloco). Sub-campo
    "Mês" (detectado pelo rótulo) agora é `<select>` com os 12 nomes em
    português — impossível digitar errado a partir de agora. Dia/Ano viram
    `inputMode="numeric"`.
  - `src/app/api/robo-integracao/clientes/[id]/route.ts`
    (`normalizarData`): campo de data **sem** sub-campos (só "Data de
    nascimento" se encaixa nisso hoje) devolvia o valor bruto sem validar
    quando não batia com `DDMMAAAA` (8 dígitos) — agora devolve `""`, mesmo
    comportamento que o caminho com sub-campos já tinha. Leitura dos
    sub-campos ganhou `.trim()` (cobre respostas antigas tipo "Janeiro "
    com espaço sobrando).
  - `Automação_DS160/fonte_dados_api.py`: duplicada a função
    `mes_para_numero()` que já existia em `robo.py` (criada numa sessão
    anterior pro mesmo tipo de problema — "o ds160-rascunho às vezes manda
    o nome do mês em vez do número"), usada nos 2 pontos que faziam
    `int(mes)`/`mes.lstrip("0")` direto (data de nascimento e data de
    viagem — os únicos 2 campos que esse script decompõe manualmente; os
    outros passam a string inteira pro `robo.py`, que já tratava certo).
    Split malformado agora avisa e usa o padrão em vez de derrubar o script
    inteiro (`partes_data()`).
  - **`scripts/migrar-data-nascimento.ts`** (novo): migra as respostas
    antigas do campo "Data de nascimento" (flat) pro formato com
    sub-campos. Roda em modo simulação por padrão; `--aplicar` grava de
    verdade. Aceita valor antigo em dois formatos: `DDMMAAAA` (8 dígitos
    grudados, o padrão original do wizard) ou `DD/MM/AAAA` (já com barras
    — apareceu em alguns clientes). Qualquer outra coisa (ex.: o do Enzo,
    `"01/022003"`, faltando uma barra) cai no relatório de "precisa
    corrigir manual" — não adivinha data de nascimento em documento de
    visto.
- **Feito em produção (mesma sessão):**
  1. Sub-campos Mês/Dia/Ano adicionados ao campo #25 "Data de nascimento"
     via `/admin/formulario` (a live do schema mora no banco, não no
     `formulario-schema.json` — esse arquivo é só a semente inicial).
  2. Migração aplicada contra produção via uma rota admin temporária
     (`/api/admin/migrar-data-nascimento`, GET simula/POST aplica — criada
     porque não há acesso direto ao banco de produção deste computador, de
     propósito, ver `DOCUMENTACAO-INFRAESTRUTURA.md`). **7 clientes
     migrados** (Dayane, Alex Cruz, Janaina Pires, Teste Envio E2E,
     Michelle Rahd Sanches, Maria Teste Da Silva, Hayanara Nascimento).
     Confirmado idempotente (rodar de novo não duplica/reescreve). Rota
     removida do código depois de usada (era de uso único).
  3. **Enzo Bordini Garutti continua sem data de nascimento migrada** —
     valor antigo (`"01/022003"`) é irrecuperável com segurança. Falta
     alguém da equipe corrigir manualmente na ficha dele (agora com Mês em
     lista fixa, não erra de novo).

---

## 2026-09-04 — Segurança (lockout + retenção LGPD) e correções de validação

Commits `83686c5` → `ddbe88e` no `main`.

- **Bloqueio de login após tentativas erradas**: tabela `TentativaLogin`
  (identificador + contexto "cliente"/"staff"), bloqueia por 15 min na 5ª
  tentativa errada seguida (login certo zera o contador). Cobre tanto
  admin quanto cliente (e-mail+CPF — CPF só tem 11 dígitos, dava pra
  tentar adivinhar sem limite antes disso).
- **Backup semanal automático e criptografado**: `/api/cron/backup-semanal`
  (protegida por `CRON_SECRET`, cron 1x/semana via `vercel.json`), cifra
  com AES-256-GCM (`BACKUP_ENCRYPTION_KEY`) e manda por e-mail (Resend)
  pro `TEAM_EMAIL_DS160` — nunca trafega/fica salvo em texto puro.
  `scripts/descriptografar-backup.ts` reverte pra restaurar.
- **Política de retenção (LGPD)**: cron mensal (dia 1) apaga rascunho com
  status `CONCLUIDO` há mais de 6 meses (dado sensível: CPF, passaporte,
  respostas do DS-160). Quem ainda está preenchendo nunca é apagado. Manda
  e-mail listando quem foi removido pro `TEAM_EMAIL_DS160`. O backup
  semanal cifrado guarda cópia por um tempo mesmo depois do apagão.
- **Bugs de validação corrigidos**: espaço em branco não conta mais como
  resposta válida em campo obrigatório (regex exige ao menos 1 caractere
  não-espaço); sub-campos de endereço/data (Rua/Bairro/Cidade,
  Mês/Dia/Ano) agora marcam `required` individualmente — antes só o
  campo pai marcava, mas o pai não tem input próprio quando tem
  sub-campos, então não bloqueava avanço com sub-campo vazio.
- **Condicional em cadeia**: trocar resposta de um campo-gatilho não
  limpava a resposta de campos que ficaram escondidos (ex.: "Quem paga
  a viagem?" Outra pessoa → Eu mesmo não escondia mais o endereço de
  quem paga depois de já ter sido respondido uma vez). `limparRespostasDeCamposEscondidos`
  agora roda a cada `onChange` (e no carregamento inicial) em loop até
  estabilizar, cobrindo cadeias de mais de um nível.
- Seletor de campo-gatilho da condicional (admin) corrigido: faltava
  opção vazia placeholder, então o navegador auto-selecionava a 1ª opção
  filtrada sem disparar `onChange`.
- Nacionalidade (campo 35) virou lista suspensa (Mercosul/vizinhos +
  "Outro" com campo de texto condicional 355) em vez de radio fixo
  "Brasil".

---

## 2026-08-31 — Builder de formulário no admin (fase 2) + envio de PDF pro cliente

Commits `2e7c86b` → `d106627` no `main`.

- **Builder de formulário estilo Fluent Forms**: antes só dava pra editar
  campo existente (mudança estrutural exigia rota temporária). Agora:
  - Nova tabela `FormularioSchemaBackup`: snapshot do schema inteiro antes
    de cada save, mantém os últimos 30.
  - `/admin/formulario` lista as 21 páginas; `/admin/formulario/pagina/[n]`
    é o builder de uma página (add campo por tipo, excluir com aviso se é
    gatilho de condicional, reordenar por setas). Editor de campo agora
    também troca tipo e edita sub-campos (date/address).
  - `/admin/formulario/backups`: lista e restaura snapshots (restaurar
    também faz backup do estado atual antes).
  - Gestão de páginas: adicionar/renomear/reordenar/excluir — toda
    operação renumera índices pra manter 0..N-1 contíguo; excluir página
    clampeia `paginaAtual` de rascunhos em andamento.
  - Editor de layout do campo: `colunaSpan` (largura nomeada) + checkbox
    "mesma linha que o campo de cima" (`grupoLayout` compartilhado).
  - Todo save passa por `aplicarMudancaSchema`: exige admin, valida (id
    único, condicional aponta pra campo existente), tira backup, grava.
    Id de campo novo = maior id + 1, nunca reaproveita.
  - **Deploy exige `prisma migrate deploy` manual em produção antes do
    código novo rodar** (migration `20260831130000`) — resolvido depois
    (ver abaixo) fazendo o build da Vercel rodar migrations sozinho.
- **Migrations automáticas no build da Vercel**: build roda a etapa de
  migration antes do `next build`, usando `DATABASE_URL` do ambiente —
  não precisa mais rodar `migrate deploy` manual com a connection string
  sensível na mão.
- **Export/restauração de schema offline**: `/admin/formulario/exportar`
  baixa schema completo (sem dado de cliente) como JSON; `scripts/restaurar-schema.ts
  <arquivo> [--confirmar]` restaura a partir do export ou do dump
  completo (dry-run por padrão, snapshot antes de escrever). `RESTAURAR.md`
  é o runbook de recuperação (schema quebrado, banco perdido, app do
  zero) com onde pegar a connection string de prod.
- **PDF do rascunho agora vai pro cliente também** (antes só pra equipe +
  cópia opcional do campo 54) — lógica única em `destinatariosRascunho`
  (`src/lib/email.ts`). `concluirRascunho` só grava `pdfGeradoEm` quando
  o envio dá certo de verdade (antes mascarava falha). Botão "Reenviar
  PDF por e-mail" na ficha do cliente + banner âmbar quando concluído mas
  PDF nunca enviado.
- Página do cônjuge simplificada: "Local de Nascimento" vira só "Cidade"
  (era endereço completo), removidos campos de endereço residencial do
  cônjuge/ex-parceiro.

---

## 2026-08-25 — Landing pública e ajustes de cadastro manual

Commits `2c1d42a` → `fd0f378` no `main`.

- Landing pública nova (visual imersivo navy/dourado, CTAs de acesso
  cliente/equipe) substituindo a tela genérica anterior.
- Data de conclusão do rascunho registrada; respostas ficam escondidas
  por padrão no admin (evita rolagem gigante ao abrir a ficha); cliente
  já existente no cadastro manual vira aviso em vez de erro bloqueante.
- Cadastro manual: botão mostra estado de carregamento + timeout no
  envio do WhatsApp (evita clique duplo/travar sem feedback); corrigido
  link "preencher manualmente" que nunca trocava pra tela do formulário.

---

## 2026-08-23 — Correções críticas de produção (PDF, ordem de respostas) + integração com o robô

Commits `5297d16` → `e743a93` no `main`.

- **PDF quebrado em produção** (erro 500 ao concluir o rascunho): `pdfkit`
  carrega `.afm` de fonte do disco em runtime — sem incluir esses
  arquivos no bundle serverless da Vercel, a geração sempre falhava
  (funcionava local por acaso, com `node_modules` inteiro disponível).
  Duas tentativas até acertar: `outputFileTracingIncludes` restrito não
  resolveu (nem ampliado pra toda rota via wildcard) → solução real foi
  **`serverExternalPackages: ["pdfkit"]`** (usa `require` nativo em vez
  de empacotar, preserva os arquivos de dados do pacote). Diagnosticado
  com uma rota temporária de debug (removida depois).
- Geração/envio do PDF agora em `try/catch` — falha no PDF/e-mail não
  derruba a conclusão do rascunho (que já foi salva antes dessa etapa).
- PDF do rascunho não tem mais senha (`PDF_PASSWORD` era resquício do
  sistema antigo).
- Ordem embaralhada das respostas corrigida: objeto com chaves puramente
  numéricas sempre itera em ordem crescente de valor em JS (ignora ordem
  de inserção) — campo `ordem` novo na resposta da API guarda a sequência
  real por página. Campos "Explique" (textarea condicionado a resposta
  "Sim") passam a vir anexados como `explicacao` no campo pai em vez de
  soltos, tanto no resultado da API quanto no PDF.
- **Integração com o robô de automação** (repo `automacao-ds160`, ver
  [[projeto_automacao_ds160]]): `GET /api/robo-integracao/clientes/[id]`
  devolve respostas já normalizadas (datas/endereços resolvidos via
  schema) pro robô Playwright consumir direto, sem precisar extrair de
  PDF; `GET /api/robo-integracao/clientes?q=<busca>` busca cliente por
  nome/CPF parcial.
- Ao concluir o rascunho, chama `POST /api/ds160-rascunho/marcar-concluido`
  no Flow (se tiver `flowClienteId`) — fecha o loop: a equipe vê na ficha
  do cliente no Flow que já dá pra rodar o robô, sem checar o admin do
  DS160 manualmente.
- `scripts/backup.ts` (dump manual do banco) adicionado, mesmo padrão do
  projeto Flow.

---

## 2026-08-19 a 2026-08-20 — Scaffold, wizard, PDF, admin completo, login por CPF

Commits `32c34ad` → `36d3976` no `main` (build inicial das 6 fases + extras).

- **Scaffold**: Next.js 16 + Prisma 7 (Postgres local via `prisma dev`).
  Login separado staff (`/admin`) e cliente (`/login`, por e-mail). 275
  campos / 21 páginas do Gravity Forms convertidos em schema estruturado
  (`src/lib/condicional.ts` = motor de lógica condicional). Cadastro de
  cliente com busca opcional no Flow (rota isolada e só-leitura lá).
  Envio do link de acesso via WhatsApp (workflow n8n existente).
- **Wizard de preenchimento** (21 páginas): `CampoRenderer` cobre todos
  os tipos (text, textarea, radio, select, checkbox, consent, date/address
  compostos); `PaginaWizard` avalia condicionais em tempo real no
  cliente; salva a cada Anterior/Seguinte (retoma de onde parou); página
  final marca `CONCLUIDO` e bloqueia edição.
- **PDF + e-mail ao concluir**: `gerarPdfRascunho` (pdfkit, protegido por
  senha na época — removida depois em 23/08); `enviarPdfRascunho`
  (Resend) manda pra equipe + cópia se o cliente pediu; domínio
  `ds160.2ntravel.com.br` verificado (DKIM+SPF via Cloudflare).
- **Identidade visual 2N Travel** no wizard: rotas do cliente movidas pra
  grupo `(cliente)` com layout próprio (cabeçalho escuro + logo + faixa
  "Preencha Corretamente", igual ao Gravity Forms original); conversor de
  schema captura `layoutGroupId`/`layoutGridColumnSpan` pra campos curtos
  voltarem a ficar lado a lado.
- **Admin completo**: listagem em tabela ordenável + busca
  (`/admin/clientes`), detalhe completo das respostas agrupado por
  página (`src/lib/formatar-respostas.ts`, compartilhado com o PDF),
  editor de formulário (`/admin/formulario/[campoId]/editar` — texto,
  opções, obrigatório, condicional — sem deploy, só edita o que já
  existe), edição de cliente (nome/CPF/e-mail/telefone — CPF mudou
  recalcula a senha de login), exclusão de cliente.
- **Login do cliente vira e-mail + CPF** (senha = CPF só dígitos): motivo,
  a Meta bloqueia template de WhatsApp com senha em texto puro como
  parâmetro; CPF o cliente já sabe de cor. Corrigido junto um crash de
  hydration ("Minified React error #441") nas duas telas de login — o
  padrão antigo lançava `throw` dentro de Server Action ligada direto a
  `<form action>`, trocado por `useActionState`.
- **Família com vários rascunhos**: e-mail deixou de ser único — um
  responsável cadastra o rascunho de vários filhos com o mesmo e-mail/
  telefone dele (nome e CPF diferentes cada um). Login por e-mail
  desempata pelo CPF digitado. Duplicidade checada por CPF, não e-mail.
- Ajustes finos: botão "Salvar e continuar depois" explícito e depois
  deixado mais discreto; layout responsivo corrigido no celular; aviso
  "Leia com atenção" antes do login (réplica do sistema antigo);
  cabeçalho duplicado removido.
- **Gotchas de deploy na Vercel** (perder tempo se esquecer):
  1. Framework Preset não detectou Next.js sozinho num projeto novo
     desse time (ficou em "Other" → 404 em todas as rotas). Corrigir em
     Settings → General → Framework Preset → Next.js. Botão "Redeploy"
     sozinho não pega essa mudança — precisa de um `git push` novo.
  2. Deployment Protection ("Vercel Authentication") vem ligado por
     padrão em projeto novo do time VISTO_AMERICANO — bloqueia visitante
     sem login na Vercel; desligar em Settings → Deployment Protection
     pra site client-facing.
  3. Dev local usou `db push` várias vezes sem gerar migration formal —
     precisou regenerar uma migration "init" única
     (`prisma migrate diff --from-empty`) antes do primeiro deploy.

---

## Contexto rápido do projeto

- **Onde**: `C:\Users\diret\OneDrive\Documentos\Projetos-DESKTOP-V9SC935\Formulario DS160 Rascunho`
  (OneDrive já renomeou a pasta `Projetos*` mais de uma vez por conflito
  de sync — checar o nome exato antes de navegar em máquina nova). Repo
  `github.com/vistosnationaltur-ship-it/rascunhods160` (privado), branch
  `main`.
- **Produção**: `https://ds160.2ntravel.com.br` (CNAME Cloudflare) e
  `https://rascunhods160.vercel.app`. Deploy Vercel, time
  **VISTO_AMERICANO**, projeto `rascunhods160`, automático via
  `git push` (webhook GitHub → Vercel). Migrations rodam sozinhas no
  build (desde 31/08) — não precisa mais `migrate deploy` manual.
- **Banco**: Prisma Postgres próprio (região us-east-1, mesmo workspace
  do Flow, banco diferente). **Dev local usa `prisma dev`** (PGlite
  embutido, não Postgres de verdade) — instável sob acesso concorrente,
  já causou perda total dos dados locais uma vez. Recuperação:
  `npx prisma dev rm ds160-rascunho` → `npx prisma dev -n ds160-rascunho -d`
  → `npx prisma db push` → rerodar seeds. Só afeta dev local, nunca
  produção.
- **Documentação sensível (gitignored, só nesta máquina)**:
  `DOCUMENTACAO-INFRAESTRUTURA.md` (credenciais, IDs, env vars — ler
  antes de mexer em produção) e `MANUAL-OPERACIONAL.md` (mencionado na
  revisão de segurança de 04/09). Como são gitignored, **não sincronizam
  entre PCs** — se abrir este projeto numa máquina nova e precisar deles,
  perguntar ao usuário ou recriar a partir do que está documentado aqui.
- **Ligação com o Flow Visto Americano** (repo/projeto irmão): módulo
  separado por decisão do usuário (repo e banco próprios, "separados com
  ligações pra teste"). Duas rotas isoladas com segredo compartilhado
  (`FLOW_API_SECRET` == `DS160_RASCUNHO_API_SECRET`, mesmo valor nos dois
  projetos):
  - Flow → aqui (só-leitura): busca cliente por nome/CPF pra pré-preencher
    cadastro sem redigitar.
  - Aqui → Flow: `POST /api/flow-integracao/cadastrar-cliente` cadastra e
    dispara WhatsApp num clique só a partir do botão "Gerar acesso
    Rascunho DS160" no Flow; `POST /api/ds160-rascunho/marcar-concluido`
    (no Flow) avisa quando o cliente termina, pra equipe saber que já dá
    pra rodar o robô sem checar o admin do DS160.
- **Ligação com o robô de automação** ([[projeto_automacao_ds160]], repo
  `automacao-ds160`): `GET /api/robo-integracao/clientes/[id]` devolve
  respostas normalizadas (não precisa mais extrair de PDF); `GET
  /api/robo-integracao/clientes?q=` busca por nome/CPF parcial.
- **WhatsApp**: dois workflows n8n separados (sistema antigo Gravity
  Forms/JetFormBuilder vs. este) pra não conflitar template/mensagem —
  ver credenciais/webhooks em `DOCUMENTACAO-INFRAESTRUTURA.md`.
- **Login do cliente**: e-mail + CPF (senha = CPF só dígitos, motivo:
  Meta bloqueia template de WhatsApp com senha em texto puro). Bloqueio
  de força bruta desde 04/09 (5 tentativas erradas = 15 min de bloqueio,
  tabela `TentativaLogin`).
- **Retenção de dados (LGPD)**: rascunho `CONCLUIDO` há mais de 6 meses é
  apagado automaticamente (cron mensal) — dado sensível (CPF, passaporte,
  respostas completas) não fica indefinidamente. Backup semanal cifrado
  (AES-256-GCM, cron separado) dá uma margem pra recuperar logo depois se
  precisar.
- **Formulário editável sem deploy**: schema (páginas/campos/opções/
  condicionais/layout) mora em `FormularioSchema` (linha única, JSON) em
  vez de arquivo estático. Builder completo no admin desde 31/08 —
  adiciona/exclui/reordena página e campo, edita layout (largura, "mesma
  linha"), com backup automático (`FormularioSchemaBackup`, últimos 30)
  antes de cada save e export/restauração offline (`RESTAURAR.md`).
- **Cliente de teste permanente** (não apagar, pedido do usuário) — login
  em `DOCUMENTACAO-INFRAESTRUTURA.md` (gitignored, não commitar credencial
  aqui). Ver também [[feedback_dados_teste_producao]].
