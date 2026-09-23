"use client";

import { useActionState } from "react";

type Estado = { erro?: string };

// Campo do código de 6 dígitos + botão. A action devolve { erro } (ou redireciona se der certo).
export function FormCodigo2fa({
  action,
  rotuloBotao,
}: {
  action: (estado: Estado, formData: FormData) => Promise<Estado>;
  rotuloBotao: string;
}) {
  const [estado, formAction, pendente] = useActionState(action, {});

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input
        name="codigo"
        inputMode="numeric"
        autoComplete="one-time-code"
        pattern="[0-9 ]*"
        maxLength={7}
        required
        placeholder="000000"
        className="rounded-lg border border-white/10 bg-zinc-950/60 px-3 py-2.5 text-center font-mono text-lg tracking-[0.4em] text-zinc-100 outline-none focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-500/30"
      />
      {estado.erro && (
        <p
          aria-live="polite"
          className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-300"
        >
          {estado.erro}
        </p>
      )}
      <button
        type="submit"
        disabled={pendente}
        className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pendente ? "Conferindo…" : rotuloBotao}
      </button>
    </form>
  );
}
