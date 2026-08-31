"use server";

import type { Campo, Condicional, Opcao, SubCampo } from "@/lib/formulario-schema";
import { aplicarMudancaSchema } from "@/lib/formulario-persistencia";
import {
  novoGrupoLayout,
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
  colunaSpan: number | null;
  juntarNaLinhaAnterior: boolean;
};

// Edita um campo existente: label, ajuda, obrigatório, opções,
// sub-campos, tipo, condicional e layout (largura + linha compartilhada
// com o campo de cima). Não muda id nem a posição do campo. Passa pelo
// mesmo caminho das mudanças estruturais (valida + backup).
export async function salvarCampo(campoId: number, dados: DadosEdicaoCampo) {
  if (!TIPOS_CAMPO.includes(dados.tipo as TipoCampo)) {
    throw new Error(`Tipo de campo inválido: ${dados.tipo}.`);
  }

  await aplicarMudancaSchema(`editar campo #${campoId}`, (paginas) => {
    let paginaIdx = -1;
    let campoIdx = -1;
    paginas.forEach((pg, pi) => {
      const ci = pg.campos.findIndex((c) => c.id === campoId);
      if (ci !== -1) {
        paginaIdx = pi;
        campoIdx = ci;
      }
    });
    if (paginaIdx === -1) throw new Error(`Campo #${campoId} não encontrado.`);

    const pagina = paginas[paginaIdx];
    const atual = pagina.campos[campoIdx];

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

    // largura: só guarda quando é diferente de "linha inteira" (12).
    if (
      dados.colunaSpan &&
      dados.colunaSpan >= 1 &&
      dados.colunaSpan <= 11
    ) {
      atualizado.colunaSpan = dados.colunaSpan;
    } else {
      delete atualizado.colunaSpan;
    }

    // "mesma linha que o campo de cima": os dois precisam compartilhar o
    // grupoLayout. Seção não entra em grupo (o formulário do cliente pula).
    const anterior = campoIdx > 0 ? pagina.campos[campoIdx - 1] : undefined;
    const podeJuntar =
      dados.juntarNaLinhaAnterior &&
      dados.tipo !== "section" &&
      !!anterior &&
      anterior.tipo !== "section";

    let anteriorComGrupo: Campo | undefined;
    if (podeJuntar) {
      const grupo = anterior!.grupoLayout ?? novoGrupoLayout();
      atualizado.grupoLayout = grupo;
      if (!anterior!.grupoLayout) anteriorComGrupo = { ...anterior!, grupoLayout: grupo };
    } else {
      delete atualizado.grupoLayout;
    }

    return paginas.map((pg, pi) => {
      if (pi !== paginaIdx) return pg;
      return {
        ...pg,
        campos: pg.campos.map((c, ci) => {
          if (ci === campoIdx) return atualizado;
          if (anteriorComGrupo && ci === campoIdx - 1) return anteriorComGrupo;
          return c;
        }),
      };
    });
  });
}
