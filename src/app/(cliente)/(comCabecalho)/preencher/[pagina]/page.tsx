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
    // key força o React a REMONTAR o wizard a cada página (em vez de só
    // re-renderizar o mesmo componente com props novas): sem isso, o
    // useState de PaginaWizard só lê `respostasIniciais` na primeira
    // página visitada na sessão, e o "respostas" em memória do cliente
    // segue rodando por cima disso pra sempre - se o Next reaproveitar uma
    // versão em cache de uma página antiga (ver staleTimes em
    // next.config.ts), o wizard fica com uma foto desatualizada do banco
    // que nunca se corrige sozinha.
    <PaginaWizard
      key={indice}
      pagina={pagina}
      totalPaginas={paginas.length}
      respostasIniciais={respostasIniciais}
    />
  );
}
