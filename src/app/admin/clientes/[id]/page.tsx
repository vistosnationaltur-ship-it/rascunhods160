import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { reenviarLinkComNovaSenha } from "./actions";

export default async function ClienteDs160DetalhePage(
  props: PageProps<"/admin/clientes/[id]">,
) {
  const { id } = await props.params;
  const sp = await props.searchParams;
  const cliente = await prisma.clienteDs160.findUnique({ where: { id } });
  if (!cliente) notFound();

  const whatsapp = typeof sp.whatsapp === "string" ? sp.whatsapp : undefined;

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-zinc-100">{cliente.nome}</h1>
        <Link href="/admin/clientes" className="text-sm text-indigo-400 underline-offset-4 hover:underline">
          Voltar
        </Link>
      </div>

      {whatsapp === "ok" && (
        <p className="rounded-lg border border-emerald-500/20 bg-emerald-500/[0.06] px-4 py-2.5 text-sm text-emerald-300">
          Link de acesso enviado por WhatsApp.
        </p>
      )}
      {whatsapp === "falhou" && (
        <p className="rounded-lg border border-red-500/20 bg-red-500/[0.06] px-4 py-2.5 text-sm text-red-300">
          Cliente foi salvo, mas o envio pelo WhatsApp falhou. Tente reenviar abaixo.
        </p>
      )}

      <div className="grid grid-cols-2 gap-4 rounded-xl border border-white/10 bg-zinc-900/40 p-4 text-sm">
        <div>
          <p className="text-zinc-500">CPF</p>
          <p className="text-zinc-100">{cliente.cpf ?? "—"}</p>
        </div>
        <div>
          <p className="text-zinc-500">E-mail (login)</p>
          <p className="text-zinc-100">{cliente.email}</p>
        </div>
        <div>
          <p className="text-zinc-500">WhatsApp</p>
          <p className="text-zinc-100">{cliente.telefone ?? "—"}</p>
        </div>
        <div>
          <p className="text-zinc-500">Status</p>
          <p className="text-zinc-100">
            {cliente.status === "CONCLUIDO" ? "Concluído" : "Em preenchimento"}
          </p>
        </div>
        {cliente.flowClienteId && (
          <div>
            <p className="text-zinc-500">Cliente no Flow</p>
            <p className="text-zinc-100">{cliente.flowClienteId}</p>
          </div>
        )}
      </div>

      <form action={reenviarLinkComNovaSenha} className="flex flex-col gap-3">
        <input type="hidden" name="clienteId" value={cliente.id} />
        <p className="text-sm text-zinc-400">
          Reenviar o link de acesso via WhatsApp (define uma senha nova — não guardamos a senha em
          texto puro, então não dá pra reenviar a mesma).
        </p>
        <div className="flex gap-2">
          <input
            type="text"
            name="novaSenha"
            required
            placeholder="Nova senha"
            className="flex-1 rounded-lg border border-white/10 bg-zinc-950/60 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-indigo-500/60"
          />
          <button
            type="submit"
            className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-500"
          >
            Reenviar link
          </button>
        </div>
      </form>
    </div>
  );
}
