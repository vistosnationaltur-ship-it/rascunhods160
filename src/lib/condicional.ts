import type { Campo, Regra } from "./formulario-schema";

export type Respostas = Record<string, string | string[] | undefined>;

function valorComoTexto(valor: Respostas[string]): string {
  if (Array.isArray(valor)) return valor.join(",");
  return valor ?? "";
}

// Mesma semântica de operadores do Gravity Forms usada neste formulário
// (só "is" aparece no export original — os outros ficam prontos caso
// apareçam numa condicional nova adicionada depois).
function regraSatisfeita(regra: Regra, respostas: Respostas): boolean {
  const valorAtual = valorComoTexto(respostas[String(regra.campoId)]);
  switch (regra.operador) {
    case "is":
      return valorAtual === regra.valor;
    case "isnot":
      return valorAtual !== regra.valor;
    case "contains":
      return valorAtual.includes(regra.valor);
    case "starts_with":
      return valorAtual.startsWith(regra.valor);
    case "ends_with":
      return valorAtual.endsWith(regra.valor);
    default:
      return false;
  }
}

// Avalia se um campo deve aparecer, dado o estado atual de respostas —
// mesma regra do Gravity Forms: sem conditionalLogic, o campo sempre
// aparece; com "todas", todas as regras precisam bater; com "qualquer",
// basta uma.
export function campoVisivel(campo: Campo, respostas: Respostas): boolean {
  const cond = campo.condicional;
  if (!cond) return true;

  const bate =
    cond.tipoLogica === "todas"
      ? cond.regras.every((r) => regraSatisfeita(r, respostas))
      : cond.regras.some((r) => regraSatisfeita(r, respostas));

  return cond.acao === "mostrar" ? bate : !bate;
}
