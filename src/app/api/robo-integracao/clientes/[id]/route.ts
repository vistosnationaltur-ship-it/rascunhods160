import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { obterPaginas, type Campo } from "@/lib/formulario-schema";

// Endpoint isolado, só-leitura, criado pro robô de automação DS-160
// (repo `automacao-ds160`) buscar as respostas de um cliente já
// estruturadas, em vez de extrair de um PDF gerado (regex frágil).
// Não altera nada existente do módulo de rascunho.
//
// Autenticação por segredo compartilhado: header
// "Authorization: Bearer <ROBO_API_SECRET>".
//
// Devolve os valores já resolvidos por campo (id do FormularioSchema):
// - texto/radio/select/textarea/email/number/phone/checkbox/consent -> string
// - date -> sempre normalizado pra "DD/MM/AAAA" (campo sem subCampos já
//   vem gravado como "DDMMAAAA" pelo wizard; campo com subCampos usa os
//   labels "Dia"/"Mês"/"Ano" pra montar na ordem certa, já que a ordem de
//   gravação dos subCampos varia campo a campo)
// - address -> objeto { [labelDoSubCampo]: valor }, ex.: { "Rua": "...",
//   "Cidade": "...", "País": "..." }
function normalizarData(campo: Campo, valorBruto: unknown, respostas: Record<string, unknown>): string {
  if (campo.subCampos && campo.subCampos.length > 0) {
    const porLabel: Record<string, string> = {};
    for (const sub of campo.subCampos) {
      const v = respostas[sub.id];
      if (typeof v === "string" && v) porLabel[sub.label.toLowerCase()] = v;
    }
    const dia = porLabel["dia"] ?? "";
    const mes = porLabel["mês"] ?? porLabel["mes"] ?? "";
    const ano = porLabel["ano"] ?? "";
    if (!dia || !mes || !ano) return "";
    return `${dia.padStart(2, "0")}/${mes.padStart(2, "0")}/${ano}`;
  }
  // Campo de data "flat" (sem subCampos): gravado como "DDMMAAAA" pelo wizard.
  if (typeof valorBruto === "string" && /^\d{8}$/.test(valorBruto)) {
    return `${valorBruto.slice(0, 2)}/${valorBruto.slice(2, 4)}/${valorBruto.slice(4, 8)}`;
  }
  return typeof valorBruto === "string" ? valorBruto : "";
}

function normalizarEndereco(campo: Campo, respostas: Record<string, unknown>): Record<string, string> {
  const resultado: Record<string, string> = {};
  for (const sub of campo.subCampos ?? []) {
    const v = respostas[sub.id];
    if (typeof v === "string" && v) resultado[sub.label] = v;
  }
  return resultado;
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const secret = process.env.ROBO_API_SECRET;
  if (!secret) {
    return NextResponse.json({ erro: "ROBO_API_SECRET não configurada." }, { status: 500 });
  }
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ erro: "Não autorizado." }, { status: 401 });
  }

  const { id } = await params;

  const cliente = await prisma.clienteDs160.findFirst({
    where: { OR: [{ id }, { cpf: id.replace(/\D/g, "") }] },
  });
  if (!cliente) {
    return NextResponse.json({ erro: "Cliente não encontrado." }, { status: 404 });
  }

  const paginas = await obterPaginas();
  const respostas = cliente.respostas as Record<string, unknown>;

  const porId: Record<string, { label: string; tipo: string; valor: string | Record<string, string> }> = {};
  for (const pagina of paginas) {
    for (const campo of pagina.campos) {
      if (campo.tipo === "section" || campo.tipo === "page") continue;
      const idStr = String(campo.id);

      if (campo.tipo === "date") {
        const valor = normalizarData(campo, respostas[idStr], respostas);
        if (valor) porId[idStr] = { label: campo.label, tipo: campo.tipo, valor };
        continue;
      }
      if (campo.tipo === "address") {
        const valor = normalizarEndereco(campo, respostas);
        if (Object.keys(valor).length > 0) porId[idStr] = { label: campo.label, tipo: campo.tipo, valor };
        continue;
      }
      const bruto = respostas[idStr];
      if (typeof bruto === "string" && bruto !== "") {
        porId[idStr] = { label: campo.label, tipo: campo.tipo, valor: bruto };
      }
    }
  }

  return NextResponse.json({
    id: cliente.id,
    nome: cliente.nome,
    cpf: cliente.cpf,
    telefone: cliente.telefone,
    flowClienteId: cliente.flowClienteId,
    status: cliente.status,
    respostas: porId,
  });
}
