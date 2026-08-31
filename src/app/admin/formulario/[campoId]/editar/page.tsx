import Link from "next/link";
import { notFound } from "next/navigation";
import { obterPaginas, buscarCampoPorId } from "@/lib/formulario-schema";
import { EditorCampo } from "./EditorCampo";

export default async function EditarCampoPage(props: PageProps<"/admin/formulario/[campoId]/editar">) {
  const { campoId } = await props.params;
  const id = Number(campoId);

  const paginas = await obterPaginas();
  const campo = buscarCampoPorId(paginas, id);
  if (!campo) notFound();

  const todosOsCampos = paginas.flatMap((p) => p.campos);

  // Campo imediatamente acima na mesma página — pra opção "mesma linha
  // que o campo de cima" no editor de layout.
  const paginaDoCampo = paginas.find((p) => p.campos.some((c) => c.id === id));
  const idxNaPagina = paginaDoCampo?.campos.findIndex((c) => c.id === id) ?? -1;
  const campoAnterior =
    paginaDoCampo && idxNaPagina > 0 ? paginaDoCampo.campos[idxNaPagina - 1] : null;

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-zinc-100">
          Editar pergunta <span className="text-zinc-500">#{campo.id}</span>
        </h1>
        <Link href="/admin/formulario" className="text-sm text-indigo-400 underline-offset-4 hover:underline">
          Voltar
        </Link>
      </div>
      <EditorCampo campo={campo} todosOsCampos={todosOsCampos} campoAnterior={campoAnterior} />
    </div>
  );
}
