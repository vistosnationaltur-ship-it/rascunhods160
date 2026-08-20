"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { SESSION_COOKIE_CLIENTE, criarTokenCliente } from "@/lib/auth";
import { senhaConfere } from "@/lib/senha";

export async function loginCliente(formData: FormData) {
  const email = (formData.get("email") ?? "").toString().trim().toLowerCase();
  const senha = (formData.get("senha") ?? "").toString();

  const cliente = await prisma.clienteDs160.findUnique({ where: { email } });
  if (!cliente || !senhaConfere(senha, cliente.senhaHash)) {
    throw new Error("E-mail ou senha incorretos.");
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
