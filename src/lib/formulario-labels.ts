import { buscarCampoPorId, type Campo, type Condicional } from "./formulario-schema";

export const TIPO_LEGIVEL: Record<string, string> = {
  text: "Texto curto",
  textarea: "Texto longo",
  radio: "Múltipla escolha (uma opção)",
  select: "Lista suspensa",
  checkbox: "Caixas de marcar",
  date: "Data",
  address: "Endereço",
  phone: "Telefone",
  email: "E-mail",
  number: "Número",
  consent: "Consentimento",
  section: "Seção",
};

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

export function descreverCondicional(condicional: Condicional): string {
  const conectivo = condicional.tipoLogica === "todas" ? " E " : " OU ";
  const partes = condicional.regras.map((r) => {
    const campoOrigem = buscarCampoPorId(r.campoId);
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
