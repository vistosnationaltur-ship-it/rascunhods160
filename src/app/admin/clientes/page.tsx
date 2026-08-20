import Link from "next/link";
import { prisma } from "@/lib/prisma";

type SearchParams = { q?: string; sort?: string; ordem?: string };

const COLUNAS: { chave: string; label: string }[] = [
  { chave: "nome", label: "Nome" },
  { chave: "email", label: "E-mail" },
  { chave: "status", label: "Status" },
  { chave: "criadoEm", label: "Cadastrado em" },
];

export default async function ListaClientesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const sort = COLUNAS.some((c) => c.chave === sp.sort) ? sp.sort! : "criadoEm";
  const ordem = sp.ordem === "asc" ? "asc" : "desc";

  const clientes = await prisma.clienteDs160.findMany({
    where: sp.q
      ? {
          OR: [
            { nome: { contains: sp.q, mode: "insensitive" } },
            { email: { contains: sp.q, mode: "insensitive" } },
            { cpf: { contains: sp.q } },
          ],
        }
      : undefined,
    orderBy: { [sort]: ordem },
  });

  function linkOrdenar(coluna: string) {
    const proximaOrdem = sort === coluna && ordem === "asc" ? "desc" : "asc";
    const params = new URLSearchParams();
    if (sp.q) params.set("q", sp.q);
    params.set("sort", coluna);
    params.set("ordem", proximaOrdem);
    return `/admin/clientes?${params.toString()}`;
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-zinc-100">
          Clientes <span className="font-normal text-zinc-500">({clientes.length})</span>
        </h1>
        <div className="flex items-center gap-4">
          <Link href="/admin/clientes/novo" className="text-sm text-indigo-400 underline-offset-4 hover:underline">
            Cadastrar cliente
          </Link>
          <Link href="/admin" className="text-sm text-zinc-500 underline-offset-4 hover:underline">
            Voltar
          </Link>
        </div>
      </div>

      <form method="get" className="flex gap-2">
        <input
          type="text"
          name="q"
          defaultValue={sp.q}
          placeholder="Buscar por nome, e-mail ou CPF..."
          className="flex-1 rounded-lg border border-white/10 bg-zinc-950/60 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-indigo-500/60"
        />
        <button
          type="submit"
          className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-500"
        >
          Buscar
        </button>
      </form>

      {clientes.length === 0 && <p className="text-sm text-zinc-500">Nenhum cliente encontrado.</p>}

      {clientes.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-white/10">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-white/5 text-xs text-zinc-400">
              <tr>
                {COLUNAS.map((c) => (
                  <th key={c.chave} className="px-4 py-2.5 font-medium">
                    <Link href={linkOrdenar(c.chave)} className="flex items-center gap-1 hover:text-zinc-200">
                      {c.label}
                      {sort === c.chave && <span>{ordem === "asc" ? "↑" : "↓"}</span>}
                    </Link>
                  </th>
                ))}
                <th className="px-4 py-2.5 font-medium">Flow</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10 bg-zinc-900/40">
              {clientes.map((c) => (
                <tr key={c.id} className="transition-colors hover:bg-white/5">
                  <td className="px-4 py-3">
                    <Link href={`/admin/clientes/${c.id}`} className="text-zinc-100 hover:underline">
                      {c.nome}
                    </Link>
                    {c.cpf && <p className="text-xs text-zinc-500">{c.cpf}</p>}
                  </td>
                  <td className="px-4 py-3 text-zinc-300">{c.email}</td>
                  <td className="px-4 py-3">
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
                  </td>
                  <td className="px-4 py-3 text-zinc-400">
                    {c.criadoEm.toLocaleDateString("pt-BR")}
                  </td>
                  <td className="px-4 py-3 text-zinc-500">{c.flowClienteId ? "Sim" : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
