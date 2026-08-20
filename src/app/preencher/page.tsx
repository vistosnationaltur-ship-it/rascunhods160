import { sessaoClienteAtual } from "@/lib/auth";
import { logoutCliente } from "../login/actions";

export default async function PreencherHomePage() {
  const sessao = await sessaoClienteAtual();

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-zinc-100">Rascunho DS160</h1>
        <form action={logoutCliente}>
          <button className="text-sm text-zinc-400 underline-offset-4 hover:underline" type="submit">
            Sair ({sessao?.email})
          </button>
        </form>
      </div>
      <p className="text-sm text-zinc-500">O assistente de preenchimento entra na próxima fase.</p>
    </div>
  );
}
