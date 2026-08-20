import { paginas, type Campo } from "@/lib/formulario-schema";
import { campoVisivel } from "@/lib/condicional";

type Valor = string | string[] | undefined;
export type Respostas = Record<string, Valor>;

export type ItemResposta = { campo: Campo; texto: string };
export type PaginaComRespostas = { titulo: string; itens: ItemResposta[] };

// Usado tanto no PDF (src/lib/gerar-pdf.ts) quanto na tela de detalhe do
// cliente no admin — mesma lógica de "o que mostrar" em um só lugar.
export function respostasPorPagina(respostas: Respostas): PaginaComRespostas[] {
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
  if (campo.subCampos && campo.subCampos.length > 0) {
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
  if (Array.isArray(valor)) return valor.join(", ");

  if (campo.opcoes) {
    const opcao = campo.opcoes.find((o) => o.valor === valor);
    if (opcao) return opcao.texto;
  }
  if (campo.tipo === "consent") return valor === "1" ? "Sim, concordou." : "";

  return valor;
}
