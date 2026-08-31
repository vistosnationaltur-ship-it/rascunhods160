"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Campo, Pagina } from "@/lib/formulario-schema";
import { TIPO_LEGIVEL, TIPOS_CAMPO, larguraLegivel } from "@/lib/formulario-mutacoes";
import { adicionarCampoAction, moverCampoAction, removerCampoAction } from "../../acoes";

export function GerenciadorPagina({
  pagina,
  todosOsCampos,
}: {
  pagina: Pagina;
  todosOsCampos: Campo[];
}) {
  const router = useRouter();
  const [pendente, iniciar] = useTransition();
  const [erro, setErro] = useState<string | null>(null);
  const [confirmando, setConfirmando] = useState<number | null>(null);
  const [novoTipo, setNovoTipo] = useState("text");

  // id do campo -> ids que o usam como gatilho de condicional
  const dependentesPorCampo = useMemo(() => {
    const mapa = new Map<number, number[]>();
    for (const campo of todosOsCampos) {
      for (const regra of campo.condicional?.regras ?? []) {
        const lista = mapa.get(regra.campoId) ?? [];
        lista.push(campo.id);
        mapa.set(regra.campoId, lista);
      }
    }
    return mapa;
  }, [todosOsCampos]);

  function rodar(fn: () => Promise<void>) {
    setErro(null);
    iniciar(async () => {
      try {
        await fn();
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
        {pagina.campos.map((campo, i) => {
          const dependentes = dependentesPorCampo.get(campo.id) ?? [];
          const ehSecao = campo.tipo === "section";
          const anterior = i > 0 ? pagina.campos[i - 1] : undefined;
          const mesmaLinha =
            !ehSecao &&
            !!campo.grupoLayout &&
            !!anterior &&
            anterior.tipo !== "section" &&
            anterior.grupoLayout === campo.grupoLayout;
          return (
            <div
              key={campo.id}
              className={`flex items-start gap-3 px-4 py-3 ${ehSecao ? "bg-white/5" : ""}`}
            >
              <div className="flex flex-col gap-1 pt-0.5 text-zinc-500">
                <button
                  type="button"
                  disabled={pendente || i === 0}
                  onClick={() => rodar(() => moverCampoAction(campo.id, "cima"))}
                  className="leading-none hover:text-zinc-200 disabled:opacity-30"
                  aria-label="Mover para cima"
                >
                  ↑
                </button>
                <button
                  type="button"
                  disabled={pendente || i === pagina.campos.length - 1}
                  onClick={() => rodar(() => moverCampoAction(campo.id, "baixo"))}
                  className="leading-none hover:text-zinc-200 disabled:opacity-30"
                  aria-label="Mover para baixo"
                >
                  ↓
                </button>
              </div>

              <div className="flex flex-1 flex-col gap-1">
                <Link
                  href={`/admin/formulario/${campo.id}/editar`}
                  className="flex flex-wrap items-center gap-2 hover:underline"
                >
                  <span
                    className={ehSecao ? "text-xs font-medium text-zinc-400" : "text-sm text-zinc-100"}
                  >
                    {campo.label || (ehSecao ? "(seção sem título)" : "(sem texto)")}
                  </span>
                  <span className="rounded-full bg-white/10 px-2 py-0.5 text-[11px] text-zinc-400">
                    {TIPO_LEGIVEL[campo.tipo] ?? campo.tipo}
                  </span>
                  {campo.obrigatorio && (
                    <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[11px] text-amber-400">
                      obrigatório
                    </span>
                  )}
                  {campo.condicional && (
                    <span className="rounded-full bg-sky-500/10 px-2 py-0.5 text-[11px] text-sky-400">
                      condicional
                    </span>
                  )}
                  {!ehSecao && campo.colunaSpan && campo.colunaSpan !== 12 && (
                    <span className="rounded-full bg-white/10 px-2 py-0.5 text-[11px] text-zinc-400">
                      {larguraLegivel(campo.colunaSpan)}
                    </span>
                  )}
                  {mesmaLinha && (
                    <span className="rounded-full bg-white/10 px-2 py-0.5 text-[11px] text-zinc-400">
                      ↳ mesma linha
                    </span>
                  )}
                  <span className="text-[11px] text-zinc-600">#{campo.id}</span>
                </Link>
                {confirmando === campo.id && dependentes.length > 0 && (
                  <p className="text-xs text-amber-400">
                    A condicional de {dependentes.length} outro(s) campo(s) (#
                    {dependentes.join(", #")}) usa este como gatilho e vai quebrar. O save
                    é bloqueado até você ajustar lá.
                  </p>
                )}
              </div>

              <div className="flex shrink-0 items-center gap-2 pt-0.5">
                {confirmando === campo.id ? (
                  <>
                    <button
                      type="button"
                      disabled={pendente}
                      onClick={() =>
                        rodar(async () => {
                          await removerCampoAction(campo.id);
                          setConfirmando(null);
                        })
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
                  <button
                    type="button"
                    disabled={pendente}
                    onClick={() => setConfirmando(campo.id)}
                    className="rounded-md border border-white/10 px-2.5 py-1 text-xs text-zinc-400 hover:border-red-500/30 hover:text-red-300"
                  >
                    Excluir
                  </button>
                )}
              </div>
            </div>
          );
        })}

        <div className="flex flex-wrap items-center gap-2 px-4 py-3">
          <select
            value={novoTipo}
            onChange={(e) => setNovoTipo(e.target.value)}
            className="rounded-md border border-white/10 bg-zinc-950/60 px-2.5 py-1.5 text-xs text-zinc-200 outline-none focus:border-indigo-500/60"
          >
            {TIPOS_CAMPO.map((t) => (
              <option key={t} value={t}>
                {TIPO_LEGIVEL[t] ?? t}
              </option>
            ))}
          </select>
          <button
            type="button"
            disabled={pendente}
            onClick={() => rodar(() => adicionarCampoAction(pagina.indice, novoTipo))}
            className="rounded-md border border-white/10 px-3 py-1.5 text-xs text-zinc-300 hover:border-indigo-500/50 disabled:opacity-60"
          >
            + Adicionar campo no fim da página
          </button>
        </div>
      </div>

      <p className="text-xs text-zinc-600">
        O campo novo entra no fim da lista — use as setas pra posicionar. Depois clique nele
        pra definir pergunta, opções e condicional.
      </p>
    </div>
  );
}
