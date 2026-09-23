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
  // CampoRenderer.tsx escreve em respostas[sub.id] pra esses dois). Vários campos "radio"/"checkbox"
  // herdados do Gravity Forms original carregam um "subCampos" que NUNCA é escrito - quem guarda a
  // resposta é o próprio campo.id (valor único pra radio, array pra checkbox). Achando subCampos aqui
  // pra esses campos, o código sempre lia chaves vazias (338.1, 338.2...) e mostrava "não respondido"
  // mesmo com a resposta salva certinha. A correção de 2026-09-22 só excluiu "checkbox" dessa lógica,
  // mas os campos afetados na prática ("Habilitação Americana", "Visto recusado", "ESTA negado") são
  // do tipo "radio" — por isso a tentativa anterior não teve efeito. Corrigido em 2026-09-23 trocando
  // a blacklist por uma whitelist dos únicos dois tipos que de fato usam subCampos.
  if ((campo.tipo === "date" || campo.tipo === "address") && campo.subCampos && campo.subCampos.length > 0) {
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
