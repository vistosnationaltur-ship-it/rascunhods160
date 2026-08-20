import Link from "next/link";
import { sessaoStaffAtual } from "@/lib/auth";
import { logoutStaff } from "./login/actions";

export default async function AdminHomePage() {
  const sessao = await sessaoStaffAtual();

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-zinc-100">Painel — Rascunho DS160</h1>
        <form action={logoutStaff}>
          <button className="text-sm text-zinc-400 underline-offset-4 hover:underline" type="submit">
            Sair ({sessao?.username})
          </button>
        </form>
      </div>
      <div className="flex flex-wrap gap-3">
        <Link
          href="/admin/clientes"
          className="w-fit rounded-lg border border-white/10 bg-zinc-900/60 px-4 py-2.5 text-sm text-zinc-100 transition-colors hover:border-indigo-500/50"
        >
          Clientes
        </Link>
        <Link
          href="/admin/clientes/novo"
          className="w-fit rounded-lg border border-white/10 bg-zinc-900/60 px-4 py-2.5 text-sm text-zinc-100 transition-colors hover:border-indigo-500/50"
        >
          Cadastrar cliente
        </Link>
        <Link
          href="/admin/formulario"
          className="w-fit rounded-lg border border-white/10 bg-zinc-900/60 px-4 py-2.5 text-sm text-zinc-100 transition-colors hover:border-indigo-500/50"
        >
          Ver formulário (páginas, perguntas e condicionais)
        </Link>
      </div>
    </div>
  );
}
