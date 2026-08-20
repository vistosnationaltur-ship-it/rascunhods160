import { loginStaff } from "./actions";

export default function LoginStaffPage() {
  return (
    <div className="flex flex-1 items-center justify-center">
      <form
        action={loginStaff}
        className="flex w-full max-w-sm flex-col gap-5 rounded-2xl border border-white/10 bg-zinc-900/60 p-8 shadow-2xl shadow-black/40"
      >
        <div className="flex flex-col items-center gap-2 text-center">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-indigo-500" />
          <h1 className="text-lg font-semibold text-zinc-100">Rascunho DS160 — Admin</h1>
          <p className="text-sm text-zinc-500">Acesso restrito à equipe</p>
        </div>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="text-zinc-400">Usuário</span>
          <input
            type="text"
            name="username"
            required
            autoFocus
            autoCapitalize="off"
            autoCorrect="off"
            className="rounded-lg border border-white/10 bg-zinc-950/60 px-3 py-2.5 text-zinc-100 outline-none transition-colors focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-500/30"
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="text-zinc-400">Senha</span>
          <input
            type="password"
            name="senha"
            required
            className="rounded-lg border border-white/10 bg-zinc-950/60 px-3 py-2.5 text-zinc-100 outline-none transition-colors focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-500/30"
          />
        </label>
        <button
          type="submit"
          className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400"
        >
          Entrar
        </button>
      </form>
    </div>
  );
}
