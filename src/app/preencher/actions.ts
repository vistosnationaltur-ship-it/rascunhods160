"use server";

import { exigirCliente } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { paginas } from "@/lib/formulario-schema";

type Valor = string | string[] | undefined;

// Salva as respostas da página atual (mescladas com o que já existia) e
// marca até onde o cliente chegou, pra "salvar e continuar depois"
// funcionar de verdade — sempre retoma exatamente na página em que
// parou, não na mais avançada que já viu.
export async function salvarPagina(paginaIndice: number, respostasPagina: Record<string, Valor>) {
  const sessao = await exigirCliente();

  const cliente = await prisma.clienteDs160.findUnique({ where: { id: sessao.id } });
  if (!cliente) throw new Error("Cliente não encontrado.");
  if (cliente.status === "CONCLUIDO") {
    throw new Error("Esse rascunho já foi concluído.");
  }

  const respostasAtuais = (cliente.respostas as Record<string, Valor>) ?? {};
  const respostasNovas = { ...respostasAtuais, ...respostasPagina };

  await prisma.clienteDs160.update({
    where: { id: sessao.id },
    data: {
      respostas: respostasNovas,
      paginaAtual: paginaIndice,
    },
  });
}

// Salva a última página e marca como concluído. A geração do PDF e o
// envio por e-mail entram numa fase seguinte — por enquanto só fecha o
// rascunho pro cliente.
export async function concluirRascunho(respostasPagina: Record<string, Valor>) {
  const sessao = await exigirCliente();

  const cliente = await prisma.clienteDs160.findUnique({ where: { id: sessao.id } });
  if (!cliente) throw new Error("Cliente não encontrado.");
  if (cliente.status === "CONCLUIDO") return;

  const respostasAtuais = (cliente.respostas as Record<string, Valor>) ?? {};
  const respostasNovas = { ...respostasAtuais, ...respostasPagina };

  await prisma.clienteDs160.update({
    where: { id: sessao.id },
    data: {
      respostas: respostasNovas,
      paginaAtual: paginas.length - 1,
      status: "CONCLUIDO",
    },
  });
}
