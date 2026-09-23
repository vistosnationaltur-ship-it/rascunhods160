import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apenasDigitos } from "@/lib/senha";

// Chamado pelo Flow quando o passo "Passaporte devolvido" é dado (agendar) ou desfeito
// (cancelar). Política de retenção (2026-09-23): 30 dias depois da devolução, o rascunho DS160
// dessa pessoa é apagado aqui — só o rascunho; o cadastro no Flow continua. Quem apaga é o cron
// diário (src/lib/limpeza-retencao.ts); esta rota só marca/desmarca a data.
//
// Acha o rascunho por flowClienteId ou pelo CPF (só dígitos). Mesmo segredo compartilhado
// (FLOW_API_SECRET) das outras rotas de /api/flow-integracao.
export async function POST(request: NextRequest) {
  const secret = process.env.FLOW_API_SECRET;
  if (!secret) {
    return NextResponse.json({ erro: "FLOW_API_SECRET não configurada." }, { status: 500 });
  }
  if (request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ erro: "Não autorizado." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const flowClienteId = typeof body?.flowClienteId === "string" && body.flowClienteId ? body.flowClienteId : null;
  const cpf = typeof body?.cpf === "string" ? apenasDigitos(body.cpf) : "";
  const acao = body?.acao;
  if ((acao !== "agendar" && acao !== "cancelar") || (!flowClienteId && cpf.length !== 11)) {
    return NextResponse.json({ erro: "Informe acao (agendar|cancelar) e flowClienteId ou cpf." }, { status: 400 });
  }

  const dias = Math.min(Math.max(Number(body?.dias) || 30, 1), 365);
  const excluirApos = acao === "agendar" ? new Date(Date.now() + dias * 24 * 60 * 60 * 1000) : null;

  const filtros = [
    ...(flowClienteId ? [{ flowClienteId }] : []),
    ...(cpf.length === 11 ? [{ cpf }] : []),
  ];
  const { count } = await prisma.clienteDs160.updateMany({ where: { OR: filtros }, data: { excluirApos } });

  return NextResponse.json({ ok: true, atualizados: count, excluirApos });
}
