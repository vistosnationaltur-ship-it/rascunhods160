import { NextResponse } from "next/server";
import { exigirAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { obterPaginas, buscarCampoPorId, type Condicional } from "@/lib/formulario-schema";
import { registrarBackup } from "@/lib/formulario-backup";
import { CAMPO_ID_IDADE } from "@/lib/idade";

// Rota de uso único: a página do Cônjuge (campos 175/176) já tem uma
// condicional pra esconder quando "Estado Civil" (campo 30) é "Solteiro"
// (acao: "esconder", tipoLogica: "qualquer"), mas não considera idade -
// um menor de 14 anos preenchido com Estado Civil diferente de "Solteiro"
// (ou ainda não respondido) faz essa pergunta aparecer sem sentido, igual
// as de trabalho/escolaridade (ver aplicar-idade-minima-trabalho, já
// removida). Pedido do usuário em 2026-09-23 depois de testar com uma
// criança. Como a condicional já é "esconder" + "qualquer" (OR), só
// precisa ACRESCENTAR mais uma regra de OR ("esconder também se menor de
// 14") em vez de criar uma condicional nova - compõe direitinho.
//
// Admin-only. Remover esta rota depois de usada uma vez.
//
// GET  = simula (mostra o que mudaria, não grava nada)
// POST = grava de verdade

const REGRA_MENOR_DE_14 = { campoId: CAMPO_ID_IDADE, operador: "menor_que", valor: "14" };
const IDS_ALVO = [175, 176];

function condicionalComIdade(atual: Condicional | undefined): { nova: Condicional; pulado?: string } {
  if (!atual) {
    // Não esperado pra esses 2 campos (já têm condicional de Estado
    // Civil), mas por segurança: sem condicional prévia, não dá pra
    // "esconder também se X" sem já esconder tudo - fica de fora.
    return { nova: { acao: "esconder", tipoLogica: "qualquer", regras: [REGRA_MENOR_DE_14] }, pulado: undefined };
  }
  if (atual.acao !== "esconder" || atual.tipoLogica !== "qualquer") {
    return { nova: atual, pulado: `acao/tipoLogica inesperados (${atual.acao}/${atual.tipoLogica}) - precisa de ajuste manual` };
  }
  if (atual.regras.some((r) => r.campoId === CAMPO_ID_IDADE)) {
    return { nova: atual, pulado: "já tem a regra de idade" };
  }
  return { nova: { ...atual, regras: [...atual.regras, REGRA_MENOR_DE_14] } };
}

async function processar() {
  const paginas = await obterPaginas();
  const resultado: { id: number; label: string; acao: string; antes: unknown; depois: unknown }[] = [];
  const naoEncontrados: number[] = [];

  for (const id of IDS_ALVO) {
    const campo = buscarCampoPorId(paginas, id);
    if (!campo) {
      naoEncontrados.push(id);
      continue;
    }
    const { nova, pulado } = condicionalComIdade(campo.condicional);
    resultado.push({
      id,
      label: campo.label,
      acao: pulado ? `PULADO (${pulado})` : "regra de idade acrescentada",
      antes: campo.condicional ?? null,
      depois: pulado ? campo.condicional ?? null : nova,
    });
  }

  return { paginas, resultado, naoEncontrados };
}

export async function GET() {
  await exigirAdmin();
  const { resultado, naoEncontrados } = await processar();
  return NextResponse.json({ simulacao: true, resultado, naoEncontrados }, { status: 200 });
}

export async function POST() {
  await exigirAdmin();
  const { paginas, resultado, naoEncontrados } = await processar();

  const registro = await prisma.formularioSchema.findFirst();
  if (!registro) throw new Error("FormularioSchema não encontrado.");

  await registrarBackup(paginas, "Rota de uso único: idade mínima (14 anos) pra pergunta de cônjuge");

  const paginasAtualizadas = paginas.map((pagina) => ({
    ...pagina,
    campos: pagina.campos.map((campo) => {
      const item = resultado.find((r) => r.id === campo.id && !r.acao.startsWith("PULADO"));
      if (!item) return campo;
      return { ...campo, condicional: item.depois as Condicional };
    }),
  }));

  await prisma.formularioSchema.update({
    where: { id: registro.id },
    data: { paginas: paginasAtualizadas },
  });

  return NextResponse.json({ aplicado: true, resultado, naoEncontrados }, { status: 200 });
}
