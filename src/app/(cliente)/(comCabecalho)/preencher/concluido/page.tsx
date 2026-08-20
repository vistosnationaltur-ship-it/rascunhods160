import { logoutCliente } from "../../../login/actions";

export default function ConcluidoPage() {
  return (
    <div className="mx-auto flex w-full max-w-xl flex-col items-center gap-4 py-12 text-center">
      <h2 className="text-lg font-semibold text-zinc-900">Rascunho concluído!</h2>
      <p className="text-sm text-zinc-600">
        Recebemos suas respostas. Nossa equipe vai revisar e entrar em contato se precisar de algo a
        mais.
      </p>
      <form action={logoutCliente}>
        <button
          type="submit"
          className="mt-2 rounded-md border border-zinc-300 px-4 py-2.5 text-sm text-zinc-700 hover:bg-zinc-50"
        >
          Sair
        </button>
      </form>
    </div>
  );
}
