import { NextResponse } from "next/server";
import { exigirAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { gerarPdfRascunho } from "@/lib/gerar-pdf";

// Gera o PDF na hora (não fica armazenado em disco/blob) — útil pra
// equipe baixar direto mesmo antes do e-mail estar configurado, ou pra
// conferir/baixar de novo depois.
export async function GET(_request: Request, props: RouteContext<"/admin/clientes/[id]/pdf">) {
  await exigirAdmin();

  const { id } = await props.params;
  const cliente = await prisma.clienteDs160.findUnique({ where: { id } });
  if (!cliente) {
    return NextResponse.json({ erro: "Cliente não encontrado." }, { status: 404 });
  }

  const pdf = await gerarPdfRascunho({
    nomeCliente: cliente.nome,
    email: cliente.email,
    respostas: (cliente.respostas as Record<string, string | string[]>) ?? {},
  });

  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="rascunho-ds160-${cliente.nome.replace(/\s+/g, "-")}.pdf"`,
    },
  });
}
