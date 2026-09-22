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
    // Únicos operadores numéricos daqui — usados pela condicional de
    // idade mínima (ver src/lib/idade.ts, CAMPO_ID_IDADE) pra esconder
    // trabalho/escola/viagens de menores de 14 anos. NaN em qualquer lado
    // (idade ainda não calculada, ou valor da regra mal configurado) dá
    // falso, nunca trata "não sei" como "bateu".
    case "maior_ou_igual": {
      const atual = Number(valorAtual);
      const alvo = Number(regra.valor);
      return !Number.isNaN(atual) && !Number.isNaN(alvo) && atual >= alvo;
    }
    case "menor_que": {
      const atual = Number(valorAtual);
      const alvo = Number(regra.valor);
      return !Number.isNaN(atual) && !Number.isNaN(alvo) && atual < alvo;
    }
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
