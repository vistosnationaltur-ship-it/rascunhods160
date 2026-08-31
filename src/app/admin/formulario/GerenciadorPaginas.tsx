"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Pagina } from "@/lib/formulario-schema";
import {
  adicionarPaginaAction,
  moverPaginaAction,
  removerPaginaAction,
  renomearPaginaAction,
} from "./acoes";

export function GerenciadorPaginas({ paginas }: { paginas: Pagina[] }) {
  const router = useRouter();
  const [pendente, iniciar] = useTransition();
  const [erro, setErro] = useState<string | null>(null);
  const [confirmando, setConfirmando] = useState<number | null>(null);
  const [renomeando, setRenomeando] = useState<number | null>(null);
  const [rascunhoTitulo, setRascunhoTitulo] = useState("");
  const [tituloNova, setTituloNova] = useState("");

  function rodar(fn: () => Promise<void>, aoTerminar?: () => void) {
    setErro(null);
    iniciar(async () => {
      try {
        await fn();
        aoTerminar?.();
        router.refresh();
      } catch (e) {
        setErro(e instanceof Error ? e.message : "Falha na operação.");
      }
    });
  }

  return (
    <div className="flex flex-col gap-4">
      {erro && (
        <p className="rounded-md border border-red-500/20 bg-red-500/[0.06] px-4 py-2.5 text-sm text-red-300">
          {erro}
        </p>
      )}

      <div className="flex flex-col divide-y divide-white/10 rounded-xl border border-white/10 bg-zinc-900/40">
        {paginas.map((pagina, i) => {
          const perguntas = pagina.campos.filter((c) => c.tipo !== "section").length;
          const condicionais = pagina.campos.filter((c) => c.condicional).length;
          const tituloPadrao = `Página ${pagina.indice + 1}`;
          return (
            <div key={pagina.indice} className="flex items-start gap-3 px-4 py-3">
              <div className="flex flex-col gap-1 pt-0.5 text-zinc-500">
                <button
                  type="button"
                  disabled={pendente || i === 0}
                  onClick={() => rodar(() => moverPaginaAction(pagina.indice, "cima"))}
                  className="leading-none hover:text-zinc-200 disabled:opacity-30"
                  aria-label="Mover página para cima"
                >
                  ↑
                </button>
                <button
                  type="button"
                  disabled={pendente || i === paginas.length - 1}
                  onClick={() => rodar(() => moverPaginaAction(pagina.indice, "baixo"))}
                  className="leading-none hover:text-zinc-200 disabled:opacity-30"
                  aria-label="Mover página para baixo"
                >
                  ↓
                </button>
              </div>

              <div className="flex flex-1 flex-col gap-1">
                {renomeando === pagina.indice ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      autoFocus
                      value={rascunhoTitulo}
                      onChange={(e) => setRascunhoTitulo(e.target.value)}
                      placeholder={tituloPadrao}
                      className="rounded-md border border-white/10 bg-zinc-950/60 px-2.5 py-1 text-sm text-zinc-100 outline-none focus:border-indigo-500/60"
                    />
                    <button
                      type="button"
                      disabled={pendente}
                      onClick={() =>
                        rodar(
                          () => renomearPaginaAction(pagina.indice, rascunhoTitulo),
                          () => setRenomeando(null),
                        )
                      }
                      className="rounded-md border border-indigo-500/30 bg-indigo-500/10 px-2.5 py-1 text-xs text-indigo-300 hover:bg-indigo-500/20"
                    >
                      Salvar
                    </button>
                    <button
                      type="button"
                      onClick={() => setRenomeando(null)}
                      className="text-xs text-zinc-500 hover:text-zinc-300"
                    >
                      Cancelar
                    </button>
                  </div>
                ) : (
                  <Link
                    href={`/admin/formulario/pagina/${pagina.indice}`}
                    className="flex flex-wrap items-center gap-2 hover:underline"
                  >
                    <span className="text-sm text-zinc-100">
                      {pagina.titulo && pagina.titulo !== tituloPadrao
                        ? pagina.titulo
                        : tituloPadrao}
                    </span>
                    <span className="text-[11px] text-zinc-600">#{pagina.indice + 1}</span>
                  </Link>
                )}
                <span className="text-xs text-zinc-500">
                  {perguntas} pergunta{perguntas === 1 ? "" : "s"}
                  {condicionais > 0 && ` · ${condicionais} com condicional`}
                </span>
                {confirmando === pagina.indice && (
                  <p className="text-xs text-amber-400">
                    Exclui a página e {pagina.campos.length} item(ns) dentro dela — as
                    respostas desses campos ficam órfãs. Se algum deles for gatilho de
                    condicional em outra página, o save é bloqueado.
                  </p>
                )}
              </div>

              <div className="flex shrink-0 items-center gap-2 pt-0.5">
                {confirmando === pagina.indice ? (
                  <>
                    <button
                      type="button"
                      disabled={pendente}
                      onClick={() =>
                        rodar(
                          () => removerPaginaAction(pagina.indice),
                          () => setConfirmando(null),
                        )
                      }
                      className="rounded-md border border-red-500/30 bg-red-500/10 px-2.5 py-1 text-xs text-red-300 hover:bg-red-500/20"
                    >
                      Confirmar exclusão
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmando(null)}
                      className="text-xs text-zinc-500 hover:text-zinc-300"
                    >
                      Cancelar
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      disabled={pendente}
                      onClick={() => {
                        setRascunhoTitulo(
                          pagina.titulo === tituloPadrao ? "" : pagina.titulo ?? "",
                        );
                        setRenomeando(pagina.indice);
                      }}
                      className="rounded-md border border-white/10 px-2.5 py-1 text-xs text-zinc-400 hover:border-indigo-500/40 hover:text-indigo-300"
                    >
                      Renomear
                    </button>
                    <button
                      type="button"
                      disabled={pendente || paginas.length <= 1}
                      onClick={() => setConfirmando(pagina.indice)}
                      className="rounded-md border border-white/10 px-2.5 py-1 text-xs text-zinc-400 hover:border-red-500/30 hover:text-red-300 disabled:opacity-30"
                    >
                      Excluir
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}

        <div className="flex flex-wrap items-center gap-2 px-4 py-3">
          <input
            value={tituloNova}
            onChange={(e) => setTituloNova(e.target.value)}
            placeholder="Título da nova página (opcional)"
            className="min-w-[16rem] flex-1 rounded-md border border-white/10 bg-zinc-950/60 px-2.5 py-1.5 text-xs text-zinc-200 outline-none focus:border-indigo-500/60"
          />
          <button
            type="button"
            disabled={pendente}
            onClick={() =>
              rodar(
                () => adicionarPaginaAction(tituloNova),
                () => setTituloNova(""),
              )
            }
            className="rounded-md border border-white/10 px-3 py-1.5 text-xs text-zinc-300 hover:border-indigo-500/50 disabled:opacity-60"
          >
            + Adicionar página no fim
          </button>
        </div>
      </div>

      <p className="text-xs text-zinc-600">
        Reordenar ou excluir página renumera todas — clientes com rascunho em andamento
        podem retomar numa página deslocada (as respostas não se perdem, são por campo).
      </p>
    </div>
  );
}
