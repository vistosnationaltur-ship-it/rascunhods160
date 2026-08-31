import { NextResponse } from "next/server";
import { exigirAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Pagina } from "@/lib/formulario-schema";

// ROTA TEMPORÁRIA — ajuste pontual do schema da página do Cônjuge:
//   - "Local de Nascimento" (#178) vira só "Cidade"
//   - "Local de Nascimento 2" (#191) idem
//   - remove os campos de endereço residencial do cônjuge (#181, #182, #192)
//
// GET /admin/formulario/ajuste-conjuge            -> dry-run (mostra o que muda)
// GET /admin/formulario/ajuste-conjuge?confirmar=sim -> aplica
//
// Remover este arquivo depois de aplicar em produção.

const REMOVER_IDS = new Set([181, 182, 192]);

type Campo = Pagina["campos"][number] & { subCampos?: { id: string; label: string }[] };

export async function GET(request: Request) {
  await exigirAdmin();

  const confirmar = new URL(request.url).searchParams.get("confirmar") === "sim";

  const registro = await prisma.formularioSchema.findFirst();
  if (!registro) {
    return NextResponse.json({ erro: "FormularioSchema não encontrado." }, { status: 404 });
  }

  const paginas = registro.paginas as unknown as Pagina[];
  const clone: Pagina[] = JSON.parse(JSON.stringify(paginas));

  const pagina = clone.find((p) => p.campos.some((c) => c.id === 178));
  if (!pagina) {
    return NextResponse.json({ erro: "Página do cônjuge (campo 178) não encontrada." }, { status: 500 });
  }

  const jaAplicado = !pagina.campos.some((c) => REMOVER_IDS.has(c.id));
  const local = pagina.campos.find((c) => c.id === 178) as Campo | undefined;
  const local2 = pagina.campos.find((c) => c.id === 191) as Campo | undefined;

  if (jaAplicado && local?.subCampos?.length === 1) {
    return NextResponse.json({
      status: "ja-aplicado",
      mensagem: "O ajuste já foi aplicado antes. Pode remover esta rota.",
      pagina: pagina.titulo,
      campos: pagina.campos.map((c) => ({ id: c.id, label: c.label, tipo: c.tipo })),
    });
  }

  const mudancas: string[] = [];
  const backupCamposRemovidos: unknown[] = [];

  if (local && local.tipo === "address") {
    mudancas.push(
      `#178 "${local.label}" [${local.subCampos?.map((s) => s.label).join(", ")}] -> "Cidade de Nascimento do Cônjuge" [Cidade]`,
    );
    local.label = "Cidade de Nascimento do Cônjuge";
    local.subCampos = [{ id: "178.3", label: "Cidade" }];
  }

  if (local2 && local2.tipo === "address") {
    mudancas.push(
      `#191 "${local2.label}" [${local2.subCampos?.map((s) => s.label).join(", ")}] -> "Cidade de Nascimento 2" [Cidade]`,
    );
    local2.label = "Cidade de Nascimento 2";
    local2.subCampos = [{ id: "191.3", label: "Cidade" }];
  }

  const antes = pagina.campos.length;
  pagina.campos = pagina.campos.filter((c) => {
    if (REMOVER_IDS.has(c.id)) {
      mudancas.push(`removido #${c.id} "${c.label}" (${c.tipo})`);
      backupCamposRemovidos.push(c);
      return false;
    }
    return true;
  });
  mudancas.push(`campos na página: ${antes} -> ${pagina.campos.length}`);

  // Sanidade: nenhuma condicional pode continuar apontando pra um id removido.
  const orfas: string[] = [];
  for (const p of clone) {
    for (const c of p.campos) {
      for (const r of c.condicional?.regras ?? []) {
        if (REMOVER_IDS.has(Number(r.campoId))) orfas.push(`#${c.id} "${c.label}" usa #${r.campoId}`);
      }
    }
  }
  if (orfas.length) {
    return NextResponse.json({ erro: "Condicionais órfãs após remoção", orfas }, { status: 500 });
  }

  if (!confirmar) {
    return NextResponse.json({
      status: "dry-run",
      mensagem: "Nada foi gravado. Acesse com ?confirmar=sim para aplicar.",
      pagina: pagina.titulo,
      mudancas,
    });
  }

  await prisma.formularioSchema.update({
    where: { id: registro.id },
    data: { paginas: clone as unknown as object },
  });

  return NextResponse.json({
    status: "aplicado",
    mensagem: "Schema atualizado. Remover esta rota agora.",
    pagina: pagina.titulo,
    mudancas,
    backupCamposRemovidos,
  });
}
