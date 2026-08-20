import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { editarCliente } from "../actions";

export default async function EditarClientePage(props: PageProps<"/admin/clientes/[id]/editar">) {
  const { id } = await props.params;
  const cliente = await prisma.clienteDs160.findUnique({ where: { id } });
  if (!cliente) notFound();

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-zinc-100">Editar {cliente.nome}</h1>
        <Link href={`/admin/clientes/${cliente.id}`} className="text-sm text-indigo-400 underline-offset-4 hover:underline">
          Voltar
        </Link>
      </div>

      <form action={editarCliente} className="flex flex-col gap-4">
        <input type="hidden" name="clienteId" value={cliente.id} />

        <label className="flex flex-col gap-1.5 text-sm">
          <span className="text-zinc-400">Nome completo</span>
          <input
            name="nome"
            required
            defaultValue={cliente.nome}
            className="rounded-lg border border-white/10 bg-zinc-950/60 px-3 py-2.5 text-zinc-100 outline-none focus:border-indigo-500/60"
          />
        </label>

        <div className="grid grid-cols-2 gap-4">
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-zinc-400">CPF (é a senha de login)</span>
            <input
              name="cpf"
              required
              defaultValue={cliente.cpf ?? ""}
              className="rounded-lg border border-white/10 bg-zinc-950/60 px-3 py-2.5 text-zinc-100 outline-none focus:border-indigo-500/60"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-zinc-400">E-mail (é o login)</span>
            <input
              name="email"
              type="email"
              required
              defaultValue={cliente.email}
              className="rounded-lg border border-white/10 bg-zinc-950/60 px-3 py-2.5 text-zinc-100 outline-none focus:border-indigo-500/60"
            />
          </label>
        </div>

        <label className="flex flex-col gap-1.5 text-sm">
          <span className="text-zinc-400">WhatsApp (com DDD)</span>
          <input
            name="telefone"
            required
            defaultValue={cliente.telefone ?? ""}
            placeholder="(17) 98838-0346"
            className="rounded-lg border border-white/10 bg-zinc-950/60 px-3 py-2.5 text-zinc-100 outline-none focus:border-indigo-500/60"
          />
        </label>

        <p className="text-xs text-zinc-500">
          Se trocar o CPF, a senha de login muda junto (senha é sempre o CPF).
        </p>

        <div className="flex items-center justify-between pt-2">
          <Link
            href={`/admin/clientes/${cliente.id}`}
            className="text-sm text-zinc-500 underline-offset-4 hover:underline"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-500"
          >
            Salvar
          </button>
        </div>
      </form>
    </div>
  );
}
