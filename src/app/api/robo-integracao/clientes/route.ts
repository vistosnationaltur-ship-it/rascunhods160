import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Busca por nome ou CPF, pro robô (fonte_dados_api.py) listar candidatos
// quando o operador não sabe o CPF de cor — mesmo padrão da busca
// Flow -> ds160-rascunho já existente (api/ds160-rascunho/clientes).
//
// Autenticação por segredo compartilhado: header
// "Authorization: Bearer <ROBO_API_SECRET>".
export async function GET(request: NextRequest) {
  const secret = process.env.ROBO_API_SECRET;
  if (!secret) {
    return NextResponse.json({ erro: "ROBO_API_SECRET não configurada." }, { status: 500 });
  }
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ erro: "Não autorizado." }, { status: 401 });
  }

  const q = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) {
    return NextResponse.json({ erro: "Informe pelo menos 2 caracteres em ?q=" }, { status: 400 });
  }

  const clientes = await prisma.clienteDs160.findMany({
    where: {
      OR: [
        { nome: { contains: q, mode: "insensitive" } },
        { cpf: { contains: q.replace(/\D/g, "") || "___NUNCA_BATE___" } },
      ],
    },
    select: { id: true, nome: true, cpf: true, status: true, flowClienteId: true },
    take: 10,
    orderBy: { nome: "asc" },
  });

  return NextResponse.json({ clientes });
}
