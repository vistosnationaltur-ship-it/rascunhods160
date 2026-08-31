// Restaura o schema do formulário (tabela FormularioSchema) a partir de
// um arquivo JSON — seja um export de /admin/formulario/exportar, seja um
// dump completo de scripts/backup.ts. Antes de sobrescrever, guarda o
// estado atual na tabela FormularioSchemaBackup (dá pra desfazer pelo
// /admin/formulario/backups).
//
// Uso:
//   npx tsx scripts/restaurar-schema.ts <arquivo.json>              (dry-run: só mostra o que faria)
//   npx tsx scripts/restaurar-schema.ts <arquivo.json> --confirmar  (aplica de verdade)
//
// Em produção, defina a connection string antes:
//   $env:DATABASE_URL="postgres://...prod..."; npx tsx scripts/restaurar-schema.ts <arquivo> --confirmar

import { readFileSync } from "node:fs";
import { prisma } from "@/lib/prisma";

type Pagina = { indice: number; titulo: string; campos: unknown[] };

function extrairPaginas(conteudo: unknown): Pagina[] {
  const obj = conteudo as Record<string, unknown>;
  if (Array.isArray(obj.paginas)) return obj.paginas as Pagina[];
  // dump completo de scripts/backup.ts
  const fs = obj.formularioSchema as Array<{ paginas: Pagina[] }> | undefined;
  if (Array.isArray(fs) && fs[0]?.paginas) return fs[0].paginas;
  throw new Error(
    "Não encontrei `paginas` no arquivo (nem `.paginas` nem `.formularioSchema[0].paginas`).",
  );
}

async function main() {
  const arquivo = process.argv[2];
  const confirmar = process.argv.includes("--confirmar");
  if (!arquivo) {
    console.error("Uso: npx tsx scripts/restaurar-schema.ts <arquivo.json> [--confirmar]");
    process.exit(1);
  }

  const paginas = extrairPaginas(JSON.parse(readFileSync(arquivo, "utf8")));
  const totalCampos = paginas.reduce((n, p) => n + p.campos.length, 0);

  const atual = await prisma.formularioSchema.findFirst();
  const camposAtuais = atual
    ? (atual.paginas as unknown as Pagina[]).reduce((n, p) => n + p.campos.length, 0)
    : 0;

  console.log(`Arquivo:  ${paginas.length} páginas, ${totalCampos} campos`);
  console.log(`Banco:    ${atual ? `${(atual.paginas as unknown as Pagina[]).length} páginas, ${camposAtuais} campos` : "vazio"}`);

  if (!confirmar) {
    console.log("\nDry-run — nada foi gravado. Rode de novo com --confirmar pra aplicar.");
    return;
  }

  if (atual) {
    await prisma.formularioSchemaBackup.create({
      data: {
        paginas: atual.paginas as unknown as object,
        motivo: `estado antes de restaurar de ${arquivo}`,
      },
    });
    await prisma.formularioSchema.update({
      where: { id: atual.id },
      data: { paginas: paginas as unknown as object },
    });
    console.log("\nSchema restaurado (backup do estado anterior gravado em FormularioSchemaBackup).");
  } else {
    await prisma.formularioSchema.create({ data: { paginas: paginas as unknown as object } });
    console.log("\nSchema criado (não havia FormularioSchema no banco).");
  }
}

main()
  .catch((err) => {
    console.error("ERRO:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
