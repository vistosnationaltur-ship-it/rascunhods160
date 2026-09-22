import type { Campo, Pagina } from "@/lib/formulario-schema";
import { campoVisivel } from "@/lib/condicional";

type Valor = string | string[] | undefined;
export type Respostas = Record<string, Valor>;

export type ItemResposta = { campo: Campo; texto: string };
export type PaginaComRespostas = { titulo: string; itens: ItemResposta[] };

// Usado tanto no PDF (src/lib/gerar-pdf.ts) quanto na tela de detalhe do
// cliente no admin — mesma lógica de "o que mostrar" em um só lugar.
export function respostasPorPagina(paginas: Pagina[], respostas: Respostas): PaginaComRespostas[] {
  return paginas
    .map((pagina) => {
      const itens = pagina.campos
        .filter((c) => c.tipo !== "page" && c.tipo !== "section" && campoVisivel(c, respostas))
        .map((campo) => ({ campo, texto: formatarResposta(campo, respostas) }));
      return { titulo: pagina.titulo, itens };
    })
    .filter((p) => p.itens.length > 0);
}

export function formatarResposta(campo: Campo, respostas: Respostas): string {
  // subCampos só guarda a resposta de verdade em "date" e "address" (dia/mês/ano, rua/número...:
  // CampoRenderer.tsx escreve em respostas[sub.id] pra esses dois). Em "checkbox" o campo inteiro é herdado
  // do Gravity Forms original e carrega um "subCampos" que NUNCA é escrito - quem guarda a resposta é o
  // próprio campo.id, como um array das opções marcadas. Achando subCampos aqui pra um checkbox, o código
  // sempre lia chaves vazias (338.1, 338.2...) e mostrava "não respondido" mesmo com a resposta salva
  // certinha (bug real, achado e corrigido em 2026-09-22: afetava as 4 perguntas do tipo checkbox do
  // formulário - "Habilitação Americana", "Visto recusado", "ESTA negado" e "mais de uma empresa/emprego").
  if (campo.tipo !== "checkbox" && campo.subCampos && campo.subCampos.length > 0) {
    return campo.subCampos
      .map((sub) => {
        const v = respostas[sub.id];
        return v ? `${sub.label}: ${Array.isArray(v) ? v.join(", ") : v}` : null;
      })
      .filter(Boolean)
      .join(" · ");
  }

  const valor = respostas[String(campo.id)];
  if (valor === undefined || valor === null || valor === "") return "";
  if (Array.isArray(valor)) {
    if (valor.length === 0) return "";
    if (campo.opcoes) {
      return valor.map((v) => campo.opcoes!.find((o) => o.valor === v)?.texto ?? v).join(", ");
    }
    return valor.join(", ");
  }

  if (campo.opcoes) {
    const opcao = campo.opcoes.find((o) => o.valor === valor);
    if (opcao) return opcao.texto;
  }
  if (campo.tipo === "consent") return valor === "1" ? "Sim, concordou." : "";

  return valor;
}
