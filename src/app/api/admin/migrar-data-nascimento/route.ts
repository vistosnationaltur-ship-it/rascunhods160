import { NextRequest, NextResponse } from "next/server";
import { exigirAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { obterPaginas, buscarCampoPorId } from "@/lib/formulario-schema";

// Rota de uso único: migra as respostas antigas do campo 25 ("Data de
// nascimento", formato flat "DDMMAAAA") pro novo formato com sub-campos
// (Mês/Dia/Ano), depois que os sub-campos foram adicionados via
// /admin/formulario. Mesma lógica de scripts/migrar-data-nascimento.ts,
// exposta como rota porque não há acesso local ao banco de produção
// (por design deste projeto — ver DOCUMENTACAO-INFRAESTRUTURA.md).
// Admin-only. Remover esta rota depois de usada uma vez.
//
// GET  = simula (não grava nada)
// POST = grava de verdade

const MESES = [
  "", "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

async function migrar(aplicar: boolean) {
  const paginas = await obterPaginas();
  const campo25 = buscarCampoPorId(paginas, 25);
  if (!campo25) throw new Error("Campo 25 não encontrado no schema.");
  if (!campo25.subCampos || campo25.subCampos.length === 0) {
    throw new Error('Campo 25 ainda não tem sub-campos. Adicione "Mês", "Dia" e "Ano" em /admin/formulario primeiro.');
  }

  const idMes = campo25.subCampos.find((s) => /^m[êe]s/i.test(s.label.trim()))?.id;
  const idDia = campo25.subCampos.find((s) => /^dia/i.test(s.label.trim()))?.id;
  const idAno = campo25.subCampos.find((s) => /^ano/i.test(s.label.trim()))?.id;
  if (!idMes || !idDia || !idAno) {
    throw new Error(
      `Não achei os 3 sub-campos esperados (Mês/Dia/Ano) — o que existe: ${campo25.subCampos.map((s) => s.label).join(", ")}`,
    );
  }

  const clientes = await prisma.clienteDs160.findMany({
    select: { id: true, nome: true, cpf: true, respostas: true },
  });

  const migrados: { nome: string; cpf: string | null; de: string; dia: string; mes: string; ano: string }[] = [];
  const problemas: { nome: string; cpf: string | null; valorBruto: string }[] = [];
  let jaTinhamNovo = 0;
  let semRespostaAntiga = 0;

  for (const cliente of clientes) {
    const respostas = cliente.respostas as Record<string, string | string[] | undefined>;
    const antigo = respostas["25"];

    if (typeof respostas[idMes] === "string" && (respostas[idMes] as string).trim()) {
      jaTinhamNovo++;
      continue;
    }
    if (typeof antigo !== "string" || !antigo.trim()) {
      semRespostaAntiga++;
      continue;
    }

    const match = /^(\d{2})(\d{2})(\d{4})$/.exec(antigo.trim());
    const mesNome = match ? MESES[Number(match[2])] : undefined;
    if (!match || !mesNome) {
      problemas.push({ nome: cliente.nome, cpf: cliente.cpf, valorBruto: antigo });
      continue;
    }

    const [, dia, , ano] = match;
    migrados.push({ nome: cliente.nome, cpf: cliente.cpf, de: antigo, dia, mes: mesNome, ano });

    if (aplicar) {
      await prisma.clienteDs160.update({
        where: { id: cliente.id },
        data: { respostas: { ...respostas, [idDia]: dia, [idMes]: mesNome, [idAno]: ano } },
      });
    }
  }

  return {
    aplicado: aplicar,
    totalClientes: clientes.length,
    migrados,
    jaTinhamNovo,
    semRespostaAntiga,
    problemas,
  };
}

export async function GET() {
  try {
    await exigirAdmin();
    const resultado = await migrar(false);
    return NextResponse.json(resultado);
  } catch (e) {
    return NextResponse.json({ erro: e instanceof Error ? e.message : String(e) }, { status: 400 });
  }
}

export async function POST(request: NextRequest) {
  void request;
  try {
    await exigirAdmin();
    const resultado = await migrar(true);
    return NextResponse.json(resultado);
  } catch (e) {
    return NextResponse.json({ erro: e instanceof Error ? e.message : String(e) }, { status: 400 });
  }
}
