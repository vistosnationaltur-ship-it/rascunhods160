import { notFound, redirect } from "next/navigation";
import { exigirCliente } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { obterPaginas } from "@/lib/formulario-schema";
import { PaginaWizard } from "./PaginaWizard";

export default async function PaginaDoWizard(props: PageProps<"/preencher/[pagina]">) {
  const { pagina: paginaParam } = await props.params;
  const indice = Number(paginaParam);

  const paginas = await obterPaginas();
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
    <PaginaWizard pagina={pagina} totalPaginas={paginas.length} respostasIniciais={respostasIniciais} />
  );
}
