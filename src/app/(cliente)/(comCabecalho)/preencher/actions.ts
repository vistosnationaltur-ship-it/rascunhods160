"use server";

import { cookies } from "next/headers";
import { exigirCliente, SESSION_COOKIE_CLIENTE } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { obterPaginas } from "@/lib/formulario-schema";
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

// "Salvar e continuar depois": salva a página atual (igual salvarPagina)
// e desloga o cliente, pra ele saber com clareza que pode fechar a aba
// com segurança — a sessão já dura 30 dias sozinha, mas sem um passo
// explícito o cliente não tinha como ter certeza de que estava salvo.
export async function salvarESair(paginaIndice: number, respostasPagina: Record<string, Valor>) {
  await salvarPagina(paginaIndice, respostasPagina);

  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_CLIENTE);
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

  const paginas = await obterPaginas();
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
