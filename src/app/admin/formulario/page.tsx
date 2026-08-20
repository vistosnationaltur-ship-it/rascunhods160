import Link from "next/link";
import { obterPaginas } from "@/lib/formulario-schema";
import { campoResumo, descreverCondicional, tipoLegivel } from "@/lib/formulario-labels";

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
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-8 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-zinc-100">Formulário</h1>
          <p className="text-sm text-zinc-500">
            {paginas.length} páginas · {totalCampos} itens · {totalCondicionais} com condicional.
            Clique numa pergunta pra editar.
          </p>
        </div>
        <Link className="text-sm text-indigo-400 underline-offset-4 hover:underline" href="/admin">
          Voltar
        </Link>
      </div>

      <div className="flex flex-col gap-10">
        {paginas.map((pagina) => (
          <section key={pagina.indice} className="flex flex-col gap-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-indigo-400">
              Página {pagina.indice + 1}
              {pagina.titulo !== `Página ${pagina.indice + 1}` && ` — ${pagina.titulo}`}
            </h2>
            <div className="flex flex-col divide-y divide-white/10 rounded-xl border border-white/10 bg-zinc-900/40">
              {pagina.campos.map((campo) => {
                if (campo.tipo === "section") {
                  return (
                    <div key={campo.id} className="bg-white/5 px-4 py-2 text-xs font-medium text-zinc-400">
                      {campo.label || "(seção sem título)"}
                    </div>
                  );
                }
                const resumo = campoResumo(campo);
                return (
                  <Link
                    key={campo.id}
                    href={`/admin/formulario/${campo.id}/editar`}
                    className="flex flex-col gap-1 px-4 py-3 transition-colors hover:bg-white/5"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm text-zinc-100">{campo.label}</span>
                      <span className="rounded-full bg-white/10 px-2 py-0.5 text-[11px] text-zinc-400">
                        {tipoLegivel(campo.tipo)}
                      </span>
                      {campo.obrigatorio && (
                        <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[11px] text-amber-400">
                          obrigatório
                        </span>
                      )}
                      <span className="text-[11px] text-zinc-600">#{campo.id}</span>
                    </div>
                    {resumo && <p className="text-xs text-zinc-500">Opções: {resumo}</p>}
                    {campo.descricao && <p className="text-xs text-zinc-500">{campo.descricao}</p>}
                    {campo.condicional && (
                      <p className="text-xs text-sky-400">
                        ↳ {descreverCondicional(campo.condicional, paginas)}
                      </p>
                    )}
                  </Link>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
