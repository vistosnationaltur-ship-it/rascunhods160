// Restaura um backup COMPLETO (do e-mail semanal, de scripts/backup.ts ou de scripts/backup-drive.ts, já aberto
// com scripts/descriptografar-backup.ts) num banco NOVO e VAZIO, com o schema já aplicado (`npx prisma migrate deploy`).
// Traz de volta: usuários (admin + 2FA), schema do formulário e clientes (respostas, status, consentimento).
//
// Uso (simula primeiro, grava só com --confirmar):
//   npx tsx --env-file=.env scripts/restaurar-tudo.ts backups/backup-....json
//   npx tsx --env-file=.env scripts/restaurar-tudo.ts backups/backup-....json --confirmar
//
// Segurança: mostra pra qual banco vai gravar e RECUSA se já houver usuário, cliente ou schema (nunca duplica nem
// sobrescreve). Depois de gravar, confere tabela por tabela contra o arquivo.
// Para restaurar SÓ o formulário num banco que já tem dados, use scripts/restaurar-schema.ts.
import { readFileSync } from "node:fs";
import { prisma } from "@/lib/prisma";

type Linha = Record<string, unknown>;

function converterDatas(linha: Linha, campos: string[]): Linha {
  const saida = { ...linha };
  for (const campo of campos) {
    const v = saida[campo];
    saida[campo] = v ? new Date(v as string) : null;
  }
  return saida;
}

async function inserir(nome: string, linhas: Linha[], campos: string[], gravar: (dados: Linha[]) => Promise<unknown>) {
  const convertidas = linhas.map((l) => converterDatas(l, campos));
  for (let i = 0; i < convertidas.length; i += 500) {
    await gravar(convertidas.slice(i, i + 500));
  }
  console.log(`  ${nome}: ${linhas.length}`);
}

async function main() {
  const caminho = process.argv[2];
  const confirmar = process.argv.includes("--confirmar");
  if (!caminho || caminho.startsWith("--")) {
    console.error("Uso: npx tsx --env-file=.env scripts/restaurar-tudo.ts <backup.json> [--confirmar]");
    process.exit(1);
  }

  const backup = JSON.parse(readFileSync(caminho, "utf-8"));
  const lista = (nome: string): Linha[] => backup[nome] ?? [];

  const servidor = (() => {
    try {
      const u = new URL(process.env.DATABASE_URL ?? "");
      return `${u.hostname}${u.pathname}`;
    } catch {
      return "(DATABASE_URL ausente ou inválida)";
    }
  })();
  console.log(`Destino: ${servidor}`);
  console.log(
    `Backup de ${backup.geradoEm}: ${lista("usuarios").length} usuários, ${lista("formularioSchema").length} schema(s), ${lista("clientes").length} clientes.`,
  );

  const [usuarios, schemas, clientes] = await Promise.all([
    prisma.usuario.count(),
    prisma.formularioSchema.count(),
    prisma.clienteDs160.count(),
  ]);
  if (usuarios + schemas + clientes > 0) {
    console.error(
      `O banco de destino NÃO está vazio (${usuarios} usuários, ${schemas} schema(s), ${clientes} clientes). ` +
        `Esse script só restaura em banco NOVO/VAZIO: aponte DATABASE_URL pra um banco novo e rode de novo.`,
    );
    process.exit(1);
  }

  if (!confirmar) {
    console.log("\nSimulação: o banco está vazio e o arquivo é legível. Rode de novo com --confirmar para gravar.");
    return;
  }

  console.log("\nGravando...");
  await inserir("usuarios", lista("usuarios"), ["criadoEm", "totpAtivadoEm", "totpBloqueadoAte"], (d) =>
    prisma.usuario.createMany({ data: d as never }),
  );
  await inserir("formularioSchema", lista("formularioSchema"), ["atualizadoEm"], (d) =>
    prisma.formularioSchema.createMany({ data: d as never }),
  );
  await inserir(
    "clientes",
    lista("clientes"),
    ["concluidoEm", "pdfGeradoEm", "excluirApos", "consentimentoEm", "primeiroAcessoEm", "ultimoAcessoEm", "ultimoSalvamentoEm", "criadoEm", "atualizadoEm"],
    (d) => prisma.clienteDs160.createMany({ data: d as never }),
  );

  // Conferência: o que está no banco agora tem que bater com o que o backup trazia.
  const depois = {
    usuarios: await prisma.usuario.count(),
    formularioSchema: await prisma.formularioSchema.count(),
    clientes: await prisma.clienteDs160.count(),
  };
  const divergentes = (Object.keys(depois) as (keyof typeof depois)[]).filter((t) => depois[t] !== lista(t).length);
  if (divergentes.length > 0) {
    console.error(`ATENÇÃO: não batem com o backup: ${divergentes.map((t) => `${t} (${depois[t]} de ${lista(t).length})`).join(", ")}`);
    process.exit(1);
  }
  console.log("Conferência: todas as tabelas batem com o backup.");
}

main()
  .catch((err) => {
    console.error("ERRO:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
