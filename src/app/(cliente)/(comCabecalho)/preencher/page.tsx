import { redirect } from "next/navigation";
import { exigirCliente } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { obterPaginas } from "@/lib/formulario-schema";

export default async function PreencherHomePage() {
  const sessao = await exigirCliente();
  const cliente = await prisma.clienteDs160.findUnique({ where: { id: sessao.id } });

  if (cliente?.status === "CONCLUIDO") {
    redirect("/preencher/concluido");
  }

  // Clampeia caso o formulário tenha encolhido (página excluída no admin)
  // e o paginaAtual salvo do cliente aponte pra um índice que não existe
  // mais — senão /preencher/[n] daria 404.
  const paginas = await obterPaginas();
  const alvo = Math.min(Math.max(cliente?.paginaAtual ?? 0, 0), paginas.length - 1);

  redirect(`/preencher/${alvo}`);
}
