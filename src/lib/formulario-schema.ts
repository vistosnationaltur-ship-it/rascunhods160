import { prisma } from "@/lib/prisma";

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

// O schema mora no banco (tabela FormularioSchema, linha única) desde
// que o editor no admin (/admin/formulario) passou a permitir alterar
// pergunta/opções/obrigatório/condicional sem precisar de deploy. A
// carga inicial veio de scripts/converter-schema.ts a partir do
// Gravity Forms original — ver scripts/importar-schema-inicial.ts.
export async function obterPaginas(): Promise<Pagina[]> {
  const registro = await prisma.formularioSchema.findFirst();
  if (!registro) throw new Error("FormularioSchema não encontrado — rodar scripts/importar-schema-inicial.ts.");
  return registro.paginas as unknown as Pagina[];
}

export function buscarCampoPorId(paginas: Pagina[], id: number): Campo | undefined {
  for (const pagina of paginas) {
    const campo = pagina.campos.find((c) => c.id === id);
    if (campo) return campo;
  }
  return undefined;
}

// "section" e "page" são apenas cabeçalhos visuais — não guardam resposta.
export function campoTemResposta(campo: Campo): boolean {
  return campo.tipo !== "section";
}
