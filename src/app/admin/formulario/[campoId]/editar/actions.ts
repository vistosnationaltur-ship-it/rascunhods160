"use server";

import type { Campo, Condicional, Opcao, SubCampo } from "@/lib/formulario-schema";
import { aplicarMudancaSchema } from "@/lib/formulario-persistencia";
import {
  substituirCampo,
  trocarTipo,
  TIPOS_CAMPO,
  TIPOS_COM_OPCOES,
  TIPOS_COM_SUBCAMPOS,
  type TipoCampo,
} from "@/lib/formulario-mutacoes";

export type DadosEdicaoCampo = {
  tipo: string;
  label: string;
  descricao: string;
  obrigatorio: boolean;
  opcoes: Opcao[];
  subCampos: SubCampo[];
  condicional: Condicional | null;
};

// Edita um campo existente: label, ajuda, obrigatório, opções,
// sub-campos, tipo e condicional. Não muda id nem a posição do campo.
// Passa pelo mesmo caminho das mudanças estruturais (valida + backup).
export async function salvarCampo(campoId: number, dados: DadosEdicaoCampo) {
  if (!TIPOS_CAMPO.includes(dados.tipo as TipoCampo)) {
    throw new Error(`Tipo de campo inválido: ${dados.tipo}.`);
  }

  await aplicarMudancaSchema(`editar campo #${campoId}`, (paginas) => {
    const atual = paginas.flatMap((p) => p.campos).find((c) => c.id === campoId);
    if (!atual) throw new Error(`Campo #${campoId} não encontrado.`);

    // trocarTipo primeiro pra herdar defaults coerentes com o novo tipo,
    // depois sobrescreve com o que veio do formulário.
    const base = trocarTipo(atual, dados.tipo as TipoCampo);
    const atualizado: Campo = {
      ...base,
      label: dados.label,
      obrigatorio: dados.obrigatorio,
    };

    if (dados.descricao) atualizado.descricao = dados.descricao;
    else delete atualizado.descricao;

    if (TIPOS_COM_OPCOES.includes(dados.tipo) && dados.opcoes.length > 0) {
      atualizado.opcoes = dados.opcoes;
    } else {
      delete atualizado.opcoes;
    }

    if (TIPOS_COM_SUBCAMPOS.includes(dados.tipo) && dados.subCampos.length > 0) {
      atualizado.subCampos = dados.subCampos;
    } else {
      delete atualizado.subCampos;
    }

    if (dados.condicional) atualizado.condicional = dados.condicional;
    else delete atualizado.condicional;

    return substituirCampo(paginas, campoId, atualizado);
  });
}
