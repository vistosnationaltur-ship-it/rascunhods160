import { prisma } from "@/lib/prisma";

// Apaga a verificação em duas etapas de um usuário (perdeu o celular, trocou de aparelho sem
// reconfigurar). No próximo login ele entra só com a senha e é obrigado a configurar de novo.
//
// Uso (com o .env de produção):
//   npx tsx --env-file=.env scripts/resetar-2fa.ts <username>
async function main() {
  const username = process.argv[2];
  if (!username) {
    console.error("Uso: npx tsx scripts/resetar-2fa.ts <username>");
    process.exit(1);
  }

  const usuario = await prisma.usuario.findUnique({ where: { username } });
  if (!usuario) {
    console.error(`Usuário "${username}" não encontrado.`);
    process.exit(1);
  }

  await prisma.usuario.update({
    where: { id: usuario.id },
    data: {
      totpSecret: null,
      totpAtivadoEm: null,
      totpUltimoPasso: null,
      totpTentativas: 0,
      totpBloqueadoAte: null,
    },
  });
  console.log(`2FA de "${username}" redefinido. No próximo login ele configura de novo.`);
}

main()
  .catch((erro) => {
    console.error(erro);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
