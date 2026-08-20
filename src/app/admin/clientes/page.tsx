import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function ListaClientesPage() {
  const clientes = await prisma.clienteDs160.findMany({
    orderBy: { criadoEm: "desc" },
  });

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-zinc-100">Clientes</h1>
        <div className="flex items-center gap-4">
          <Link href="/admin/clientes/novo" className="text-sm text-indigo-400 underline-offset-4 hover:underline">
            Cadastrar cliente
          </Link>
          <Link href="/admin" className="text-sm text-zinc-500 underline-offset-4 hover:underline">
            Voltar
          </Link>
        </div>
      </div>

      {clientes.length === 0 && (
        <p className="text-sm text-zinc-500">Nenhum cliente cadastrado ainda.</p>
      )}

      <div className="flex flex-col divide-y divide-white/10 rounded-xl border border-white/10 bg-zinc-900/40">
        {clientes.map((c) => (
          <Link
            key={c.id}
            href={`/admin/clientes/${c.id}`}
            className="flex items-center justify-between px-4 py-3 transition-colors hover:bg-white/5"
          >
            <div>
              <p className="text-sm text-zinc-100">{c.nome}</p>
              <p className="text-xs text-zinc-500">
                {c.cpf ?? "sem CPF"} · {c.email}
                {c.flowClienteId && " · vinculado ao Flow"}
              </p>
            </div>
            <span
              className={
                "rounded-full px-2.5 py-1 text-[11px] " +
                (c.status === "CONCLUIDO"
                  ? "bg-emerald-500/10 text-emerald-400"
                  : "bg-amber-500/10 text-amber-400")
              }
            >
              {c.status === "CONCLUIDO" ? "Concluído" : "Em preenchimento"}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
