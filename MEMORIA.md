# MEMÓRIA — Rascunho DS160

Log de sessões de trabalho. Mais recente no topo. Cada entrada: o que mudou,
onde no código, e o porquê quando não é óbvio.

---

## 2026-09-23 — Pergunta de Cônjuge também esconde pra menor de 14 anos; botão "Salvar e continuar" mais visível

- Gatilho: testando com uma criança, a página do Cônjuge (10) apareceu mesmo sendo o último passo antes das
  páginas de trabalho/escolaridade/viagens (essas sim já escondiam certinho). Investigação: os campos 175/176
  já tinham uma condicional pra esconder quando "Estado Civil" (campo 30) é "Solteiro" (`acao: "esconder"`,
  `tipoLogica: "qualquer"`), mas nada relacionado a idade - se o Estado Civil não estiver EXATAMENTE "Solteiro"
  (ex.: ainda não respondido, ou outro valor no teste), a pergunta aparece mesmo sendo um menor.
- Como a condicional já era "esconder" + "qualquer" (é um OR de condições-pra-esconder), bastou ACRESCENTAR mais
  uma regra no mesmo array (`menor_que 14`) em vez de criar uma condicional nova - "esconde se Solteiro OU se
  menor de 14" continua sendo só uma lista de ORs, compõe direito (diferente do caso de trabalho/escolaridade,
  que era "mostrar" + "todas"/AND, onde só dava pra acrescentar em condicionais que já fossem "todas").
  Rota de uso único `src/app/api/admin/aplicar-idade-minima-conjuge/route.ts` (mesmo padrão de sempre: GET
  simula, POST grava com backup automático) - REMOVER depois de usada.
- `PaginaWizard.tsx`: botão "Salvar e continuar depois" tinha texto cinza clarinho quase invisível
  (`text-xs text-zinc-400`) - usuário pediu mais destaque. Virou um botão de verdade (borda + texto azul,
  `border-blue-200 text-blue-700`), mesmo tamanho dos outros dois botões da página.

## 2026-09-23 — Aviso quando nenhuma pergunta da página se aplica ao cliente

- Gatilho: usuário testando o corte de idade mínima (14 anos) chegou numa página do wizard sem NENHUM campo
  visível (todas as perguntas daquela página não se aplicavam ao caso) e só viu a barra de progresso + botões
  "Anterior"/"Seguinte", sem entender por quê - "os campos não aparecem... mas temos que avançar".
- `PaginaWizard.tsx`: quando `linhas.length === 0` (nenhum campo passou pelo `campoVisivel`), mostra um aviso
  explicando que nenhuma pergunta se aplica com base no que já foi respondido antes, e que é pra clicar em
  "Seguinte". Cobre qualquer página que fique vazia por condicional (idade mínima pra trabalho/escola/viagens,
  ver `src/lib/idade.ts`, ou outras já existentes como a de cônjuge pra quem não é casado) - não é um aviso
  específico só de "menor de idade".

## 2026-09-23 — Botão de reordenar sub-campos no editor de pergunta

- Gatilho: usuário testando a idade mínima reparou que o campo "Data de nascimento" mostra Mês/Dia/Ano nessa
  ordem, mas o certo é Dia/Mês/Ano. A ordem de exibição segue exatamente a ordem do array `subCampos` no schema,
  e o editor (`/admin/formulario/[campoId]/editar`) não tinha como reordenar - só dava pra adicionar (sempre no
  fim da lista) ou remover.
- `EditorCampo.tsx`: cada sub-campo ganhou botões ▲/▼ que trocam sua posição com o vizinho no array em memória;
  salva junto com o resto do formulário (botão "Salvar" já mandava o array `subCampos` como estava). Sem rota de
  uso único dessa vez - é uma correção de ORDEM, então o próprio usuário resolve direto pela tela do admin.

## 2026-09-23 — Trabalho/escolaridade/viagens escondidos automaticamente pra menor de 14 anos

- Gatilho: usuário reportou que, ao preencher pra uma criança, as perguntas de escola, profissão e viagens dos
  últimos 5 anos (páginas 11 a 14 do wizard: "Atividade Atual", "Trabalhos Anteriores", "Escolaridade",
  "Informações adicionais... / Viagens Anteriores") somem - o que é o comportamento CERTO (confirmado pelo
  usuário: no DS-160 oficial do consulado essas perguntas realmente não se aplicam a menor de 14 anos), só que
  hoje isso só funciona de vez em quando, dependendo de qual opção alguém escolhe manualmente em "Atividade
  Atual" - pediu pra automatizar isso de verdade usando a data de nascimento (campo 25) lançada no início do
  formulário.
- `src/lib/idade.ts` (novo): `calcularIdade(campoNascimento, respostas)` calcula a idade completa a partir da
  resposta de Dia/Mês/Ano do campo 25 (a data de nascimento JÁ é um campo com sub-campos desde a migração de
  2026-09-15 - achar os ids de Dia/Mês/Ano é por rótulo, igual `scripts/migrar-data-nascimento.ts` já fazia,
  porque os ids são gerados pelo admin e variam). Devolve `null` se a data ainda não foi respondida - nesse caso
  as perguntas de trabalho/escola continuam aparecendo normalmente (nunca trata "não sei" como "é menor").
  `comIdadeInjetada(paginas, respostas)` injeta a idade calculada em `respostas` sob uma chave reservada
  (`CAMPO_ID_IDADE = -1`, nenhum campo real do schema chega perto disso) - assim as condicionais existentes
  (`campoVisivel`, `src/lib/condicional.ts`) conseguem comparar com ela sem precisar mudar a assinatura de
  `Regra.campoId` (é `number`) nem duplicar a data de nascimento como se fosse resposta de verdade.
- `condicional.ts` ganhou 2 operadores numéricos: `maior_ou_igual` e `menor_que` (NaN de qualquer lado = falso,
  nunca "bateu" por engano).
- `comIdadeInjetada` é chamado nos 3 lugares que avaliam visibilidade de campo: `preencher/[pagina]/page.tsx`
  (o wizard em si), `admin/clientes/[id]/page.tsx` (resumo no admin) e `gerar-pdf.ts` (o PDF) - os três agora
  escondem a mesma coisa pro mesmo cliente.
- A idade em si é só CALCULADA em código - o schema (que mora no banco, `FormularioSchema`, não em código) ainda
  precisava ganhar a condicional "esconder se menor de 14" nos campos-gatilho de cada bloco (Atividade Atual,
  Trabalhou em outra empresa, Concluiu ensino médio/superior, Viajou pra algum país). Como não há acesso local ao
  banco de produção (por design do projeto), isso foi feito por uma rota de uso único,
  `src/app/api/admin/aplicar-idade-minima-trabalho/route.ts` (GET simulava, POST gravava e fazia backup automático
  em `FormularioSchemaBackup` antes) - mesmo padrão já usado antes pra migrar a data de nascimento. Rodada com
  sucesso em produção em 2026-09-23 (14 campos: 11 ganharam condicional nova, 3 tiveram a regra de idade
  acrescentada numa condicional já existente - "Descreva os dados da empresa" e os 2 telefones de empresa
  anterior -, 0 não encontrados) e a rota foi removida logo depois, como sempre.

## 2026-09-22 — Cadastro manual de cliente quebrava a tela inteira (React error #441)

- Gatilho: usuário tentou cadastrar um cliente manualmente em `/admin/clientes/novo` e caiu na tela genérica
  "Algo deu errado" (minified React error #441 = "erro não tratado durante o render de um Server Component").
  Não tinha relação com nenhuma mudança desta sessão - já existia antes, só não tinha aparecido ainda.
- Causa: `cadastrarCliente` (`src/app/admin/clientes/novo/actions.ts`) validava os campos e a duplicidade de CPF
  com `throw new Error(...)` direto, mas o form usava `<form action={cadastrarCliente}>` SEM `useActionState` -
  então qualquer uma dessas validações falhando (campo obrigatório faltando, ou CPF já cadastrado - bem comum,
  já que é a senha de login e tem que ser único) virava uma exceção não tratada, subia pro error boundary do Next
  e derrubava a tela inteira em vez de mostrar uma mensagem.
- Correção: `cadastrarCliente` agora segue o mesmo padrão já usado no login (`src/app/admin/login/actions.ts`) -
  recebe `useActionState` e RETORNA `{ erro: "..." }` em vez de lançar exceção. O JSX do formulário saiu de
  `page.tsx` (Server Component) pra um Client Component novo, `CadastroForm.tsx`, que usa `useActionState` e
  mostra o erro na tela (mesma caixinha vermelha do login), deixando o admin corrigir e tentar de novo sem
  recarregar a página.

## 2026-09-22 — Radio "Não" salvando como "Sim" (pergunta 315, wizard de preenchimento)

- Gatilho: usuário relatou que a pergunta "Você tem algum outro parente nos Estados Unidos?" (campo 315, página 9
  do wizard - "Informação da Família (parentes)") mostrava "Sim" no resumo/PDF, mesmo ele tendo certeza de ter
  selecionado "Não". Diferente do bug do checkbox (só exibição), aqui o dado gravado no banco em si estava errado
  - o campo 315 é um radio simples, sem subCampos, e `formatarResposta`/`campoVisivel` leem ele do jeito certo.
- Causa raiz (duas juntas): `PaginaWizard.tsx` guarda as respostas da página em `useState`, inicializado só na
  PRIMEIRA vez que o componente monta (`useState(() => limparRespostasDeCamposEscondidos(respostasIniciais, ...))`).
  Só que `src/app/(cliente)/(comCabecalho)/preencher/[pagina]/page.tsx` renderizava `<PaginaWizard>` SEM `key`, e
  como é o mesmo componente na mesma posição da árvore em toda navegação entre páginas do wizard, o React nunca
  REMONTA - só re-renderiza com props novas. Resultado: depois da primeira página, o `useState` nunca mais lê
  `respostasIniciais` de novo, e o wizard passa a rodar só em cima do que está em memória no navegador. Combinado
  com o cache de rota do Next (`staleTimes.dynamic`, 30s por padrão), usar o botão "Voltar" do PRÓPRIO NAVEGADOR
  (ou navegar rápido demais) podia reexibir uma versão em cache de uma página de ANTES do cliente corrigir a
  resposta - e como `salvarPagina()` faz merge (`{...respostasAtuais, ...respostasPagina}`), um "Seguinte" clicado
  em cima dessa tela desatualizada sobrescrevia a resposta certa (já salva) com a errada que tinha ficado em cache
  na memória do navegador.
- Correção (`next.config.ts` + `preencher/[pagina]/page.tsx`):
  1. `staleTimes: { dynamic: 0 }` em `next.config.ts` - zera o cache de rota do Next pra páginas dinâmicas, então
     toda navegação do wizard (inclusive "Voltar" do navegador) busca os dados de novo no servidor.
  2. `<PaginaWizard key={indice} .../>` - força o React a remontar o wizard a cada página, garantindo que o
     `useState` sempre releia `respostasIniciais` fresco do banco em vez de arrastar estado de uma página anterior.
- Como é um bug de GRAVAÇÃO (não só exibição), rascunhos que já passaram por esse cenário antes do deploy podem
  ter essa pergunta (ou outras, o bug não era exclusivo do campo 315) gravada errada de verdade no banco - vale
  conferir manualmente com o cliente se a resposta que aparece bate com o que ele realmente escolheu, e corrigir
  pela tela de edição do admin se não bater. Não há como saber quais clientes foram afetados sem essa conferência
  manual (o bug não deixa rastro - sobrescreve silenciosamente).

## 2026-09-22 — Checkbox "Não" aparecia como "não respondido" (PDF + admin)

- Gatilho: usuário relatou que 2 perguntas do rascunho de um cliente apareciam como "(não respondido)" no
  resumo/PDF mesmo o cliente tendo marcado "Não". Só de código, dado do cliente sempre esteve certo.
- Causa: `formatarResposta` (`src/lib/formatar-respostas.ts`), usada tanto pelo PDF (`gerar-pdf.ts`) quanto pela
  tela de detalhe do cliente no admin, tinha um ramo especial pra campos com `subCampos` (pensado pra "date" e
  "address", que REALMENTE guardam a resposta em `respostas[sub.id]` - dia/mês/ano, rua/número...). O problema:
  as 4 perguntas do tipo `checkbox` do schema (herdado do Gravity Forms original) TAMBÉM carregam um `subCampos`
  (ex.: `338.1`/`338.2` pra "Não"/"Sim"), mas isso é metadado morto - o `CampoRenderer.tsx` do checkbox sempre
  salva a resposta como um ARRAY sob a chave do próprio campo (`respostas["338"] = ["Não"]`), nunca nos
  sub-campos. Resultado: pra essas 4 perguntas, o código sempre lia chaves vazias e mostrava "não respondido",
  não importa o que o cliente tivesse marcado.
- Perguntas afetadas (todas do tipo checkbox): "Você já teve Habilitação Americana" (338), "Você já teve um
  Visto Americano recusado, ou teve a entrada negada nos Estados Unidos?" (340), "Você já teve sua autorização
  de viagem negada por meio do sistema ESTA" (354), "Possui mais de uma empresa ou mais de um emprego?" (349).
- Correção: o ramo de `subCampos` agora ignora campos do tipo `checkbox` (`campo.tipo !== "checkbox" && ...`),
  caindo no caminho normal (lê `respostas[campo.id]`, que é um array, e troca cada valor pelo texto da opção).
  Verificado com um script reproduzindo o campo 338 de verdade (resposta `["Não"]` -> texto "Não"; sem resposta
  -> ""; "date" com subCampos de verdade continua funcionando).
- Como é um bug só de EXIBIÇÃO (nunca gravou nada errado no banco), o deploy já corrige na hora, pra
  clientes antigos e novos - sem precisar de rota de correção nem reprocessar dado nenhum. Se algum PDF já foi
  baixado/enviado a um cliente ANTES deste deploy com essas perguntas mostrando "não respondido", vale gerar de
  novo pra esse cliente específico (o rascunho em si, no banco, sempre esteve correto).

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
