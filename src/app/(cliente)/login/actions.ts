"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { SESSION_COOKIE_CLIENTE, criarTokenCliente } from "@/lib/auth";
import { apenasDigitos, senhaConfere } from "@/lib/senha";

export type EstadoLoginCliente = { erro?: string };

export async function loginCliente(
  _estadoAnterior: EstadoLoginCliente,
  formData: FormData,
): Promise<EstadoLoginCliente> {
  const email = (formData.get("email") ?? "").toString().trim().toLowerCase();
  const senhaDigitada = (formData.get("senha") ?? "").toString();

  const cliente = await prisma.clienteDs160.findUnique({ where: { email } });
  // Senha nova é sempre o CPF — tolera pontuação (000.000.000-00) digitada
  // pelo cliente, normalizando pra só dígitos. Tenta o valor exato primeiro
  // pra não quebrar contas antigas cadastradas com senha manual (não-CPF).
  const confere =
    cliente &&
    (senhaConfere(senhaDigitada, cliente.senhaHash) ||
      senhaConfere(apenasDigitos(senhaDigitada), cliente.senhaHash));
  if (!confere) {
    return { erro: "E-mail ou senha incorretos." };
  }

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
