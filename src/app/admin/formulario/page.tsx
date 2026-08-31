import Link from "next/link";
import { obterPaginas } from "@/lib/formulario-schema";

// O schema vem do banco e é editado pelo admin — sem isso, o Next
// tentaria pré-renderizar essa página no build e as edições não
// apareceriam até o próximo deploy.
export const dynamic = "force-dynamic";

export default async function VisualizarFormularioPage() {
  const paginas = await obterPaginas();
  const totalCampos = paginas.reduce((n, p) => n + p.campos.length, 0);
  const totalCondicionais = paginas.reduce(
    (n, p) => n + p.campos.filter((c) => c.condicional).length,
    0,
  );

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 p-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-lg font-semibold text-zinc-100">Formulário</h1>
          <p className="text-sm text-zinc-500">
            {paginas.length} páginas · {totalCampos} itens · {totalCondicionais} com condicional.
            Abra uma página pra adicionar, reordenar ou excluir campos.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Link
            className="text-sm text-indigo-400 underline-offset-4 hover:underline"
            href="/admin/formulario/backups"
          >
            Backups
          </Link>
          <Link className="text-sm text-indigo-400 underline-offset-4 hover:underline" href="/admin">
            Voltar
          </Link>
        </div>
      </div>

      <div className="flex flex-col divide-y divide-white/10 rounded-xl border border-white/10 bg-zinc-900/40">
        {paginas.map((pagina) => {
          const condicionais = pagina.campos.filter((c) => c.condicional).length;
          const perguntas = pagina.campos.filter((c) => c.tipo !== "section").length;
          return (
            <Link
              key={pagina.indice}
              href={`/admin/formulario/pagina/${pagina.indice}`}
              className="flex items-center justify-between gap-4 px-4 py-3 transition-colors hover:bg-white/5"
            >
              <div className="flex flex-col gap-0.5">
                <span className="text-sm text-zinc-100">
                  Página {pagina.indice + 1}
                  {pagina.titulo !== `Página ${pagina.indice + 1}` && ` — ${pagina.titulo}`}
                </span>
                <span className="text-xs text-zinc-500">
                  {perguntas} pergunta{perguntas === 1 ? "" : "s"}
                  {condicionais > 0 && ` · ${condicionais} com condicional`}
                </span>
              </div>
              <span className="text-xs text-zinc-600">#{pagina.indice + 1}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
