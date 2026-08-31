import { buscarCampoPorId, type Campo, type Condicional, type Pagina } from "./formulario-schema";

export { TIPO_LEGIVEL } from "./formulario-mutacoes";
import { TIPO_LEGIVEL } from "./formulario-mutacoes";

const OPERADOR_LEGIVEL: Record<string, string> = {
  is: "for igual a",
  isnot: "for diferente de",
  contains: "contiver",
  starts_with: "começar com",
  ends_with: "terminar com",
};

export function tipoLegivel(tipo: string): string {
  return TIPO_LEGIVEL[tipo] ?? tipo;
}

export function descreverCondicional(condicional: Condicional, paginas: Pagina[]): string {
  const conectivo = condicional.tipoLogica === "todas" ? " E " : " OU ";
  const partes = condicional.regras.map((r) => {
    const campoOrigem = buscarCampoPorId(paginas, r.campoId);
    const nomeCampo = campoOrigem ? `"${campoOrigem.label}"` : `#${r.campoId}`;
    const operador = OPERADOR_LEGIVEL[r.operador] ?? r.operador;
    return `${nomeCampo} ${operador} "${r.valor}"`;
  });

  const prefixo = condicional.acao === "mostrar" ? "Aparece só se" : "Fica escondido se";
  return `${prefixo} ${partes.join(conectivo)}`;
}

export function campoResumo(campo: Campo): string {
  if (campo.opcoes && campo.opcoes.length > 0) {
    return campo.opcoes.map((o) => o.texto).join(" · ");
  }
  return "";
}
