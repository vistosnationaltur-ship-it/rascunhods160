"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Campo, Opcao, Regra, SubCampo } from "@/lib/formulario-schema";
import {
  LARGURA_OPCOES,
  TIPO_LEGIVEL,
  TIPOS_CAMPO,
  TIPOS_COM_OPCOES,
  TIPOS_COM_SUBCAMPOS,
} from "@/lib/formulario-mutacoes";
import { salvarCampo } from "./actions";

const OPERADORES = [
  { valor: "is", label: "for igual a" },
  { valor: "isnot", label: "for diferente de" },
  { valor: "contains", label: "contiver" },
  { valor: "starts_with", label: "começar com" },
  { valor: "ends_with", label: "terminar com" },
];

const estiloInput =
  "rounded-md border border-white/10 bg-zinc-950/60 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-indigo-500/60";

export function EditorCampo({
  campo,
  todosOsCampos,
  campoAnterior,
}: {
  campo: Campo;
  todosOsCampos: Campo[];
  campoAnterior: Campo | null;
}) {
  const router = useRouter();
  const [tipo, setTipo] = useState(campo.tipo);
  const [colunaSpan, setColunaSpan] = useState<number>(campo.colunaSpan ?? 12);
  const [juntarNaLinha, setJuntarNaLinha] = useState(
    Boolean(campo.grupoLayout && campoAnterior?.grupoLayout === campo.grupoLayout),
  );
  const [label, setLabel] = useState(campo.label);
  const [descricao, setDescricao] = useState(campo.descricao ?? "");
  const [obrigatorio, setObrigatorio] = useState(campo.obrigatorio);
  const [opcoes, setOpcoes] = useState<Opcao[]>(campo.opcoes ?? []);
  const [subCampos, setSubCampos] = useState<SubCampo[]>(campo.subCampos ?? []);
  const [temCondicional, setTemCondicional] = useState(Boolean(campo.condicional));
  const [acao, setAcao] = useState<"mostrar" | "esconder">(campo.condicional?.acao ?? "mostrar");
  const [tipoLogica, setTipoLogica] = useState<"todas" | "qualquer">(
    campo.condicional?.tipoLogica ?? "todas",
  );
  const [regras, setRegras] = useState<Regra[]>(campo.condicional?.regras ?? []);
  const [buscaCampoPorRegra, setBuscaCampoPorRegra] = useState<Record<number, string>>({});
  const [pendente, iniciarTransicao] = useTransition();
  const [erro, setErro] = useState<string | null>(null);

  const podeTerOpcoes = TIPOS_COM_OPCOES.includes(tipo);
  const podeTerSubCampos = TIPOS_COM_SUBCAMPOS.includes(tipo);
  const ehSecao = tipo === "section";
  const candidatosGatilho = todosOsCampos
    .filter((c) => c.id !== campo.id && c.tipo !== "section")
    .sort((a, b) => a.id - b.id);

  function candidatosFiltrados(busca: string): Campo[] {
    const termo = busca.trim().toLowerCase();
    if (!termo) return candidatosGatilho;
    return candidatosGatilho.filter((c) =>
      `#${c.id} ${c.label}`.toLowerCase().includes(termo),
    );
  }

  function opcoesDoGatilho(campoId: number): Opcao[] {
    return candidatosGatilho.find((c) => c.id === campoId)?.opcoes ?? [];
  }

  function adicionarSubCampo() {
    const usados = subCampos
      .map((s) => Number(String(s.id).split(".")[1]))
      .filter((n) => Number.isFinite(n));
    const proximo = (usados.length > 0 ? Math.max(...usados) : 0) + 1;
    setSubCampos([...subCampos, { id: `${campo.id}.${proximo}`, label: "" }]);
  }

  function salvar() {
    setErro(null);
    iniciarTransicao(async () => {
      try {
        await salvarCampo(campo.id, {
          tipo,
          label,
          descricao,
          obrigatorio,
          opcoes,
          subCampos,
          condicional: temCondicional && regras.length > 0 ? { acao, tipoLogica, regras } : null,
          colunaSpan: ehSecao ? null : colunaSpan,
          juntarNaLinhaAnterior: !ehSecao && Boolean(campoAnterior) && juntarNaLinha,
        });
        router.push("/admin/formulario");
        router.refresh();
      } catch (err) {
        setErro(err instanceof Error ? err.message : "Falha ao salvar.");
      }
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="text-zinc-400">Tipo do campo</span>
        <select value={tipo} onChange={(e) => setTipo(e.target.value)} className={estiloInput}>
          {TIPOS_CAMPO.map((t) => (
            <option key={t} value={t}>
              {TIPO_LEGIVEL[t] ?? t}
            </option>
          ))}
        </select>
        <span className="text-xs text-zinc-600">
          Trocar o tipo mantém as respostas já salvas neste campo (#{campo.id}).
        </span>
      </label>

      <label className="flex flex-col gap-1.5 text-sm">
        <span className="text-zinc-400">{ehSecao ? "Título da seção" : "Pergunta"}</span>
        <input value={label} onChange={(e) => setLabel(e.target.value)} className={estiloInput} />
      </label>

      {!ehSecao && (
        <>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-zinc-400">Texto de ajuda (opcional)</span>
            <textarea
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              rows={2}
              className={estiloInput}
            />
          </label>

          <label className="flex items-center gap-2 text-sm text-zinc-300">
            <input
              type="checkbox"
              checked={obrigatorio}
              onChange={(e) => setObrigatorio(e.target.checked)}
              className="accent-indigo-500"
            />
            Obrigatório
          </label>
        </>
      )}

      {podeTerOpcoes && (
        <div className="flex flex-col gap-2">
          <span className="text-sm text-zinc-400">Opções</span>
          {opcoes.map((op, i) => (
            <div key={i} className="flex gap-2">
              <input
                value={op.texto}
                placeholder="Texto mostrado"
                onChange={(e) => {
                  const novo = [...opcoes];
                  novo[i] = { texto: e.target.value, valor: e.target.value };
                  setOpcoes(novo);
                }}
                className={`${estiloInput} flex-1`}
              />
              <button
                type="button"
                onClick={() => setOpcoes(opcoes.filter((_, j) => j !== i))}
                className="rounded-md border border-red-500/20 px-3 text-sm text-red-400 hover:bg-red-500/10"
              >
                Remover
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => setOpcoes([...opcoes, { texto: "", valor: "" }])}
            className="w-fit rounded-md border border-white/10 px-3 py-1.5 text-xs text-zinc-300 hover:border-indigo-500/50"
          >
            + Adicionar opção
          </button>
        </div>
      )}

      {podeTerSubCampos && (
        <div className="flex flex-col gap-2">
          <span className="text-sm text-zinc-400">Sub-campos</span>
          <p className="text-xs text-zinc-600">
            Cada linha vira um campo próprio no formulário (a resposta é guardada por
            sub-campo). Remover um sub-campo apaga as respostas dele.
          </p>
          {subCampos.map((sub, i) => (
            <div key={sub.id} className="flex items-center gap-2">
              <span className="w-14 shrink-0 text-xs text-zinc-600">{sub.id}</span>
              <input
                value={sub.label}
                placeholder="Rótulo do sub-campo"
                onChange={(e) => {
                  const novo = [...subCampos];
                  novo[i] = { ...novo[i], label: e.target.value };
                  setSubCampos(novo);
                }}
                className={`${estiloInput} flex-1`}
              />
              <button
                type="button"
                onClick={() => setSubCampos(subCampos.filter((_, j) => j !== i))}
                className="rounded-md border border-red-500/20 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10"
              >
                Remover
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={adicionarSubCampo}
            className="w-fit rounded-md border border-white/10 px-3 py-1.5 text-xs text-zinc-300 hover:border-indigo-500/50"
          >
            + Adicionar sub-campo
          </button>
        </div>
      )}

      {!ehSecao && (
        <div className="flex flex-col gap-3 border-t border-white/10 pt-4">
          <span className="text-sm text-zinc-400">Layout</span>

          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-zinc-500">Largura do campo</span>
            <select
              value={colunaSpan}
              onChange={(e) => setColunaSpan(Number(e.target.value))}
              className={estiloInput}
            >
              {LARGURA_OPCOES.some((o) => o.span === colunaSpan) ? null : (
                <option value={colunaSpan}>{colunaSpan}/12</option>
              )}
              {LARGURA_OPCOES.map((o) => (
                <option key={o.span} value={o.span}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>

          {campoAnterior && (
            <label className="flex items-start gap-2 text-sm text-zinc-300">
              <input
                type="checkbox"
                checked={juntarNaLinha}
                onChange={(e) => setJuntarNaLinha(e.target.checked)}
                className="mt-0.5 accent-indigo-500"
              />
              <span>
                Na mesma linha que o campo de cima{" "}
                <span className="text-zinc-500">
                  (#{campoAnterior.id} {campoAnterior.label || "sem texto"})
                </span>
                . Pra caber, dê uma largura menor que “linha inteira” nos dois campos.
              </span>
            </label>
          )}

          <label className="mt-1 flex items-center gap-2 border-t border-white/10 pt-3 text-sm text-zinc-300">
            <input
              type="checkbox"
              checked={temCondicional}
              onChange={(e) => setTemCondicional(e.target.checked)}
              className="accent-indigo-500"
            />
            Esse campo só aparece dependendo de outra resposta
          </label>

          {temCondicional && (
            <div className="flex flex-col gap-3 rounded-lg border border-white/10 bg-zinc-900/40 p-4">
              <div className="flex flex-wrap items-center gap-2 text-sm text-zinc-300">
                <select value={acao} onChange={(e) => setAcao(e.target.value as "mostrar" | "esconder")} className={estiloInput}>
                  <option value="mostrar">Mostrar</option>
                  <option value="esconder">Esconder</option>
                </select>
                <span>este campo se</span>
                {regras.length > 1 && (
                  <select
                    value={tipoLogica}
                    onChange={(e) => setTipoLogica(e.target.value as "todas" | "qualquer")}
                    className={estiloInput}
                  >
                    <option value="todas">todas as regras abaixo</option>
                    <option value="qualquer">qualquer regra abaixo</option>
                  </select>
                )}
                <span>baterem:</span>
              </div>

              {regras.map((regra, i) => {
                const opcoesGatilho = opcoesDoGatilho(regra.campoId);
                return (
                  <div key={i} className="flex flex-wrap items-center gap-2">
                    <div className="flex w-64 flex-col gap-1">
                      <input
                        type="text"
                        value={buscaCampoPorRegra[i] ?? ""}
                        onChange={(e) =>
                          setBuscaCampoPorRegra({ ...buscaCampoPorRegra, [i]: e.target.value })
                        }
                        placeholder="Buscar pergunta por nº ou texto..."
                        className={estiloInput}
                      />
                      <select
                        size={6}
                        value={regra.campoId || ""}
                        onChange={(e) => {
                          const novo = [...regras];
                          novo[i] = { ...novo[i], campoId: Number(e.target.value), valor: "" };
                          setRegras(novo);
                        }}
                        className={estiloInput}
                      >
                        <option value="">Selecione o campo...</option>
                        {candidatosFiltrados(buscaCampoPorRegra[i] ?? "").map((c) => (
                          <option key={c.id} value={c.id}>
                            #{c.id} {c.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <select
                      value={regra.operador}
                      onChange={(e) => {
                        const novo = [...regras];
                        novo[i] = { ...novo[i], operador: e.target.value };
                        setRegras(novo);
                      }}
                      className={estiloInput}
                    >
                      {OPERADORES.map((op) => (
                        <option key={op.valor} value={op.valor}>
                          {op.label}
                        </option>
                      ))}
                    </select>
                    {opcoesGatilho.length > 0 ? (
                      <select
                        value={regra.valor}
                        onChange={(e) => {
                          const novo = [...regras];
                          novo[i] = { ...novo[i], valor: e.target.value };
                          setRegras(novo);
                        }}
                        className={estiloInput}
                      >
                        <option value="">Selecione o valor...</option>
                        {opcoesGatilho.map((op) => (
                          <option key={op.valor} value={op.valor}>
                            {op.texto}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        value={regra.valor}
                        placeholder="Valor"
                        onChange={(e) => {
                          const novo = [...regras];
                          novo[i] = { ...novo[i], valor: e.target.value };
                          setRegras(novo);
                        }}
                        className={estiloInput}
                      />
                    )}
                    <button
                      type="button"
                      onClick={() => setRegras(regras.filter((_, j) => j !== i))}
                      className="rounded-md border border-red-500/20 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10"
                    >
                      Remover
                    </button>
                  </div>
                );
              })}
              <button
                type="button"
                onClick={() => setRegras([...regras, { campoId: 0, operador: "is", valor: "" }])}
                className="w-fit rounded-md border border-white/10 px-3 py-1.5 text-xs text-zinc-300 hover:border-indigo-500/50"
              >
                + Adicionar regra
              </button>
            </div>
          )}
        </div>
      )}

      {erro && (
        <p className="rounded-md border border-red-500/20 bg-red-500/[0.06] px-4 py-2.5 text-sm text-red-300">
          {erro}
        </p>
      )}

      <div className="flex items-center justify-between border-t border-white/10 pt-4">
        <button
          type="button"
          onClick={() => router.push("/admin/formulario")}
          className="rounded-md border border-white/10 px-4 py-2.5 text-sm text-zinc-300 hover:border-white/20"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={salvar}
          disabled={pendente}
          className="rounded-md bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-60"
        >
          Salvar
        </button>
      </div>
    </div>
  );
}
