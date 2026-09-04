"use client";

import type { Campo } from "@/lib/formulario-schema";

type Valor = string | string[] | undefined;

const estiloInput =
  "w-full rounded-md border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20";

// "required" sozinho aceita um valor só de espaços como preenchido (o
// HTML só olha se a string não está vazia). Esse pattern força ter
// pelo menos um caractere que não seja espaço, pra "obrigatório"
// realmente bloquear o avanço quando o campo só tem espaço em branco.
const PATTERN_NAO_SO_ESPACO = ".*\\S.*";
const TITULO_NAO_SO_ESPACO = "Preencha com um valor, não só espaços em branco.";

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
      <div className="border-t border-zinc-200 pt-4 text-sm font-semibold text-zinc-600">{campo.label}</div>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-zinc-800">
        {campo.label}
        {campo.obrigatorio && <span className="text-red-600"> *</span>}
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
            <label key={op.valor} className="flex items-center gap-2 text-sm text-zinc-700">
              <input
                type="radio"
                name={chave}
                required={campo.obrigatorio}
                checked={valor === op.valor}
                onChange={() => onChange(chave, op.valor)}
                className="accent-blue-600"
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
              <label key={op.valor} className="flex items-center gap-2 text-sm text-zinc-700">
                <input
                  type="checkbox"
                  checked={marcado}
                  onChange={() => {
                    const novo = marcado
                      ? selecionados.filter((v) => v !== op.valor)
                      : [...selecionados, op.valor];
                    onChange(chave, novo);
                  }}
                  className="accent-blue-600"
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
        <label className="flex items-center gap-2 text-sm text-zinc-700">
          <input
            type="checkbox"
            required={campo.obrigatorio}
            checked={valor === "1"}
            onChange={(e) => onChange(chave, e.target.checked ? "1" : "")}
            className="accent-blue-600"
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
            pattern={campo.obrigatorio ? PATTERN_NAO_SO_ESPACO : undefined}
            title={campo.obrigatorio ? TITULO_NAO_SO_ESPACO : undefined}
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
                required={campo.obrigatorio}
                pattern={campo.obrigatorio ? PATTERN_NAO_SO_ESPACO : undefined}
                title={campo.obrigatorio ? TITULO_NAO_SO_ESPACO : undefined}
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
          pattern={campo.obrigatorio ? PATTERN_NAO_SO_ESPACO : undefined}
          title={campo.obrigatorio ? TITULO_NAO_SO_ESPACO : undefined}
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
          pattern={campo.obrigatorio ? PATTERN_NAO_SO_ESPACO : undefined}
          title={campo.obrigatorio ? TITULO_NAO_SO_ESPACO : undefined}
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
          pattern={campo.obrigatorio ? PATTERN_NAO_SO_ESPACO : undefined}
          title={campo.obrigatorio ? TITULO_NAO_SO_ESPACO : undefined}
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
          pattern={campo.obrigatorio ? PATTERN_NAO_SO_ESPACO : undefined}
          title={campo.obrigatorio ? TITULO_NAO_SO_ESPACO : undefined}
          value={(valor as string) ?? ""}
          onChange={(e) => onChange(chave, e.target.value)}
          className={estiloInput}
        />
      );
  }
}
