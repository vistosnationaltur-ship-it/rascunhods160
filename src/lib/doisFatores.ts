import { prisma } from "@/lib/prisma";
import { decifrarSegredoTotp, passoTotpValido } from "@/lib/totp";

const LIMITE_TENTATIVAS = 5;
const BLOQUEIO_MIN = 15;

export type ResultadoCodigo = { ok: true } | { ok: false; erro: string };

/**
 * Confere o código do app autenticador de um usuário: recusa código repetido (replay), conta
 * tentativas erradas e bloqueia por 15 min depois de 5 (6 dígitos sozinhos seriam adivinháveis
 * por força bruta). Serve tanto pro login quanto pra ativar/reiniciar o 2FA.
 */
export async function conferirCodigo2fa(usuarioId: string, codigo: string): Promise<ResultadoCodigo> {
  const usuario = await prisma.usuario.findUnique({ where: { id: usuarioId } });
  if (!usuario?.totpSecret) return { ok: false, erro: "2FA não configurado para este usuário." };

  const agora = new Date();
  if (usuario.totpBloqueadoAte && usuario.totpBloqueadoAte > agora) {
    const min = Math.ceil((usuario.totpBloqueadoAte.getTime() - agora.getTime()) / 60000);
    return { ok: false, erro: `Muitas tentativas erradas. Tente de novo em ${min} minuto${min === 1 ? "" : "s"}.` };
  }

  let passo: number | null = null;
  try {
    passo = passoTotpValido(decifrarSegredoTotp(usuario.totpSecret), codigo);
  } catch {
    return { ok: false, erro: "Não consegui ler a configuração do 2FA. Peça pra um administrador redefinir." };
  }

  if (passo === null || (usuario.totpUltimoPasso !== null && passo <= usuario.totpUltimoPasso)) {
    const tentativas = usuario.totpTentativas + 1;
    await prisma.usuario.update({
      where: { id: usuarioId },
      data:
        tentativas >= LIMITE_TENTATIVAS
          ? { totpTentativas: 0, totpBloqueadoAte: new Date(Date.now() + BLOQUEIO_MIN * 60_000) }
          : { totpTentativas: tentativas },
    });
    return { ok: false, erro: "Código incorreto ou já usado. Espere o próximo código do app e tente de novo." };
  }

  await prisma.usuario.update({
    where: { id: usuarioId },
    data: { totpUltimoPasso: passo, totpTentativas: 0, totpBloqueadoAte: null },
  });
  return { ok: true };
}
