import { notFound, redirect } from "next/navigation";
import { exigirCliente } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { paginas } from "@/lib/formulario-schema";
import { PaginaWizard } from "./PaginaWizard";

export default async function PaginaDoWizard(props: PageProps<"/preencher/[pagina]">) {
  const { pagina: paginaParam } = await props.params;
  const indice = Number(paginaParam);

  if (!Number.isInteger(indice) || indice < 0 || indice >= paginas.length) {
    notFound();
  }

  const sessao = await exigirCliente();
  const cliente = await prisma.clienteDs160.findUnique({ where: { id: sessao.id } });
  if (!cliente) notFound();

  if (cliente.status === "CONCLUIDO") {
    redirect("/preencher/concluido");
  }

  const pagina = paginas[indice];
  const respostasIniciais = (cliente.respostas as Record<string, string | string[]>) ?? {};

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 p-8">
      <PaginaWizard pagina={pagina} totalPaginas={paginas.length} respostasIniciais={respostasIniciais} />
    </div>
  );
}
