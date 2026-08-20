"use server";

import { redirect } from "next/navigation";
import { exigirAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
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

// Permite excluir um cliente já cadastrado (ex: acesso enviado errado,
// teste, ou pra recadastrar do zero a partir do Flow) — libera o e-mail
// pra um cadastro novo, já que é único.
export async function excluirCliente(formData: FormData) {
  await exigirAdmin();

  const clienteId = (formData.get("clienteId") ?? "").toString();
  await prisma.clienteDs160.delete({ where: { id: clienteId } });

  redirect("/admin/clientes");
}
