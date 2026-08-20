"use server";

import { redirect } from "next/navigation";
import { exigirAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apenasDigitos, hashSenha } from "@/lib/senha";
import { enviarLinkAcessoWhatsapp } from "@/lib/whatsapp";

// A senha de login é sempre o CPF do cliente (já salvo em texto puro no
// cadastro dele), então reenviar o link não precisa de senha nova — só
// dispara o WhatsApp de novo com os dados que já existem.
export async function reenviarLinkAcesso(formData: FormData) {
  await exigirAdmin();

  const clienteId = (formData.get("clienteId") ?? "").toString();

  const cliente = await prisma.clienteDs160.findUnique({ where: { id: clienteId } });
  if (!cliente) throw new Error("Cliente não encontrado.");
  if (!cliente.telefone) throw new Error("Esse cliente não tem telefone cadastrado.");

  const envio = await enviarLinkAcessoWhatsapp({
    telefone: cliente.telefone,
    login: cliente.nome,
  });

  redirect(`/admin/clientes/${clienteId}?whatsapp=${envio.ok ? "ok" : "falhou"}`);
}

// Edita os dados de contato/identificação (ex: telefone errado no
// cadastro, que hoje só se descobre depois — não tinha como corrigir
// sem excluir e recadastrar do zero). Se o CPF mudar, a senha de login
// (que é o CPF) é recalculada junto, senão o cliente ficaria trancado
// pra fora com o CPF novo.
export async function editarCliente(formData: FormData) {
  await exigirAdmin();

  const clienteId = (formData.get("clienteId") ?? "").toString();
  const nome = (formData.get("nome") ?? "").toString().trim();
  const cpf = apenasDigitos((formData.get("cpf") ?? "").toString());
  const email = (formData.get("email") ?? "").toString().trim().toLowerCase();
  const telefone = (formData.get("telefone") ?? "").toString().trim() || null;

  if (!nome || !email || !cpf) {
    throw new Error("Nome, e-mail e CPF são obrigatórios — o CPF é a senha de login do cliente.");
  }
  if (!telefone) {
    throw new Error("Telefone é obrigatório — é pra ele que o link de acesso vai ser enviado.");
  }

  const cpfEmUso = await prisma.clienteDs160.findUnique({ where: { cpf } });
  if (cpfEmUso && cpfEmUso.id !== clienteId) {
    throw new Error(`Já existe outro cliente cadastrado com o CPF "${cpf}".`);
  }

  await prisma.clienteDs160.update({
    where: { id: clienteId },
    data: { nome, cpf, email, telefone, senhaHash: hashSenha(cpf) },
  });

  redirect(`/admin/clientes/${clienteId}`);
}

// Permite excluir um cliente já cadastrado (ex: acesso enviado errado,
// teste, ou pra recadastrar do zero a partir do Flow) — libera o e-mail
// pra um cadastro novo, já que é único.
export async function excluirCliente(formData: FormData) {
  await exigirAdmin();

  const clienteId = (formData.get("clienteId") ?? "").toString();
  await prisma.clienteDs160.delete({ where: { id: clienteId } });

  redirect("/admin/clientes");
}
