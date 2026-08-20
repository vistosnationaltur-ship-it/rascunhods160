import Link from "next/link";

export default function HomePage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
      <h1 className="text-lg font-semibold text-zinc-100">Rascunho DS160 — 2N Travel</h1>
      <div className="flex gap-4 text-sm">
        <Link className="text-indigo-400 underline-offset-4 hover:underline" href="/login">
          Acesso do cliente
        </Link>
        <Link className="text-indigo-400 underline-offset-4 hover:underline" href="/admin/login">
          Acesso da equipe
        </Link>
      </div>
    </div>
  );
}
