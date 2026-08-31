import Link from "next/link";
import { listarBackups } from "@/lib/formulario-backup";
import { RestaurarBackup } from "./RestaurarBackup";

export const dynamic = "force-dynamic";

const formatador = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: "America/Sao_Paulo",
});

export default async function BackupsFormularioPage() {
  const backups = await listarBackups();

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 p-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-lg font-semibold text-zinc-100">Backups do formulário</h1>
          <p className="text-sm text-zinc-500">
            Um snapshot é guardado automaticamente antes de cada alteração. Restaurar
            substitui o formulário inteiro pelo snapshot escolhido (e guarda o estado atual
            como mais um backup).
          </p>
        </div>
        <Link
          className="text-sm text-indigo-400 underline-offset-4 hover:underline"
          href="/admin/formulario"
        >
          Voltar
        </Link>
      </div>

      {backups.length === 0 ? (
        <p className="rounded-xl border border-white/10 bg-zinc-900/40 px-4 py-6 text-center text-sm text-zinc-500">
          Nenhum backup ainda — o primeiro será criado na próxima alteração do formulário.
        </p>
      ) : (
        <div className="flex flex-col divide-y divide-white/10 rounded-xl border border-white/10 bg-zinc-900/40">
          {backups.map((b) => (
            <div key={b.id} className="flex items-center justify-between gap-4 px-4 py-3">
              <div className="flex flex-col gap-0.5">
                <span className="text-sm text-zinc-200">{formatador.format(b.criadoEm)}</span>
                <span className="text-xs text-zinc-500">{b.motivo}</span>
                <span className="text-[11px] text-zinc-600">
                  {b.totalPaginas} páginas · {b.totalCampos} campos
                </span>
              </div>
              <RestaurarBackup backupId={b.id} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
