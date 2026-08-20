import { prisma } from "@/lib/prisma";
import { hashSenha } from "@/lib/senha";

async function main() {
  const email = "teste.qa@2ntravel.com.br";
  const existente = await prisma.clienteDs160.findUnique({ where: { email } });
  if (existente) {
    console.log("Cliente de teste já existe, nada a fazer.");
    return;
  }

  await prisma.clienteDs160.create({
    data: {
      nome: "Cliente Teste QA",
      cpf: "00000000000",
      email,
      senhaHash: hashSenha("teste123"),
      telefone: "+5517988380346",
    },
  });
  console.log(`Cliente de teste criado (email ${email} / senha teste123).`);
}

main().finally(() => prisma.$disconnect());
