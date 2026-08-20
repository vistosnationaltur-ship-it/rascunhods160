import { prisma } from "@/lib/prisma";
import { hashSenha } from "@/lib/senha";

async function main() {
  const username = "admin";
  const senha = process.argv[2];
  if (!senha) {
    console.error("Uso: tsx --env-file=.env scripts/seed-admin.ts <senha>");
    process.exit(1);
  }

  const existente = await prisma.usuario.findUnique({ where: { username } });
  if (existente) {
    console.log(`Usuário "${username}" já existe, nada a fazer.`);
    return;
  }

  await prisma.usuario.create({
    data: { username, senhaHash: hashSenha(senha), role: "ADMIN" },
  });
  console.log(`Usuário admin "${username}" criado.`);
}

main().finally(() => prisma.$disconnect());
