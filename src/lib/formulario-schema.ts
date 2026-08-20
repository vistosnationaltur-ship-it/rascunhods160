import dados from "./formulario-schema.json";

export type Opcao = { texto: string; valor: string };
export type SubCampo = { id: string; label: string };
export type Regra = { campoId: number; operador: string; valor: string };
export type Condicional = {
  acao: "mostrar" | "esconder";
  tipoLogica: "todas" | "qualquer";
  regras: Regra[];
};

export type Campo = {
  id: number;
  tipo: string;
  label: string;
  obrigatorio: boolean;
  descricao?: string;
  opcoes?: Opcao[];
  subCampos?: SubCampo[];
  condicional?: Condicional;
  grupoLayout?: string;
  colunaSpan?: number;
};

export type Pagina = {
  indice: number;
  titulo: string;
  campos: Campo[];
};

// Gerado por scripts/converter-schema.ts a partir de
// reference/gravityforms-export-*.json — não editar o .json na mão,
// reconverter do original ou ajustar aqui direto (é só dado, não lógica).
export const paginas: Pagina[] = dados as Pagina[];

export const todosOsCampos: Campo[] = paginas.flatMap((p) => p.campos);

const porId = new Map(todosOsCampos.map((c) => [c.id, c]));

export function buscarCampoPorId(id: number): Campo | undefined {
  return porId.get(id);
}

// "section" e "page" são apenas cabeçalhos visuais — não guardam resposta.
export function campoTemResposta(campo: Campo): boolean {
  return campo.tipo !== "section";
}
