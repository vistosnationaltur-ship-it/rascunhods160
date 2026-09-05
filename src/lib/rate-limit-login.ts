import { prisma } from "@/lib/prisma";

// Bloqueio simples contra força-bruta de senha no login (admin e
// cliente) — sem infra nova, só uma tabela no mesmo Postgres. Depois de
// LIMITE_TENTATIVAS senhas erradas seguidas pro mesmo identificador
// (e-mail do cliente ou username do admin), bloqueia por
// DURACAO_BLOQUEIO_MIN minutos. Zera o contador a cada login certo.
const LIMITE_TENTATIVAS = 5;
const DURACAO_BLOQUEIO_MIN = 15;

export type Contexto = "cliente" | "staff";

export type StatusBloqueio = { bloqueado: false } | { bloqueado: true; minutosRestantes: number };

export async function verificarBloqueio(identificador: string, contexto: Contexto): Promise<StatusBloqueio> {
  const registro = await prisma.tentativaLogin.findUnique({
    where: { identificador_contexto: { identificador: identificador.toLowerCase(), contexto } },
  });
  if (!registro?.bloqueadoAte || registro.bloqueadoAte <= new Date()) {
    return { bloqueado: false };
  }
  const minutosRestantes = Math.ceil((registro.bloqueadoAte.getTime() - Date.now()) / 60000);
  return { bloqueado: true, minutosRestantes };
}

export async function registrarTentativaFalha(identificador: string, contexto: Contexto): Promise<void> {
  const chave = identificador.toLowerCase();
  const atual = await prisma.tentativaLogin.upsert({
    where: { identificador_contexto: { identificador: chave, contexto } },
    create: { identificador: chave, contexto, tentativas: 1 },
    update: { tentativas: { increment: 1 } },
  });

  if (atual.tentativas >= LIMITE_TENTATIVAS) {
    await prisma.tentativaLogin.update({
      where: { identificador_contexto: { identificador: chave, contexto } },
      data: {
        tentativas: 0,
        bloqueadoAte: new Date(Date.now() + DURACAO_BLOQUEIO_MIN * 60_000),
      },
    });
  }
}

export async function registrarLoginOk(identificador: string, contexto: Contexto): Promise<void> {
  await prisma.tentativaLogin.deleteMany({
    where: { identificador: identificador.toLowerCase(), contexto },
  });
}

export function mensagemBloqueio(status: Extract<StatusBloqueio, { bloqueado: true }>): string {
  const minutos = status.minutosRestantes;
  return `Muitas tentativas erradas. Tente de novo em ${minutos} minuto${minutos === 1 ? "" : "s"}.`;
}
