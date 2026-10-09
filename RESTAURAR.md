# Como refazer o sistema se der problema em produção

Ordem de gravidade, do mais comum pro mais raro.

---

## 1. Formulário quebrado / campo ou página perdida (schema)

O schema do formulário (21 páginas, ~252 campos, opções, condicionais,
layout) mora numa linha única da tabela `FormularioSchema` e é editado
pelo builder no `/admin/formulario`. É a parte que mais muda e mais
quebra.

**Duas redes de proteção:**

### a) Online — snapshot automático (mais rápido)
Toda alteração no builder grava um snapshot ANTES de aplicar
(`FormularioSchemaBackup`, últimos 30). Para voltar:

1. `/admin/formulario` → **Backups**
2. Escolha o snapshot de antes do estrago → **Restaurar**
   (isso também salva o estado atual como mais um backup, dá pra desfazer)

### b) Offline — cópia em `backups/` (rede de segurança externa)
Se o banco inteiro se perdeu ou os 30 snapshots já rodaram:

1. Tenha um JSON do schema em `backups/` — gerado por
   `/admin/formulario` → **Exportar JSON** (rode isso de tempos em
   tempos, ou depois de mexer bastante no formulário).
2. Restaure com:
   ```
   npx tsx scripts/restaurar-schema.ts backups/formulario-schema-AAAA-MM-DD.json
   # confere o dry-run e então:
   npx tsx scripts/restaurar-schema.ts backups/formulario-schema-AAAA-MM-DD.json --confirmar
   ```
   Em produção, defina a connection string antes (ver seção 4):
   ```
   $env:DATABASE_URL="postgres://...prod..."; npx tsx scripts/restaurar-schema.ts <arquivo> --confirmar
   ```

---

## 2. Backup completo do banco (schema + usuários + clientes)

`scripts/backup.ts` despeja tudo num JSON em `backups/`
(`backup-<timestamp>.json`). Roda contra o `DATABASE_URL` ativo — pra
backup de **produção**, defina a string de prod antes:

```
$env:DATABASE_URL="postgres://...prod..."; npx tsx scripts/backup.ts
```

`backups/` é ignorado pelo git de propósito (tem dado de cliente) — essa
pasta é a cópia local, nunca sobe pro GitHub.

Para restaurar só o schema desse dump: `scripts/restaurar-schema.ts`
aceita tanto o export enxuto quanto esse dump completo.
Usuários, schema e clientes de uma vez: `scripts/restaurar-tudo.ts` (seção 5).

---

## 3. Refazer o app do zero

1. `git clone https://github.com/vistosnationaltur-ship-it/rascunhods160.git`
2. `npm install`
3. Configurar as env vars (lista em `DOCUMENTACAO-INFRAESTRUTURA.md`):
   `DATABASE_URL`, `AUTH_SECRET`, Resend, `FLOW_API_SECRET`, etc.
4. Deploy: push pra `main` → Vercel builda. O build roda
   `prisma migrate deploy` sozinho (cria as tabelas).
5. Criar o admin: `npx tsx --env-file=.env scripts/seed-admin.ts '<senha>'`
   (ou contra prod: `$env:DATABASE_URL="..."; npx tsx scripts/seed-admin.ts '<senha>'`)
6. Carregar o schema do formulário: `scripts/restaurar-schema.ts` com o
   último JSON de `backups/` (ou `scripts/importar-schema-inicial.ts`
   pra voltar ao schema original do Gravity Forms).

---

## 4. Onde pegar a connection string de produção

`DATABASE_URL` é "Sensitive" na Vercel (não dá pra ver depois de
salva). Pegue no **Prisma Console** (console.prisma.io → workspace →
projeto do banco → Connect / API Keys) — a string de **conexão direta**
(`postgres://...`), não a de Accelerate (`prisma+postgres://...`).

Feche o terminal depois de usar, pra não deixar a string na env da sessão.

---

## 5. Backup completo pro Drive e restauração completa

### Backup pro Drive (junto com o do Flow)
`npm run backup:drive` (lê `DATABASE_URL`, `BACKUP_ENCRYPTION_KEY` e `BACKUP_DRIVE_DIR` do `.env` local). Normalmente quem chama é o atalho
**"Backup do Flow"** (repositório do Flow, `DS160_REPO_DIR`/`DS160_DRIVE_DIR`), que grava na pasta `Flow Visto Americano\Sistema Completo DS160`:
`ds160-backup-*.enc` (dados, cifrado e conferido), `Codigo do Sistema/`, `ds160-historico-git.bundle`, `ds160.env.enc`, `ULTIMO-BACKUP.txt`.
**Retenção LGPD:** cópias de dados só por 28 dias (mín. 2). Flag `--sem-alerta` = não manda e-mail (o Flow já avisa).

### Restauração completa (banco novo e vazio)
1. Banco Postgres novo; `$env:DATABASE_URL="<string do banco NOVO>"`; `npx prisma migrate deploy`
2. `npx tsx scripts/descriptografar-backup.ts "<ds160-backup-....enc>" --chave "<BACKUP_ENCRYPTION_KEY do DS-160>"` → gera o `.json`
3. `npx tsx scripts/restaurar-tudo.ts "<arquivo.json>"` (simula) e depois `... --confirmar`. Recusa banco com dados; no fim confere as tabelas.
4. Variáveis na Vercel (`ds160.env.enc` abre como `.env.restaurado` com a mesma ferramenta), `DATABASE_URL` novo, Redeploy.
Testado em 2026-10-09: backup → banco novo → comparação campo a campo **idêntica** (usuários com 2FA, schema, clientes com respostas e datas).
Tabela nova no schema ⇒ incluir em `src/lib/backup-automatico.ts` **e** `scripts/restaurar-tudo.ts`.
