import { NextResponse } from "next/server";
import { gerarPdfRascunho } from "@/lib/gerar-pdf";

// Rota temporária de diagnóstico — remover depois de descobrir o erro
// real do pdfkit em produção (a tela de conclusão só mostra sucesso ou
// falha genérica, sem detalhe, e não temos acesso aos logs da Vercel).
export async function GET() {
  try {
    const pdf = await gerarPdfRascunho({ nomeCliente: "Teste", email: "teste@teste.com", respostas: {} });
    return NextResponse.json({ ok: true, tamanho: pdf.length });
  } catch (e) {
    return NextResponse.json({
      ok: false,
      erro: e instanceof Error ? e.message : String(e),
      stack: e instanceof Error ? e.stack : undefined,
    });
  }
}
