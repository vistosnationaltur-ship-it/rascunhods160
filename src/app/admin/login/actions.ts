"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { SESSION_COOKIE_STAFF, criarTokenStaff } from "@/lib/auth";
import { senhaConfere } from "@/lib/senha";
import { verificarBloqueio, registrarTentativaFalha, registrarLoginOk, mensagemBloqueio } from "@/lib/rate-limit-login";

export type EstadoLoginStaff = { erro?: string };

export async function loginStaff(
  _estadoAnterior: EstadoLoginStaff,
  formData: FormData,
): Promise<EstadoLoginStaff> {
  const username = (formData.get("username") ?? "").toString().trim();
  const senha = (formData.get("senha") ?? "").toString();

  const statusBloqueio = await verificarBloqueio(username, "staff");
  if (statusBloqueio.bloqueado) {
    return { erro: mensagemBloqueio(statusBloqueio) };
  }

  const usuario = await prisma.usuario.findUnique({ where: { username } });
  if (!usuario || !senhaConfere(senha, usuario.senhaHash)) {
    await registrarTentativaFalha(username, "staff");
    return { erro: "Usuário ou senha incorretos." };
  }
  await registrarLoginOk(username, "staff");

  const cookieStore = await cookies();
  cookieStore.set(
    SESSION_COOKIE_STAFF,
    criarTokenStaff({ id: usuario.id, username: usuario.username, role: usuario.role }),
    {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    },
  );

  redirect("/admin");
}

export async function logoutStaff() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_STAFF);
  redirect("/admin/login");
}
