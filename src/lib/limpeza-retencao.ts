import { prisma } from "@/lib/prisma";

// Política de retenção do rascunho DS160 — duas regras, avaliadas todo dia pelo cron:
//
// 1) Depois de "Passaporte devolvido" no Flow (decidido com a 2N em 2026-09-23): o Flow agenda
//    `excluirApos` = devolução + 30 dias (rota /api/flow-integracao/agendar-exclusao) e o rascunho
//    é apagado quando essa data passa. Só o rascunho: o cadastro no Flow segue ativo.
// 2) Rede de segurança (2026-09-04): rascunho CONCLUIDO há mais de 6 meses é apagado mesmo sem o
//    Flow ter avisado (ex.: Flow fora do ar na devolução). Quem ainda está em preenchimento não
//    é tocado por esta regra, não importa a idade.
const MESES_RETENCAO = 6;

export type ClienteExcluido = {
  id: string;
  nome: string;
  email: string;
  concluidoEm: Date | null;
  motivo: "passaporte-devolvido" | "6-meses";
};

export async function limparClientesAntigos(): Promise<ClienteExcluido[]> {
  const agora = new Date();
  const corte = new Date();
  corte.setMonth(corte.getMonth() - MESES_RETENCAO);

  const candidatos = await prisma.clienteDs160.findMany({
    where: {
      OR: [
        { excluirApos: { lte: agora } },
        { status: "CONCLUIDO", concluidoEm: { lte: corte } },
      ],
    },
    select: { id: true, nome: true, email: true, concluidoEm: true, excluirApos: true },
  });

  if (candidatos.length === 0) return [];

  await prisma.clienteDs160.deleteMany({
    where: { id: { in: candidatos.map((c) => c.id) } },
  });

  return candidatos.map((c) => ({
    id: c.id,
    nome: c.nome,
    email: c.email,
    concluidoEm: c.concluidoEm,
    motivo: c.excluirApos && c.excluirApos <= agora ? "passaporte-devolvido" : "6-meses",
  }));
}
