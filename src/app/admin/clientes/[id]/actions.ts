"use server";

import { redirect } from "next/navigation";
import { exigirAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hashSenha } from "@/lib/senha";
import { enviarLinkAcessoWhatsapp } from "@/lib/whatsapp";

// Não guardamos a senha em texto puro, então reenviar o link (ex: cliente
// perdeu a mensagem, ou pediu de novo) exige definir uma senha nova —
// não tem como "reenviar a mesma".
export async function reenviarLinkComNovaSenha(formData: FormData) {
  await exigirAdmin();

  const clienteId = (formData.get("clienteId") ?? "").toString();
  const novaSenha = (formData.get("novaSenha") ?? "").toString();
  if (!novaSenha) throw new Error("Informe a nova senha.");

  const cliente = await prisma.clienteDs160.findUnique({ where: { id: clienteId } });
  if (!cliente) throw new Error("Cliente não encontrado.");
  if (!cliente.telefone) throw new Error("Esse cliente não tem telefone cadastrado.");

  await prisma.clienteDs160.update({
    where: { id: clienteId },
    data: { senhaHash: hashSenha(novaSenha) },
  });

  const envio = await enviarLinkAcessoWhatsapp({
    telefone: cliente.telefone,
    login: cliente.nome,
    senha: novaSenha,
  });

  redirect(`/admin/clientes/${clienteId}?whatsapp=${envio.ok ? "ok" : "falhou"}`);
}
