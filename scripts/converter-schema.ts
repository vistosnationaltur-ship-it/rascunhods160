// Converte o export do Gravity Forms (reference/gravityforms-export-*.json)
// pro schema estruturado que o wizard e a lógica condicional usam
// (src/lib/formulario-schema.ts). Rodar de novo sempre que o formulário
// original do Gravity Forms mudar.
//
// Uso: npx tsx scripts/converter-schema.ts

import { readFileSync, writeFileSync, readdirSync } from "fs";
import { join } from "path";

type CampoOrigem = {
  type: string;
  id: number;
  label: string;
  isRequired?: boolean;
  description?: string;
  choices?: { text: string; value: string }[] | "";
  inputs?: { id: string; label: string }[] | null;
  layoutGroupId?: string;
  layoutGridColumnSpan?: number | "";
  conditionalLogic?:
    | ""
    | {
        enabled: boolean;
        actionType: "show" | "hide";
        logicType: "all" | "any";
        rules: { fieldId: string; operator: string; value: string }[];
      };
};

type OpcaoSchema = { texto: string; valor: string };
type SubCampoSchema = { id: string; label: string };
type RegraSchema = { campoId: number; operador: string; valor: string };
type CondicionalSchema = {
  acao: "mostrar" | "esconder";
  tipoLogica: "todas" | "qualquer";
  regras: RegraSchema[];
};

type CampoSchema = {
  id: number;
  tipo: string;
  label: string;
  obrigatorio: boolean;
  descricao?: string;
  opcoes?: OpcaoSchema[];
  subCampos?: SubCampoSchema[];
  condicional?: CondicionalSchema;
  grupoLayout?: string; // campos com o mesmo valor ficam lado a lado, na mesma linha visual
  colunaSpan?: number; // largura relativa dentro da linha (base 12), igual ao Gravity Forms
};

type PaginaSchema = {
  indice: number;
  titulo: string;
  campos: CampoSchema[];
};

function converterCondicional(c: CampoOrigem["conditionalLogic"]): CondicionalSchema | undefined {
  if (!c || !c.enabled) return undefined;
  return {
    acao: c.actionType === "hide" ? "esconder" : "mostrar",
    tipoLogica: c.logicType === "any" ? "qualquer" : "todas",
    regras: c.rules.map((r) => ({
      campoId: Number(r.fieldId),
      operador: r.operator,
      valor: r.value,
    })),
  };
}

function converterCampo(f: CampoOrigem): CampoSchema {
  const campo: CampoSchema = {
    id: f.id,
    tipo: f.type,
    label: f.label,
    obrigatorio: Boolean(f.isRequired),
  };
  if (f.description) campo.descricao = f.description;
  if (Array.isArray(f.choices) && f.choices.length > 0) {
    campo.opcoes = f.choices.map((c) => ({ texto: c.text, valor: c.value }));
  }
  if (Array.isArray(f.inputs) && f.inputs.length > 0) {
    campo.subCampos = f.inputs
      .filter((i) => i.label)
      .map((i) => ({ id: i.id, label: i.label }));
  }
  const cond = converterCondicional(f.conditionalLogic);
  if (cond) campo.condicional = cond;
  if (f.layoutGroupId) campo.grupoLayout = f.layoutGroupId;
  if (typeof f.layoutGridColumnSpan === "number") campo.colunaSpan = f.layoutGridColumnSpan;
  return campo;
}

function converter(fields: CampoOrigem[]): PaginaSchema[] {
  const paginas: PaginaSchema[] = [];
  let atual: PaginaSchema = { indice: 0, titulo: "Página 1", campos: [] };

  for (const f of fields) {
    if (f.type === "page") {
      paginas.push(atual);
      atual = { indice: paginas.length, titulo: `Página ${paginas.length + 1}`, campos: [] };
      continue;
    }
    // "section" é um cabeçalho de seção (não tem resposta) — usa o label
    // dela como título da página, se ainda não tiver um melhor.
    if (f.type === "section" && f.label && atual.campos.length === 0) {
      atual.titulo = f.label;
    }
    atual.campos.push(converterCampo(f));
  }
  paginas.push(atual);
  return paginas;
}

function main() {
  const refDir = join(__dirname, "..", "reference");
  const arquivo = readdirSync(refDir).find((n) => n.startsWith("gravityforms-export"));
  if (!arquivo) throw new Error("Nenhum gravityforms-export-*.json encontrado em reference/.");

  const origem = JSON.parse(readFileSync(join(refDir, arquivo), "utf8"));
  const fields: CampoOrigem[] = origem["0"].fields;
  const paginas = converter(fields);

  const totalCampos = paginas.reduce((n, p) => n + p.campos.length, 0);
  console.log(`Convertido: ${paginas.length} páginas, ${totalCampos} itens (perguntas + seções).`);

  const destino = join(__dirname, "..", "src", "lib", "formulario-schema.json");
  writeFileSync(destino, JSON.stringify(paginas, null, 2), "utf8");
  console.log(`Schema escrito em ${destino}`);
}

main();
