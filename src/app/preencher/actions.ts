"use server";

import { exigirCliente } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { paginas } from "@/lib/formulario-schema";
import { gerarPdfRascunho } from "@/lib/gerar-pdf";
import { enviarPdfRascunho } from "@/lib/email";

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

// Salva a última página, marca como concluído, gera o PDF protegido por
// senha e manda por e-mail (equipe + cópia pro cliente, se ele informou
// um e-mail de cópia no formulário — campo 54, mesmo padrão do sistema
// antigo). Falha no e-mail não desfaz a conclusão: o rascunho já está
// salvo e concluído de qualquer forma, só o PDF pode precisar ser
// reenviado manualmente depois.
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

  const pdf = await gerarPdfRascunho({
    nomeCliente: cliente.nome,
    email: cliente.email,
    respostas: respostasNovas,
  });

  const destinatarios = new Set<string>();
  const emailEquipe = process.env.TEAM_EMAIL_DS160;
  if (emailEquipe) destinatarios.add(emailEquipe);
  const copiaCliente = respostasNovas["54"];
  if (typeof copiaCliente === "string" && copiaCliente.trim()) destinatarios.add(copiaCliente.trim());

  const envio = await enviarPdfRascunho({
    nomeCliente: cliente.nome,
    destinatarios: [...destinatarios],
    pdf,
  });

  await prisma.clienteDs160.update({
    where: { id: sessao.id },
    data: { pdfGeradoEm: new Date() },
  });

  if (!envio.ok) {
    console.error(`Falha ao enviar PDF do cliente ${cliente.id}: ${envio.erro}`);
  }
}
