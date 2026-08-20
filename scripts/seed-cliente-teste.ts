import { prisma } from "@/lib/prisma";
import { hashSenha } from "@/lib/senha";

// Cliente de teste permanente pra QA — não apagar (pedido do usuário).
// Se já existir, só atualiza as respostas de exemplo.
async function main() {
  const email = "teste.qa@2ntravel.com.br";
  const cpf = "00000000000";

  const respostas = {
    "22": "Maria Teste Da Silva",
    "6": "Não",
    "24": "Feminino",
    "30": "Casado",
    "25": "15/09/1990",
    "26": "São José do Rio Preto",
    "27": "SP",
    "28": "Brasil",
    "35": "Brasil",
    "36": "Não",
  };

  await prisma.clienteDs160.upsert({
    where: { cpf },
    update: { respostas },
    create: {
      nome: "Maria Teste Da Silva",
      cpf,
      email,
      senhaHash: hashSenha("teste123"),
      telefone: "+5517988380346",
      respostas,
      paginaAtual: 2,
    },
  });
  console.log(`Cliente de teste pronto (email ${email} / senha teste123).`);
}

main().finally(() => prisma.$disconnect());
