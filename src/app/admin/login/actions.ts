"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { COOKIE_2FA_STAFF, SESSION_COOKIE_STAFF, criarToken2faStaff, criarTokenStaff } from "@/lib/auth";
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

  // Com 2FA ativo, a senha sozinha não abre a sessão: guarda um cookie curto e pede o código.
  if (usuario.totpAtivadoEm && usuario.totpSecret) {
    cookieStore.set(COOKIE_2FA_STAFF, criarToken2faStaff(usuario.id), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 5 * 60,
    });
    redirect("/admin/login/2fa");
  }

  // Sem 2FA ainda: sessão "incompleta" (mfa false) que só alcança a tela de configuração
  // (ver src/proxy.ts) — o 2FA é obrigatório pra usar o admin.
  cookieStore.set(
    SESSION_COOKIE_STAFF,
    criarTokenStaff({ id: usuario.id, username: usuario.username, role: usuario.role, mfa: false }),
    {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    },
  );

  redirect("/admin/seguranca");
}

export async function logoutStaff() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_STAFF);
  redirect("/admin/login");
}
