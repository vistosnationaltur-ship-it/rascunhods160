"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Campo, Pagina } from "@/lib/formulario-schema";
import { campoVisivel } from "@/lib/condicional";
import { CampoRenderer } from "@/components/preencher/CampoRenderer";
import { salvarPagina, salvarESair, concluirRascunho } from "../actions";

type Valor = string | string[] | undefined;

// Campos lado a lado (colunaSpan, ex: Sexo/Estado Civil/Data de nascimento
// na mesma linha) só valem a partir de telas médias — no celular cada
// campo ocupa a linha inteira, senão fica espremido e desconfigurado.
// Classes escritas por extenso (não geradas via template string) pro
// Tailwind conseguir detectar em tempo de build.
const SPAN_CLASSES: Record<number, string> = {
  1: "col-span-12 sm:col-span-1",
  2: "col-span-12 sm:col-span-2",
  3: "col-span-12 sm:col-span-3",
  4: "col-span-12 sm:col-span-4",
  5: "col-span-12 sm:col-span-5",
  6: "col-span-12 sm:col-span-6",
  7: "col-span-12 sm:col-span-7",
  8: "col-span-12 sm:col-span-8",
  9: "col-span-12 sm:col-span-9",
  10: "col-span-12 sm:col-span-10",
  11: "col-span-12 sm:col-span-11",
  12: "col-span-12",
};

// Quando o gatilho de uma condicional muda de resposta, a pergunta que
// dependia dele pode deixar de aparecer — mas o valor antigo continua
// em `respostas` se não for limpo, e aí uma condicional em cadeia (ex:
// #288 depende da resposta de #289, que por sua vez depende de #281)
// fica "presa" mostrando #288 mesmo com #289 escondido. Roda em loop
// até estabilizar pra cobrir cadeias de mais de um nível.
function limparRespostasDeCamposEscondidos(
  respostas: Record<string, Valor>,
  campos: Campo[],
): Record<string, Valor> {
  let atual = respostas;
  let mudou = true;
  while (mudou) {
    mudou = false;
    for (const campo of campos) {
      if (campoVisivel(campo, atual)) continue;
      const chaves = [String(campo.id), ...(campo.subCampos?.map((s) => s.id) ?? [])];
      for (const chave of chaves) {
        if (chave in atual) {
          const { [chave]: _removida, ...resto } = atual;
          atual = resto;
          mudou = true;
        }
      }
    }
  }
  return atual;
}

// Campos consecutivos com o mesmo grupoLayout ficam lado a lado, igual
// no formulário original (ex: Sexo / Estado Civil / Data de nascimento
// na mesma linha) — campos sem grupo ou "section" ficam sozinhos.
function agruparEmLinhas(campos: Campo[]): Campo[][] {
  const linhas: Campo[][] = [];
  for (const campo of campos) {
    const ultima = linhas[linhas.length - 1];
    const podeJuntar =
      campo.grupoLayout &&
      campo.tipo !== "section" &&
      ultima &&
      ultima[0].grupoLayout === campo.grupoLayout &&
      ultima[0].tipo !== "section";
    if (podeJuntar) {
      ultima.push(campo);
    } else {
      linhas.push([campo]);
    }
  }
  return linhas;
}

export function PaginaWizard({
  pagina,
  totalPaginas,
  respostasIniciais,
}: {
  pagina: Pagina;
  totalPaginas: number;
  respostasIniciais: Record<string, Valor>;
}) {
  const router = useRouter();
  // Limpa já na carga: rascunhos salvos antes desse fix podem ter
  // resposta de um campo que hoje está escondido (trigger mudou depois).
  const [respostas, setRespostas] = useState<Record<string, Valor>>(() =>
    limparRespostasDeCamposEscondidos(respostasIniciais, pagina.campos),
  );
  const [erro, setErro] = useState<string | null>(null);
  const [pendente, iniciarTransicao] = useTransition();

  const ehUltimaPagina = pagina.indice === totalPaginas - 1;
  const progresso = Math.round(((pagina.indice + 1) / totalPaginas) * 100);

  function onChange(chave: string, valor: Valor) {
    setRespostas((atual) =>
      limparRespostasDeCamposEscondidos({ ...atual, [chave]: valor }, pagina.campos),
    );
  }

  function respostasDestaPagina(): Record<string, Valor> {
    const chavesRelevantes = new Set<string>();
    for (const campo of pagina.campos) {
      chavesRelevantes.add(String(campo.id));
      campo.subCampos?.forEach((s) => chavesRelevantes.add(s.id));
    }
    const parcial: Record<string, Valor> = {};
    for (const chave of chavesRelevantes) {
      if (chave in respostas) parcial[chave] = respostas[chave];
    }
    return parcial;
  }

  function avancar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    iniciarTransicao(async () => {
      try {
        if (ehUltimaPagina) {
          await concluirRascunho(respostasDestaPagina());
          router.push("/preencher/concluido");
        } else {
          await salvarPagina(pagina.indice, respostasDestaPagina());
          router.push(`/preencher/${pagina.indice + 1}`);
        }
      } catch (err) {
        setErro(err instanceof Error ? err.message : "Falha ao salvar.");
      }
    });
  }

  function salvarESairAgora() {
    setErro(null);
    iniciarTransicao(async () => {
      try {
        await salvarESair(pagina.indice, respostasDestaPagina());
        router.push("/login?salvo=1");
      } catch (err) {
        setErro(err instanceof Error ? err.message : "Falha ao salvar.");
      }
    });
  }

  function voltar() {
    if (pagina.indice === 0) return;
    setErro(null);
    iniciarTransicao(async () => {
      try {
        await salvarPagina(pagina.indice - 1, respostasDestaPagina());
        router.push(`/preencher/${pagina.indice - 1}`);
      } catch (err) {
        setErro(err instanceof Error ? err.message : "Falha ao salvar.");
      }
    });
  }

  const camposVisiveis = pagina.campos.filter((campo) => campoVisivel(campo, respostas));
  const linhas = agruparEmLinhas(camposVisiveis);

  return (
    <form onSubmit={avancar} className="flex flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <p className="text-sm text-zinc-500">
          Passo {pagina.indice + 1} de {totalPaginas}
        </p>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-200">
          <div className="h-full bg-blue-600 transition-all" style={{ width: `${progresso}%` }} />
        </div>
      </div>

      <div className="flex flex-col gap-5">
        {linhas.map((linha) => (
          <div key={linha[0].id} className="grid grid-cols-12 gap-4">
            {linha.map((campo) => (
              <div key={campo.id} className={SPAN_CLASSES[campo.colunaSpan ?? 12] ?? SPAN_CLASSES[12]}>
                <CampoRenderer campo={campo} respostas={respostas} onChange={onChange} />
              </div>
            ))}
          </div>
        ))}
      </div>

      {erro && (
        <p className="rounded-md border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">{erro}</p>
      )}

      <div className="flex flex-col gap-3 border-t border-zinc-200 pt-4">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={voltar}
            disabled={pagina.indice === 0 || pendente}
            className="rounded-md border border-zinc-300 px-4 py-2.5 text-sm text-zinc-700 transition-colors hover:bg-zinc-50 disabled:opacity-40"
          >
            Anterior
          </button>
          <button
            type="submit"
            disabled={pendente}
            className="rounded-md bg-zinc-800 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-60"
          >
            {ehUltimaPagina ? "Concluído" : "Seguinte"}
          </button>
        </div>
        <button
          type="button"
          onClick={salvarESairAgora}
          disabled={pendente}
          className="self-center rounded-md px-3 py-1.5 text-xs font-normal text-zinc-400 transition-colors hover:bg-zinc-50 hover:text-zinc-600 disabled:opacity-40"
        >
          Salvar e continuar depois
        </button>
      </div>
    </form>
  );
}
