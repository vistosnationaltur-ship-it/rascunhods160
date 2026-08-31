import { NextResponse } from "next/server";
import { exigirAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Baixa o schema inteiro do formulário (páginas/campos/opções/
// condicionais/layout) como JSON, pra guardar uma cópia offline em
// backups/. NÃO inclui dado de cliente. Restaura com
// `scripts/restaurar-schema.ts`.
export async function GET() {
  await exigirAdmin();

  const registro = await prisma.formularioSchema.findFirst();
  if (!registro) {
    return NextResponse.json({ erro: "FormularioSchema não encontrado." }, { status: 404 });
  }

  const corpo = JSON.stringify(
    {
      geradoEm: new Date().toISOString(),
      formularioSchemaId: registro.id,
      atualizadoEm: registro.atualizadoEm,
      paginas: registro.paginas,
    },
    null,
    2,
  );

  const data = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
  return new NextResponse(corpo, {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="formulario-schema-${data}.json"`,
    },
  });
}
