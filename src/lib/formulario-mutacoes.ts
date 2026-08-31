import type { Campo, Pagina, SubCampo } from "./formulario-schema";

// Transformações puras sobre o array de páginas do formulário, usadas
// pelo builder no admin. Nenhuma fala com o banco — quem persiste é
// src/app/admin/formulario/acoes.ts, que tira backup antes de gravar.

export const TIPOS_CAMPO = [
  "text",
  "textarea",
  "radio",
  "select",
  "checkbox",
  "date",
  "address",
  "phone",
  "email",
  "number",
  "consent",
  "section",
] as const;
export type TipoCampo = (typeof TIPOS_CAMPO)[number];

// Nome legível de cada tipo, mostrado no admin. Fica aqui (e não em
// formulario-labels.ts) porque este módulo é livre de dependência do
// Prisma e pode ser importado por componentes client (EditorCampo).
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

export const TIPOS_COM_OPCOES: readonly string[] = ["radio", "select", "checkbox"];
export const TIPOS_COM_SUBCAMPOS: readonly string[] = ["date", "address"];

// Larguras que o formulário do cliente sabe renderizar (grid de 12
// colunas — ver PaginaWizard). "Linha inteira" = campo sozinho na linha;
// as frações só ficam lado a lado quando os campos estão no mesmo grupo
// (ver "juntar na linha anterior" no editor de campo).
export const LARGURA_OPCOES: { span: number; label: string }[] = [
  { span: 12, label: "Linha inteira" },
  { span: 6, label: "Metade (1/2)" },
  { span: 8, label: "Dois terços (2/3)" },
  { span: 4, label: "Um terço (1/3)" },
  { span: 9, label: "Três quartos (3/4)" },
  { span: 3, label: "Um quarto (1/4)" },
];

export function larguraLegivel(span: number | undefined): string {
  if (!span || span === 12) return "Linha inteira";
  return LARGURA_OPCOES.find((o) => o.span === span)?.label ?? `${span}/12`;
}

// String arbitrária que marca campos consecutivos como "mesma linha".
// Curta e no estilo dos hashes que vieram do Gravity Forms.
export function novoGrupoLayout(): string {
  return Math.random().toString(36).slice(2, 10);
}

// IDs de campo são numéricos herdados do Gravity Forms; sub-campos usam
// "<id>.<n>" (ex.: "50.1"). Próximo id = maior id inteiro visto + 1,
// nunca reaproveita — respostas salvas (ClienteDs160.respostas) são
// keyed por esse id.
export function proximoIdCampo(paginas: Pagina[]): number {
  let maior = 0;
  for (const pagina of paginas) {
    for (const campo of pagina.campos) {
      if (campo.id > maior) maior = campo.id;
      for (const sub of campo.subCampos ?? []) {
        const inteiro = Math.trunc(Number(sub.id));
        if (Number.isFinite(inteiro) && inteiro > maior) maior = inteiro;
      }
    }
  }
  return maior + 1;
}

function subCamposPadrao(id: number, tipo: string): SubCampo[] {
  if (tipo === "date") {
    return [
      { id: `${id}.1`, label: "Mês" },
      { id: `${id}.2`, label: "Dia" },
      { id: `${id}.3`, label: "Ano" },
    ];
  }
  if (tipo === "address") {
    return [
      { id: `${id}.1`, label: "Rua" },
      { id: `${id}.2`, label: "Bairro e Complemento" },
      { id: `${id}.3`, label: "Cidade" },
      { id: `${id}.4`, label: "Estado" },
      { id: `${id}.5`, label: "Código postal" },
      { id: `${id}.6`, label: "País" },
    ];
  }
  return [];
}

export function criarCampo(id: number, tipo: TipoCampo): Campo {
  const campo: Campo = {
    id,
    tipo,
    label: tipo === "section" ? "Nova seção" : "Nova pergunta",
    obrigatorio: false,
  };
  if (TIPOS_COM_OPCOES.includes(tipo)) {
    campo.opcoes = [
      { texto: "Opção 1", valor: "Opção 1" },
      { texto: "Opção 2", valor: "Opção 2" },
    ];
  }
  if (TIPOS_COM_SUBCAMPOS.includes(tipo)) {
    campo.subCampos = subCamposPadrao(id, tipo);
  }
  return campo;
}

// Ajusta campo quando o tipo muda: cria/remove opções e sub-campos
// conforme o novo tipo, preservando o que ainda faz sentido.
export function trocarTipo(campo: Campo, novoTipo: TipoCampo): Campo {
  const atualizado: Campo = { ...campo, tipo: novoTipo };

  if (TIPOS_COM_OPCOES.includes(novoTipo)) {
    if (!atualizado.opcoes || atualizado.opcoes.length === 0) {
      atualizado.opcoes = [{ texto: "Opção 1", valor: "Opção 1" }];
    }
  } else {
    delete atualizado.opcoes;
  }

  if (TIPOS_COM_SUBCAMPOS.includes(novoTipo)) {
    if (!atualizado.subCampos || atualizado.subCampos.length === 0) {
      atualizado.subCampos = subCamposPadrao(campo.id, novoTipo);
    }
  } else {
    delete atualizado.subCampos;
  }

  return atualizado;
}

function mapCampos(paginas: Pagina[], fn: (campos: Campo[], pagina: Pagina) => Campo[]): Pagina[] {
  return paginas.map((pagina) => ({ ...pagina, campos: fn(pagina.campos, pagina) }));
}

export function adicionarCampo(
  paginas: Pagina[],
  paginaIndice: number,
  campo: Campo,
): Pagina[] {
  return paginas.map((pagina) =>
    pagina.indice === paginaIndice
      ? { ...pagina, campos: [...pagina.campos, campo] }
      : pagina,
  );
}

export function removerCampo(paginas: Pagina[], campoId: number): Pagina[] {
  return mapCampos(paginas, (campos) => campos.filter((c) => c.id !== campoId));
}

export function moverCampo(
  paginas: Pagina[],
  campoId: number,
  direcao: "cima" | "baixo",
): Pagina[] {
  return mapCampos(paginas, (campos) => {
    const i = campos.findIndex((c) => c.id === campoId);
    if (i === -1) return campos;
    const j = direcao === "cima" ? i - 1 : i + 1;
    if (j < 0 || j >= campos.length) return campos;
    const copia = [...campos];
    [copia[i], copia[j]] = [copia[j], copia[i]];
    return copia;
  });
}

export function substituirCampo(paginas: Pagina[], campoId: number, novo: Campo): Pagina[] {
  return mapCampos(paginas, (campos) => campos.map((c) => (c.id === campoId ? novo : c)));
}

// ---------- Validação ----------

// Roda antes de todo save e aborta a gravação se falhar. Checa só os
// dois invariantes que realmente corrompem o formulário — não valida
// "qualidade" de campo (label vazio, opção em branco etc.), que pode ser
// pré-existente do export do Gravity Forms e é responsabilidade do
// editor de cada campo.
export function validarSchema(paginas: Pagina[]): string[] {
  const erros: string[] = [];
  const todosOsCampos = paginas.flatMap((p) => p.campos);
  const ids = todosOsCampos.map((c) => c.id);

  const idsDuplicados = ids.filter((id, i) => ids.indexOf(id) !== i);
  if (idsDuplicados.length > 0) {
    erros.push(`IDs de campo repetidos: ${[...new Set(idsDuplicados)].join(", ")}.`);
  }

  const idsExistentes = new Set(ids);
  for (const campo of todosOsCampos) {
    for (const regra of campo.condicional?.regras ?? []) {
      if (!idsExistentes.has(regra.campoId)) {
        erros.push(
          `Campo #${campo.id} ("${campo.label}") tem condicional que depende do campo #${regra.campoId}, que não existe (mais). Ajuste ou remova essa condicional antes.`,
        );
      }
    }
  }

  return erros;
}

// Campos que perdem o gatilho se `campoId` for excluído — a UI usa isso
// pra avisar antes de deixar remover.
export function dependentesDe(paginas: Pagina[], campoId: number): Campo[] {
  return paginas
    .flatMap((p) => p.campos)
    .filter((c) => c.condicional?.regras.some((r) => r.campoId === campoId));
}
