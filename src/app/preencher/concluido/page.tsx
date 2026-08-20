import { logoutCliente } from "../../login/actions";

export default function ConcluidoPage() {
  return (
    <div className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
      <h1 className="text-lg font-semibold text-zinc-100">Rascunho concluído!</h1>
      <p className="text-sm text-zinc-400">
        Recebemos suas respostas. Nossa equipe vai revisar e entrar em contato se precisar de algo a
        mais.
      </p>
      <form action={logoutCliente}>
        <button
          type="submit"
          className="mt-2 rounded-lg border border-white/10 px-4 py-2.5 text-sm text-zinc-300 hover:border-white/20"
        >
          Sair
        </button>
      </form>
    </div>
  );
}
