"use server";

import { redirect } from "next/navigation";
import { exigirAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apenasDigitos, hashSenha } from "@/lib/senha";
import { enviarLinkAcessoWhatsapp } from "@/lib/whatsapp";

export async function cadastrarCliente(formData: FormData) {
  await exigirAdmin();

  const nome = (formData.get("nome") ?? "").toString().trim();
  const cpf = apenasDigitos((formData.get("cpf") ?? "").toString());
  const email = (formData.get("email") ?? "").toString().trim().toLowerCase();
  const telefone = (formData.get("telefone") ?? "").toString().trim() || null;
  const flowClienteId = (formData.get("flowClienteId") ?? "").toString().trim() || null;

  if (!nome || !email || !cpf) {
    throw new Error("Nome, e-mail e CPF são obrigatórios — o CPF é a senha de login do cliente.");
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
      senhaHash: hashSenha(cpf),
    },
  });

  // "login" no payload é o nome (usado na saudação do template do
  // WhatsApp) — a senha não vai na mensagem, o texto do template já
  // instrui o cliente a usar o e-mail cadastrado + o próprio CPF.
  const envio = await enviarLinkAcessoWhatsapp({ telefone, login: nome });

  redirect(`/admin/clientes/${cliente.id}?whatsapp=${envio.ok ? "ok" : "falhou"}`);
}
