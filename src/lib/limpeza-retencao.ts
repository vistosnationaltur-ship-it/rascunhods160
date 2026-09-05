import { prisma } from "@/lib/prisma";

// Política de retenção (decidida com o usuário em 2026-09-04): entrevista
// do visto pode demorar até uns 5 meses depois do rascunho concluído, então
// 6 meses dá uma margem de segurança antes de apagar os dados do cliente.
// Só mexe em rascunho CONCLUIDO — quem ainda está em preenchimento não é
// tocado, não importa a idade.
const MESES_RETENCAO = 6;

export type ClienteExcluido = { id: string; nome: string; email: string; concluidoEm: Date };

export async function limparClientesAntigos(): Promise<ClienteExcluido[]> {
  const corte = new Date();
  corte.setMonth(corte.getMonth() - MESES_RETENCAO);

  const candidatos = await prisma.clienteDs160.findMany({
    where: { status: "CONCLUIDO", concluidoEm: { lte: corte } },
    select: { id: true, nome: true, email: true, concluidoEm: true },
  });

  if (candidatos.length === 0) return [];

  await prisma.clienteDs160.deleteMany({
    where: { id: { in: candidatos.map((c) => c.id) } },
  });

  return candidatos.map((c) => ({ ...c, concluidoEm: c.concluidoEm! }));
}
