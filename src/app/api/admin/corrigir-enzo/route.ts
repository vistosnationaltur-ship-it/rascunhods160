import { NextResponse } from "next/server";
import { exigirAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { obterPaginas, buscarCampoPorId } from "@/lib/formulario-schema";

// Rota de uso único: corrige manualmente a data de nascimento do cliente
// Enzo Bordini Garutti (CPF 43342959835), cujo valor antigo salvo
// ("01/022003") era irrecuperável com segurança pela migração automática
// (scripts/migrar-data-nascimento.ts) — confirmado com a equipe: a data
// real é 01/fevereiro/2003. Admin-only. Remover esta rota depois de usada.

export async function POST() {
  try {
    await exigirAdmin();

    const paginas = await obterPaginas();
    const campo25 = buscarCampoPorId(paginas, 25);
    if (!campo25?.subCampos) throw new Error("Campo 25 sem sub-campos.");

    const idMes = campo25.subCampos.find((s) => /^m[êe]s/i.test(s.label.trim()))?.id;
    const idDia = campo25.subCampos.find((s) => /^dia/i.test(s.label.trim()))?.id;
    const idAno = campo25.subCampos.find((s) => /^ano/i.test(s.label.trim()))?.id;
    if (!idMes || !idDia || !idAno) throw new Error("Sub-campos Mês/Dia/Ano não encontrados.");

    const cliente = await prisma.clienteDs160.findFirst({ where: { cpf: "43342959835" } });
    if (!cliente) throw new Error("Cliente não encontrado (CPF 43342959835).");

    const respostas = cliente.respostas as Record<string, string | string[] | undefined>;
    await prisma.clienteDs160.update({
      where: { id: cliente.id },
      data: { respostas: { ...respostas, [idDia]: "01", [idMes]: "Fevereiro", [idAno]: "2003" } },
    });

    return NextResponse.json({ ok: true, nome: cliente.nome, cpf: cliente.cpf, gravado: { dia: "01", mes: "Fevereiro", ano: "2003" } });
  } catch (e) {
    return NextResponse.json({ erro: e instanceof Error ? e.message : String(e) }, { status: 400 });
  }
}
