import Link from "next/link";
import { obterPaginas } from "@/lib/formulario-schema";
import { GerenciadorPaginas } from "./GerenciadorPaginas";

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
            Abra uma página pra mexer nos campos; aqui você adiciona, renomeia, reordena e
            exclui páginas.
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

      <GerenciadorPaginas paginas={paginas} />
    </div>
  );
}
