"use client";

import { useActionState } from "react";
import Link from "next/link";
import { cadastrarCliente } from "./actions";
import { SubmitButton } from "@/components/SubmitButton";

export function CadastroForm({
  flowClienteId,
  nome,
  cpf,
  email,
  telefone,
}: {
  flowClienteId?: string;
  nome?: string;
  cpf?: string;
  email?: string;
  telefone?: string;
}) {
  const [estado, formAction] = useActionState(cadastrarCliente, {});

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {flowClienteId && (
        <p className="text-xs text-emerald-400">Vinculado ao cliente do Flow (id {flowClienteId}).</p>
      )}
      <input type="hidden" name="flowClienteId" defaultValue={flowClienteId} />

      <label className="flex flex-col gap-1.5 text-sm">
        <span className="text-zinc-400">Nome completo</span>
        <input
          name="nome"
          required
          defaultValue={nome}
          className="rounded-lg border border-white/10 bg-zinc-950/60 px-3 py-2.5 text-zinc-100 outline-none focus:border-indigo-500/60"
        />
      </label>
      <div className="grid grid-cols-2 gap-4">
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="text-zinc-400">CPF (é a senha de login)</span>
          <input
            name="cpf"
            required
            defaultValue={cpf}
            className="rounded-lg border border-white/10 bg-zinc-950/60 px-3 py-2.5 text-zinc-100 outline-none focus:border-indigo-500/60"
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="text-zinc-400">E-mail (é o login)</span>
          <input
            name="email"
            type="email"
            required
            defaultValue={email}
            className="rounded-lg border border-white/10 bg-zinc-950/60 px-3 py-2.5 text-zinc-100 outline-none focus:border-indigo-500/60"
          />
        </label>
      </div>
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="text-zinc-400">WhatsApp (com DDD)</span>
        <input
          name="telefone"
          required
          defaultValue={telefone}
          placeholder="(17) 98838-0346"
          className="rounded-lg border border-white/10 bg-zinc-950/60 px-3 py-2.5 text-zinc-100 outline-none focus:border-indigo-500/60"
        />
      </label>

      {estado?.erro && (
        <p className="rounded-lg border border-red-500/20 bg-red-500/[0.06] px-3 py-2 text-sm text-red-300">
          {estado.erro}
        </p>
      )}

      <div className="flex items-center justify-between pt-2">
        <Link href="/admin/clientes/novo" className="text-sm text-zinc-500 underline-offset-4 hover:underline">
          Voltar pra busca
        </Link>
        <SubmitButton
          pendingLabel="Cadastrando..."
          className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Cadastrar
        </SubmitButton>
      </div>
    </form>
  );
}
