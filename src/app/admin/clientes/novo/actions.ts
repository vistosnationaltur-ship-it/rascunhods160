"use server";

import { redirect } from "next/navigation";
import { exigirAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hashSenha } from "@/lib/senha";
import { enviarLinkAcessoWhatsapp } from "@/lib/whatsapp";

export async function cadastrarCliente(formData: FormData) {
  await exigirAdmin();

  const nome = (formData.get("nome") ?? "").toString().trim();
  const cpf = (formData.get("cpf") ?? "").toString().trim() || null;
  const email = (formData.get("email") ?? "").toString().trim().toLowerCase();
  const telefone = (formData.get("telefone") ?? "").toString().trim() || null;
  const flowClienteId = (formData.get("flowClienteId") ?? "").toString().trim() || null;
  const senha = (formData.get("senha") ?? "").toString();

  if (!nome || !email || !senha) {
    throw new Error("Nome, e-mail e senha são obrigatórios.");
  }
  if (!telefone) {
    throw new Error("Telefone é obrigatório — é pra ele que o link de acesso vai ser enviado.");
  }

  const emailExistente = await prisma.clienteDs160.findUnique({ where: { email } });
  if (emailExistente) {
    throw new Error(`Já existe um cliente cadastrado com o e-mail "${email}".`);
  }

  const cliente = await prisma.clienteDs160.create({
    data: {
      nome,
      cpf,
      email,
      telefone,
      flowClienteId,
      senhaHash: hashSenha(senha),
    },
  });

  // Senha em texto puro só existe aqui, neste momento — depois disso só o
  // hash fica salvo. Por isso o envio acontece já no cadastro, não como
  // uma ação separada depois. "login" no payload é o nome (usado na
  // saudação do template do WhatsApp), o e-mail em si não vai na
  // mensagem — o texto do template já instrui o cliente a usar o e-mail
  // cadastrado.
  const envio = await enviarLinkAcessoWhatsapp({ telefone, login: nome, senha });

  redirect(`/admin/clientes/${cliente.id}?whatsapp=${envio.ok ? "ok" : "falhou"}`);
}
