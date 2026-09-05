"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { SESSION_COOKIE_CLIENTE, criarTokenCliente } from "@/lib/auth";
import { apenasDigitos, senhaConfere } from "@/lib/senha";
import { verificarBloqueio, registrarTentativaFalha, registrarLoginOk, mensagemBloqueio } from "@/lib/rate-limit-login";

export type EstadoLoginCliente = { erro?: string };

export async function loginCliente(
  _estadoAnterior: EstadoLoginCliente,
  formData: FormData,
): Promise<EstadoLoginCliente> {
  const email = (formData.get("email") ?? "").toString().trim().toLowerCase();
  const senhaDigitada = (formData.get("senha") ?? "").toString();

  const statusBloqueio = await verificarBloqueio(email, "cliente");
  if (statusBloqueio.bloqueado) {
    return { erro: mensagemBloqueio(statusBloqueio) };
  }

  // E-mail não é mais único (mesma família pode compartilhar), então um
  // e-mail pode bater com vários cadastros — a senha (CPF) é quem
  // desempata qual conta é essa. Tenta o valor exato primeiro pra não
  // quebrar contas antigas com senha manual (não-CPF), depois normalizado
  // (tolera pontuação: "000.000.000-00").
  const candidatos = await prisma.clienteDs160.findMany({ where: { email } });
  const cliente = candidatos.find(
    (c) => senhaConfere(senhaDigitada, c.senhaHash) || senhaConfere(apenasDigitos(senhaDigitada), c.senhaHash),
  );
  if (!cliente) {
    await registrarTentativaFalha(email, "cliente");
    return { erro: "E-mail ou senha incorretos." };
  }
  await registrarLoginOk(email, "cliente");

  const cookieStore = await cookies();
  cookieStore.set(
    SESSION_COOKIE_CLIENTE,
    criarTokenCliente({ id: cliente.id, email: cliente.email }),
    {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    },
  );

  redirect("/preencher");
}

export async function logoutCliente() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_CLIENTE);
  redirect("/login");
}
