/**
 * Migra as respostas antigas do campo 25 ("Data de nascimento") do formato
 * flat ("DDMMAAAA", ou texto livre malformado) pro novo formato com
 * sub-campos (Mês/Dia/Ano) — rodar DEPOIS de adicionar os 3 sub-campos ao
 * campo 25 pela tela /admin/formulario (rótulos exatos: "Mês", "Dia", "Ano").
 *
 * Não apaga a resposta antiga (chave "25" no JSON) — só escreve as novas
 * chaves (ex.: "25.1"/"25.2"/"25.3", os ids que a tela de admin gerou).
 * Clientes cujo valor antigo não é um "DDMMAAAA" limpo (8 dígitos) ficam de
 * fora e aparecem no relatório final pra correção manual — não tenta
 * adivinhar data de nascimento em documento de visto.
 *
 * Uso:
 *   npx tsx --env-file=.env scripts/migrar-data-nascimento.ts        (só mostra o que faria)
 *   npx tsx --env-file=.env scripts/migrar-data-nascimento.ts --aplicar   (grava de verdade)
 */
import { prisma } from "@/lib/prisma";
import { obterPaginas, buscarCampoPorId } from "@/lib/formulario-schema";

const MESES = [
  "", "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

async function main() {
  const aplicar = process.argv.includes("--aplicar");

  const paginas = await obterPaginas();
  const campo25 = buscarCampoPorId(paginas, 25);
  if (!campo25) throw new Error("Campo 25 não encontrado no schema.");
  if (!campo25.subCampos || campo25.subCampos.length === 0) {
    console.error(
      '❌ Campo 25 ainda não tem sub-campos. Adicione "Mês", "Dia" e "Ano" em /admin/formulario antes de rodar este script.',
    );
    process.exit(1);
  }

  const idMes = campo25.subCampos.find((s) => /^m[êe]s/i.test(s.label.trim()))?.id;
  const idDia = campo25.subCampos.find((s) => /^dia/i.test(s.label.trim()))?.id;
  const idAno = campo25.subCampos.find((s) => /^ano/i.test(s.label.trim()))?.id;
  if (!idMes || !idDia || !idAno) {
    console.error(
      `❌ Não achei os 3 sub-campos esperados (Mês/Dia/Ano) — o que existe: ${campo25.subCampos.map((s) => s.label).join(", ")}`,
    );
    process.exit(1);
  }

  const clientes = await prisma.clienteDs160.findMany({
    select: { id: true, nome: true, cpf: true, respostas: true },
  });

  let migrados = 0;
  let jaTinhamNovo = 0;
  let semRespostaAntiga = 0;
  const problemas: { nome: string; cpf: string | null; valorBruto: string }[] = [];

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

    const valor = antigo.trim();
    // Duas formas conhecidas de valor antigo bem-formado: "DDMMAAAA" (8
    // dígitos grudados, o padrão original do wizard) ou "DD/MM/AAAA" (já
    // com barras — apareceu em alguns clientes). Qualquer outra coisa
    // (ex.: "01/022003", faltando uma barra) vira "problema".
    const matchFlat = /^(\d{2})(\d{2})(\d{4})$/.exec(valor);
    const matchComBarras = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(valor);
    const match = matchFlat ?? matchComBarras;
    if (!match) {
      problemas.push({ nome: cliente.nome, cpf: cliente.cpf, valorBruto: antigo });
      continue;
    }

    const [, dia, mesNum, ano] = match;
    const mesNome = MESES[Number(mesNum)];
    if (!mesNome) {
      problemas.push({ nome: cliente.nome, cpf: cliente.cpf, valorBruto: antigo });
      continue;
    }

    console.log(`${aplicar ? "✅ Migrando" : "🔎 Migraria"}: ${cliente.nome} (${cliente.cpf}) — "${antigo}" -> Dia=${dia} Mês=${mesNome} Ano=${ano}`);
    migrados++;

    if (aplicar) {
      await prisma.clienteDs160.update({
        where: { id: cliente.id },
        data: {
          respostas: { ...respostas, [idDia]: dia, [idMes]: mesNome, [idAno]: ano },
        },
      });
    }
  }

  console.log("\n================================================");
  console.log(`${aplicar ? "Migrados" : "Migraria"}: ${migrados}`);
  console.log(`Já tinham o campo novo preenchido (pulados): ${jaTinhamNovo}`);
  console.log(`Sem resposta antiga (nada a migrar): ${semRespostaAntiga}`);
  console.log(`Precisam de correção manual (${problemas.length}):`);
  for (const p of problemas) {
    console.log(`  - ${p.nome} (${p.cpf ?? "sem CPF"}) — valor salvo: "${p.valorBruto}"`);
  }
  if (!aplicar && migrados > 0) {
    console.log("\nNada foi gravado ainda (modo simulação). Rode de novo com --aplicar pra gravar.");
  }
  console.log("================================================");
}

main().finally(() => prisma.$disconnect());
