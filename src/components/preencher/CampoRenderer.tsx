"use client";

import type { Campo } from "@/lib/formulario-schema";

type Valor = string | string[] | undefined;

const estiloInput =
  "rounded-lg border border-white/10 bg-zinc-950/60 px-3 py-2.5 text-sm text-zinc-100 outline-none transition-colors focus:border-indigo-500/60";

export function CampoRenderer({
  campo,
  respostas,
  onChange,
}: {
  campo: Campo;
  respostas: Record<string, Valor>;
  onChange: (chave: string, valor: Valor) => void;
}) {
  const chave = String(campo.id);
  const valor = respostas[chave];

  if (campo.tipo === "section") {
    return (
      <div className="border-t border-white/10 pt-4 text-sm font-medium text-zinc-400">
        {campo.label}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm text-zinc-300">
        {campo.label}
        {campo.obrigatorio && <span className="text-amber-400"> *</span>}
      </label>
      {campo.descricao && <p className="text-xs text-zinc-500">{campo.descricao}</p>}

      <CorpoDoCampo campo={campo} chave={chave} valor={valor} respostas={respostas} onChange={onChange} />
    </div>
  );
}

function CorpoDoCampo({
  campo,
  chave,
  valor,
  respostas,
  onChange,
}: {
  campo: Campo;
  chave: string;
  valor: Valor;
  respostas: Record<string, Valor>;
  onChange: (chave: string, valor: Valor) => void;
}) {
  switch (campo.tipo) {
    case "textarea":
      return (
        <textarea
          required={campo.obrigatorio}
          value={(valor as string) ?? ""}
          onChange={(e) => onChange(chave, e.target.value)}
          rows={3}
          className={estiloInput}
        />
      );

    case "radio":
      return (
        <div className="flex flex-wrap gap-4">
          {campo.opcoes?.map((op) => (
            <label key={op.valor} className="flex items-center gap-2 text-sm text-zinc-200">
              <input
                type="radio"
                name={chave}
                required={campo.obrigatorio}
                checked={valor === op.valor}
                onChange={() => onChange(chave, op.valor)}
                className="accent-indigo-500"
              />
              {op.texto}
            </label>
          ))}
        </div>
      );

    case "select":
      return (
        <select
          required={campo.obrigatorio}
          value={(valor as string) ?? ""}
          onChange={(e) => onChange(chave, e.target.value)}
          className={estiloInput}
        >
          <option value="">Selecione...</option>
          {campo.opcoes?.map((op) => (
            <option key={op.valor} value={op.valor}>
              {op.texto}
            </option>
          ))}
        </select>
      );

    case "checkbox": {
      const selecionados = Array.isArray(valor) ? valor : [];
      return (
        <div className="flex flex-wrap gap-4">
          {campo.opcoes?.map((op) => {
            const marcado = selecionados.includes(op.valor);
            return (
              <label key={op.valor} className="flex items-center gap-2 text-sm text-zinc-200">
                <input
                  type="checkbox"
                  checked={marcado}
                  onChange={() => {
                    const novo = marcado
                      ? selecionados.filter((v) => v !== op.valor)
                      : [...selecionados, op.valor];
                    onChange(chave, novo);
                  }}
                  className="accent-indigo-500"
                />
                {op.texto}
              </label>
            );
          })}
        </div>
      );
    }

    case "consent":
      return (
        <label className="flex items-center gap-2 text-sm text-zinc-200">
          <input
            type="checkbox"
            required={campo.obrigatorio}
            checked={valor === "1"}
            onChange={(e) => onChange(chave, e.target.checked ? "1" : "")}
            className="accent-indigo-500"
          />
          Eu concordo.
        </label>
      );

    case "date":
    case "address": {
      if (!campo.subCampos || campo.subCampos.length === 0) {
        return (
          <input
            type="text"
            required={campo.obrigatorio}
            value={(valor as string) ?? ""}
            onChange={(e) => onChange(chave, e.target.value)}
            className={estiloInput}
          />
        );
      }
      return (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {campo.subCampos.map((sub) => (
            <label key={sub.id} className="flex flex-col gap-1 text-xs text-zinc-500">
              {sub.label}
              <input
                type="text"
                value={(respostas[sub.id] as string) ?? ""}
                onChange={(e) => onChange(sub.id, e.target.value)}
                className={estiloInput}
              />
            </label>
          ))}
        </div>
      );
    }

    case "email":
      return (
        <input
          type="email"
          required={campo.obrigatorio}
          value={(valor as string) ?? ""}
          onChange={(e) => onChange(chave, e.target.value)}
          className={estiloInput}
        />
      );

    case "phone":
      return (
        <input
          type="tel"
          required={campo.obrigatorio}
          value={(valor as string) ?? ""}
          onChange={(e) => onChange(chave, e.target.value)}
          className={estiloInput}
        />
      );

    case "number":
      return (
        <input
          type="text"
          inputMode="numeric"
          required={campo.obrigatorio}
          value={(valor as string) ?? ""}
          onChange={(e) => onChange(chave, e.target.value)}
          className={estiloInput}
        />
      );

    case "text":
    default:
      return (
        <input
          type="text"
          required={campo.obrigatorio}
          value={(valor as string) ?? ""}
          onChange={(e) => onChange(chave, e.target.value)}
          className={estiloInput}
        />
      );
  }
}
