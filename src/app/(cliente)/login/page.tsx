"use client";

import { useActionState } from "react";
import { loginCliente } from "./actions";

export default function LoginClientePage() {
  const [estado, formAction, pendente] = useActionState(loginCliente, {});

  return (
    <div className="flex justify-center py-8">
      <form
        action={formAction}
        className="flex w-full max-w-sm flex-col gap-5 rounded-lg border border-zinc-200 bg-white p-8 shadow-sm"
      >
        <div className="flex flex-col gap-1 text-center">
          <h2 className="text-lg font-semibold text-zinc-900">Acesse seu rascunho</h2>
          <p className="text-sm text-zinc-500">Entre com o e-mail cadastrado e o seu CPF</p>
        </div>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="text-zinc-700">E-mail</span>
          <input
            type="email"
            name="email"
            required
            autoFocus
            autoCapitalize="off"
            autoCorrect="off"
            className="rounded-md border border-zinc-300 px-3 py-2.5 text-zinc-900 outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="text-zinc-700">CPF</span>
          <input
            type="password"
            name="senha"
            required
            placeholder="000.000.000-00"
            className="rounded-md border border-zinc-300 px-3 py-2.5 text-zinc-900 outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
          />
        </label>
        {estado?.erro && (
          <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {estado.erro}
          </p>
        )}
        <button
          type="submit"
          disabled={pendente}
          className="rounded-md bg-zinc-800 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-60"
        >
          {pendente ? "Entrando..." : "Entrar"}
        </button>
      </form>
    </div>
  );
}
