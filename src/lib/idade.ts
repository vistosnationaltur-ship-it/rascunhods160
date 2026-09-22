import type { Campo, Pagina } from "./formulario-schema";
import { buscarCampoPorId } from "./formulario-schema";

type Respostas = Record<string, string | string[] | undefined>;

export const CAMPO_ID_NASCIMENTO = 25;

// Sentinela reservado pra representar "idade calculada" nas condicionais
// (ver condicional.ts, operadores "maior_ou_igual"/"menor_que") sem
// precisar mudar o tipo de Regra.campoId (é number) nem duplicar a data
// de nascimento como se fosse um campo de verdade em `respostas`. Nenhum
// campo real do schema chega perto de um id negativo.
export const CAMPO_ID_IDADE = -1;

const MESES = [
  "",
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

// Mesma forma de achar os sub-campos usada em
// scripts/migrar-data-nascimento.ts: os ids de Dia/Mês/Ano são gerados
// pela tela /admin/formulario e variam, então a gente acha pelo rótulo.
function subCampoPorPrefixo(campo: Campo, prefixo: RegExp): string | undefined {
  return campo.subCampos?.find((s) => prefixo.test(s.label.trim()))?.id;
}

// Calcula a idade completa (em anos, na data de hoje) a partir da
// resposta de "Data de nascimento" (campo 25, Dia/Mês/Ano desde a
// migração de 2026-09-15). Retorna null se a data ainda não foi
// respondida, está incompleta, ou o campo 25 nem tem sub-campos (schema
// desatualizado) — quem usa isso deve tratar null como "não sabemos",
// nunca como "menor de idade".
export function calcularIdade(campoNascimento: Campo | undefined, respostas: Respostas): number | null {
  if (!campoNascimento?.subCampos?.length) return null;
  const idDia = subCampoPorPrefixo(campoNascimento, /^dia/i);
  const idMes = subCampoPorPrefixo(campoNascimento, /^m[êe]s/i);
  const idAno = subCampoPorPrefixo(campoNascimento, /^ano/i);
  if (!idDia || !idMes || !idAno) return null;

  const dia = Number(respostas[idDia]);
  const nomeMes = typeof respostas[idMes] === "string" ? (respostas[idMes] as string).trim().toLowerCase() : "";
  const mes = MESES.findIndex((m) => m.toLowerCase() === nomeMes);
  const ano = Number(respostas[idAno]);
  if (!dia || mes <= 0 || !ano) return null;

  const nascimento = new Date(ano, mes - 1, dia);
  if (Number.isNaN(nascimento.getTime())) return null;

  const hoje = new Date();
  let idade = hoje.getFullYear() - nascimento.getFullYear();
  const aindaNaoFezAniversarioEsseAno =
    hoje.getMonth() < nascimento.getMonth() ||
    (hoje.getMonth() === nascimento.getMonth() && hoje.getDate() < nascimento.getDate());
  if (aindaNaoFezAniversarioEsseAno) idade--;
  return idade;
}

// Injeta a idade calculada em `respostas` sob a chave reservada
// CAMPO_ID_IDADE — chamar antes de avaliar campoVisivel/respostasPorPagina
// em qualquer tela que precise esconder perguntas de trabalho/escola pra
// menores de 14 anos (não se aplicam no DS-160 oficial). Se a idade não
// dá pra calcular ainda, devolve `respostas` sem alteração (as perguntas
// continuam aparecendo normalmente até a data de nascimento ser respondida).
export function comIdadeInjetada(paginas: Pagina[], respostas: Respostas): Respostas {
  const idade = calcularIdade(buscarCampoPorId(paginas, CAMPO_ID_NASCIMENTO), respostas);
  if (idade === null) return respostas;
  return { ...respostas, [String(CAMPO_ID_IDADE)]: String(idade) };
}
