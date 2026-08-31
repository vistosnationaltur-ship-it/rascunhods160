import Link from "next/link";
import { notFound } from "next/navigation";
import { obterPaginas } from "@/lib/formulario-schema";
import { GerenciadorPagina } from "./GerenciadorPagina";

export const dynamic = "force-dynamic";

export default async function EditarPaginaFormulario(
  props: PageProps<"/admin/formulario/pagina/[indice]">,
) {
  const { indice } = await props.params;
  const i = Number(indice);

  const paginas = await obterPaginas();
  const pagina = paginas.find((p) => p.indice === i);
  if (!pagina) notFound();

  // Campos de todas as páginas — usado só pra avisar quando um campo que
  // vai ser excluído é gatilho de condicional de outro.
  const todosOsCampos = paginas.flatMap((p) => p.campos);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 p-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-lg font-semibold text-zinc-100">
            Página {pagina.indice + 1}
            {pagina.titulo !== `Página ${pagina.indice + 1}` && (
              <span className="text-zinc-500"> — {pagina.titulo}</span>
            )}
          </h1>
          <p className="text-sm text-zinc-500">
            Clique numa pergunta pra editar; use as setas pra reordenar. Cada alteração
            gera um backup automático.
          </p>
        </div>
        <Link
          href="/admin/formulario"
          className="text-sm text-indigo-400 underline-offset-4 hover:underline"
        >
          Voltar
        </Link>
      </div>

      <GerenciadorPagina pagina={pagina} todosOsCampos={todosOsCampos} />
    </div>
  );
}
