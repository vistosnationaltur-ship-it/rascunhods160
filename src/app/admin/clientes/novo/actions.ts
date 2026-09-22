"use server";

import { redirect } from "next/navigation";
import { exigirAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apenasDigitos, hashSenha } from "@/lib/senha";
import { enviarLinkAcessoWhatsapp } from "@/lib/whatsapp";

export type EstadoCadastroCliente = { erro?: string };

// Antes lançava (`throw`) direto nos casos de validação/duplicidade - como
// o form usa `action={cadastrarCliente}` sem useActionState, uma exceção
// aqui não vira uma mensagem bonitinha: sobe pro error boundary do Next e
// mostra a tela genérica "Algo deu errado" (React error #441), sem dizer
// qual foi o problema. Retornando um estado com `erro` (mesmo padrão do
// login, ver src/app/admin/login/actions.ts) o form mostra a mensagem
// certa e deixa o admin corrigir e tentar de novo.
export async function cadastrarCliente(
  _estadoAnterior: EstadoCadastroCliente,
  formData: FormData,
): Promise<EstadoCadastroCliente> {
  await exigirAdmin();

  const nome = (formData.get("nome") ?? "").toString().trim();
  const cpf = apenasDigitos((formData.get("cpf") ?? "").toString());
  const email = (formData.get("email") ?? "").toString().trim().toLowerCase();
  const telefone = (formData.get("telefone") ?? "").toString().trim() || null;
  const flowClienteId = (formData.get("flowClienteId") ?? "").toString().trim() || null;

  if (!nome || !email || !cpf) {
    return { erro: "Nome, e-mail e CPF são obrigatórios — o CPF é a senha de login do cliente." };
  }
  if (!telefone) {
    return { erro: "Telefone é obrigatório — é pra ele que o link de acesso vai ser enviado." };
  }

  // E-mail pode se repetir (ex: pai cadastrando o filho com o próprio
  // e-mail) — quem precisa ser único é o CPF, é a senha de login de cada
  // pessoa.
  const cpfExistente = await prisma.clienteDs160.findUnique({ where: { cpf } });
  if (cpfExistente) {
    return { erro: `Já existe um cliente cadastrado com o CPF "${cpf}".` };
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
