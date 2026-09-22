import { NextResponse } from "next/server";
import { exigirAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { obterPaginas, buscarCampoPorId, type Condicional } from "@/lib/formulario-schema";
import { registrarBackup } from "@/lib/formulario-backup";
import { CAMPO_ID_IDADE } from "@/lib/idade";

// Rota de uso único: no DS-160 oficial, as perguntas de ocupação atual,
// empregos anteriores, escolaridade e viagens dos últimos 5 anos (páginas
// 11 a 14 do wizard) não se aplicam a menor de 14 anos. Hoje isso só
// "funciona" de vez em quando, dependendo do que o admin escolhe em
// "Atividade Atual" pra uma criança — pedido do usuário em 2026-09-23 pra
// automatizar isso de verdade usando a data de nascimento (ver
// src/lib/idade.ts). Só falta acrescentar a condicional de idade mínima
// nos campos "raiz" de cada bloco (o resto já esconde sozinho quando o
// campo raiz esconde, porque a resposta dele é limpa - ver
// limparRespostasDeCamposEscondidos em PaginaWizard.tsx).
//
// Admin-only. Remover esta rota depois de usada uma vez.
//
// GET  = simula (mostra o que mudaria, não grava nada)
// POST = grava de verdade

const REGRA_IDADE_MINIMA = { campoId: CAMPO_ID_IDADE, operador: "maior_ou_igual", valor: "14" };

// Campos "raiz" de cada bloco de trabalho/escolaridade/viagens (páginas
// 11-14): ou não têm condicional nenhuma hoje (o gatilho da seção), ou
// têm uma que já é "todas" (AND) e dá pra só acrescentar a regra de idade
// nela. Campos com condicional "qualquer" (OR) ficam de fora de propósito
// - ver comentário em `aplicarEm` abaixo.
const IDS_ALVO = [199, 198, 349, 350, 205, 207, 351, 352, 216, 217, 224, 227, 229, 230];

function condicionalComIdade(atual: Condicional | undefined): { nova: Condicional; pulado?: string } {
  if (!atual) {
    return { nova: { acao: "mostrar", tipoLogica: "todas", regras: [REGRA_IDADE_MINIMA] } };
  }
  if (atual.tipoLogica === "qualquer") {
    // Regras "qualquer" (OR) não combinam direito com um AND adicional
    // sem suporte a lógica aninhada, que o schema não tem - fica de fora,
    // reportado como pulado pra decisão manual.
    return { nova: atual, pulado: `tipoLogica "qualquer" - precisa de ajuste manual` };
  }
  if (atual.regras.some((r) => r.campoId === CAMPO_ID_IDADE)) {
    return { nova: atual, pulado: "já tem a regra de idade" };
  }
  return { nova: { ...atual, regras: [...atual.regras, REGRA_IDADE_MINIMA] } };
}

async function processar() {
  const paginas = await obterPaginas();
  const resultado: { id: number; label: string; pagina: string; acao: string; antes: unknown; depois: unknown }[] = [];
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
      pagina: paginas.find((p) => p.campos.some((c) => c.id === id))?.titulo ?? "?",
      acao: pulado ? `PULADO (${pulado})` : campo.condicional ? "regra de idade acrescentada" : "condicional nova criada",
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

  await registrarBackup(paginas, "Rota de uso único: idade mínima (14 anos) pra trabalho/escolaridade/viagens");

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
