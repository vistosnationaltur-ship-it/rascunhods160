import { redirect } from "next/navigation";
import { exigirCliente } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function PreencherHomePage() {
  const sessao = await exigirCliente();
  const cliente = await prisma.clienteDs160.findUnique({ where: { id: sessao.id } });

  if (cliente?.status === "CONCLUIDO") {
    redirect("/preencher/concluido");
  }

  redirect(`/preencher/${cliente?.paginaAtual ?? 0}`);
}
