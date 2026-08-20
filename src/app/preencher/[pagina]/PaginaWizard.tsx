"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Pagina } from "@/lib/formulario-schema";
import { campoVisivel } from "@/lib/condicional";
import { CampoRenderer } from "@/components/preencher/CampoRenderer";
import { salvarPagina, concluirRascunho } from "../actions";

type Valor = string | string[] | undefined;

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
  const [respostas, setRespostas] = useState<Record<string, Valor>>(respostasIniciais);
  const [erro, setErro] = useState<string | null>(null);
  const [pendente, iniciarTransicao] = useTransition();

  const ehUltimaPagina = pagina.indice === totalPaginas - 1;
  const progresso = Math.round(((pagina.indice + 1) / totalPaginas) * 100);

  function onChange(chave: string, valor: Valor) {
    setRespostas((atual) => ({ ...atual, [chave]: valor }));
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

  return (
    <form onSubmit={avancar} className="flex flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
          <div className="h-full bg-indigo-500 transition-all" style={{ width: `${progresso}%` }} />
        </div>
        <p className="text-xs text-zinc-500">
          Página {pagina.indice + 1} de {totalPaginas}
          {pagina.titulo !== `Página ${pagina.indice + 1}` && ` — ${pagina.titulo}`}
        </p>
      </div>

      <div className="flex flex-col gap-5">
        {pagina.campos
          .filter((campo) => campoVisivel(campo, respostas))
          .map((campo) => (
            <CampoRenderer key={campo.id} campo={campo} respostas={respostas} onChange={onChange} />
          ))}
      </div>

      {erro && (
        <p className="rounded-lg border border-red-500/20 bg-red-500/[0.06] px-4 py-2.5 text-sm text-red-300">
          {erro}
        </p>
      )}

      <div className="flex items-center justify-between border-t border-white/10 pt-4">
        <button
          type="button"
          onClick={voltar}
          disabled={pagina.indice === 0 || pendente}
          className="rounded-lg border border-white/10 px-4 py-2.5 text-sm text-zinc-300 transition-colors hover:border-white/20 disabled:opacity-40"
        >
          Anterior
        </button>
        <button
          type="submit"
          disabled={pendente}
          className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-60"
        >
          {ehUltimaPagina ? "Concluído" : "Seguinte"}
        </button>
      </div>
    </form>
  );
}
