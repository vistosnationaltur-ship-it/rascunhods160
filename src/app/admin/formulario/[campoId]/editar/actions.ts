"use server";

import { exigirAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Campo, Condicional, Opcao, Pagina } from "@/lib/formulario-schema";

export type DadosEdicaoCampo = {
  label: string;
  descricao: string;
  obrigatorio: boolean;
  opcoes: Opcao[];
  condicional: Condicional | null;
};

// Edita só o que já existe (label, descrição, obrigatório, opções,
// condicional) — não muda tipo, id, subCampos nem posição do campo.
// Guarda tudo de volta no schema único (FormularioSchema).
export async function salvarCampo(campoId: number, dados: DadosEdicaoCampo) {
  await exigirAdmin();

  const registro = await prisma.formularioSchema.findFirst();
  if (!registro) throw new Error("FormularioSchema não encontrado.");

  const paginas = registro.paginas as unknown as Pagina[];
  let encontrado = false;

  const paginasAtualizadas = paginas.map((pagina) => ({
    ...pagina,
    campos: pagina.campos.map((campo): Campo => {
      if (campo.id !== campoId) return campo;
      encontrado = true;
      const atualizado: Campo = {
        ...campo,
        label: dados.label,
        obrigatorio: dados.obrigatorio,
      };
      if (dados.descricao) atualizado.descricao = dados.descricao;
      else delete atualizado.descricao;

      if (dados.opcoes.length > 0) atualizado.opcoes = dados.opcoes;
      else delete atualizado.opcoes;

      if (dados.condicional) atualizado.condicional = dados.condicional;
      else delete atualizado.condicional;

      return atualizado;
    }),
  }));

  if (!encontrado) throw new Error(`Campo #${campoId} não encontrado.`);

  await prisma.formularioSchema.update({
    where: { id: registro.id },
    data: { paginas: paginasAtualizadas },
  });
}
