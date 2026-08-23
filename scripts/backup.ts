import { writeFileSync, mkdirSync } from "node:fs";
import { prisma } from "@/lib/prisma";

async function main() {
  const [usuarios, formularioSchema, clientes] = await Promise.all([
    prisma.usuario.findMany(),
    prisma.formularioSchema.findMany(),
    prisma.clienteDs160.findMany(),
  ]);

  const backup = {
    geradoEm: new Date().toISOString(),
    usuarios,
    formularioSchema,
    clientes,
  };

  mkdirSync("backups", { recursive: true });
  const nomeArquivo = `backups/backup-${backup.geradoEm.replace(/[:.]/g, "-")}.json`;
  writeFileSync(nomeArquivo, JSON.stringify(backup, null, 2));

  console.log(`Backup salvo em ${nomeArquivo}`);
  console.log(
    `usuarios: ${usuarios.length}, formularioSchema: ${formularioSchema.length}, clientes: ${clientes.length}`,
  );
}

main()
  .catch((err) => {
    console.error("ERRO:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
