import Link from "next/link";
import { buscarClientesFlow } from "@/lib/flow-cliente";
import { cadastrarCliente } from "./actions";
import { SubmitButton } from "@/components/SubmitButton";

type SearchParams = {
  q?: string;
  nome?: string;
  cpf?: string;
  email?: string;
  telefone?: string;
  flowClienteId?: string;
};

export default async function CadastrarClientePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  // Boolean(sp.nome) falhava pro fluxo "preencher manualmente": o link
  // manda nome="" (string vazia), e Boolean("") é falso — a página nunca
  // trocava pro formulário. typeof checa só se o parâmetro veio na URL,
  // não se tem conteúdo.
  const dadosEscolhidos = typeof sp.nome === "string";
  const resultados = sp.q ? await buscarClientesFlow(sp.q) : [];

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-zinc-100">Cadastrar cliente</h1>
        <Link href="/admin/clientes" className="text-sm text-indigo-400 underline-offset-4 hover:underline">
          Voltar
        </Link>
      </div>

      {!dadosEscolhidos && (
        <>
          <form method="get" className="flex gap-2">
            <input
              type="text"
              name="q"
              defaultValue={sp.q}
              placeholder="Buscar cliente do Flow por nome ou CPF..."
              autoFocus
              className="flex-1 rounded-lg border border-white/10 bg-zinc-950/60 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-indigo-500/60"
            />
            <button
              type="submit"
              className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-500"
            >
              Buscar
            </button>
          </form>

          {sp.q && resultados.length === 0 && (
            <p className="text-sm text-zinc-500">
              Nenhum cliente encontrado no Flow pra &quot;{sp.q}&quot; (ou o Flow está fora do ar
              agora). Você pode preencher os dados manualmente abaixo.
            </p>
          )}

          {resultados.length > 0 && (
            <div className="flex flex-col divide-y divide-white/10 rounded-xl border border-white/10 bg-zinc-900/40">
              {resultados.map((c) => {
                const params = new URLSearchParams({
                  nome: c.nome,
                  cpf: c.cpf ?? "",
                  email: c.email ?? "",
                  telefone: c.telefone ?? "",
                  flowClienteId: c.id,
                });
                return (
                  <Link
                    key={c.id}
                    href={`/admin/clientes/novo?${params.toString()}`}
                    className="flex flex-col gap-0.5 px-4 py-3 transition-colors hover:bg-white/5"
                  >
                    <span className="text-sm text-zinc-100">{c.nome}</span>
                    <span className="text-xs text-zinc-500">
                      {c.cpf ?? "sem CPF"} · {c.email ?? "sem e-mail"} · {c.telefone ?? "sem telefone"}
                    </span>
                  </Link>
                );
              })}
            </div>
          )}

          <Link
            href="/admin/clientes/novo?nome=&cpf=&email=&telefone=&flowClienteId="
            className="text-sm text-zinc-500 underline-offset-4 hover:underline"
          >
            Preencher manualmente, sem buscar no Flow
          </Link>
        </>
      )}

      {dadosEscolhidos && (
        <form action={cadastrarCliente} className="flex flex-col gap-4">
          {sp.flowClienteId && (
            <p className="text-xs text-emerald-400">Vinculado ao cliente do Flow (id {sp.flowClienteId}).</p>
          )}
          <input type="hidden" name="flowClienteId" defaultValue={sp.flowClienteId} />

          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-zinc-400">Nome completo</span>
            <input
              name="nome"
              required
              defaultValue={sp.nome}
              className="rounded-lg border border-white/10 bg-zinc-950/60 px-3 py-2.5 text-zinc-100 outline-none focus:border-indigo-500/60"
            />
          </label>
          <div className="grid grid-cols-2 gap-4">
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="text-zinc-400">CPF (é a senha de login)</span>
              <input
                name="cpf"
                required
                defaultValue={sp.cpf}
                className="rounded-lg border border-white/10 bg-zinc-950/60 px-3 py-2.5 text-zinc-100 outline-none focus:border-indigo-500/60"
              />
            </label>
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="text-zinc-400">E-mail (é o login)</span>
              <input
                name="email"
                type="email"
                required
                defaultValue={sp.email}
                className="rounded-lg border border-white/10 bg-zinc-950/60 px-3 py-2.5 text-zinc-100 outline-none focus:border-indigo-500/60"
              />
            </label>
          </div>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-zinc-400">WhatsApp (com DDD)</span>
            <input
              name="telefone"
              required
              defaultValue={sp.telefone}
              placeholder="(17) 98838-0346"
              className="rounded-lg border border-white/10 bg-zinc-950/60 px-3 py-2.5 text-zinc-100 outline-none focus:border-indigo-500/60"
            />
          </label>

          <div className="flex items-center justify-between pt-2">
            <Link
              href="/admin/clientes/novo"
              className="text-sm text-zinc-500 underline-offset-4 hover:underline"
            >
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
      )}
    </div>
  );
}
