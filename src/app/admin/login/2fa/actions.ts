"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { COOKIE_2FA_STAFF, SESSION_COOKIE_STAFF, criarTokenStaff, lerToken2faStaff } from "@/lib/auth";
import { conferirCodigo2fa } from "@/lib/doisFatores";

export type Estado2fa = { erro?: string };

// Segunda etapa do login da equipe: só chega aqui quem passou na senha (cookie curto assinado).
export async function verificarLogin2fa(_anterior: Estado2fa, formData: FormData): Promise<Estado2fa> {
  const cookieStore = await cookies();
  const usuarioId = lerToken2faStaff(cookieStore.get(COOKIE_2FA_STAFF)?.value);
  if (!usuarioId) redirect("/admin/login");

  const resultado = await conferirCodigo2fa(usuarioId, String(formData.get("codigo") ?? ""));
  if (!resultado.ok) return { erro: resultado.erro };

  const usuario = await prisma.usuario.findUnique({ where: { id: usuarioId } });
  if (!usuario) redirect("/admin/login");

  cookieStore.delete(COOKIE_2FA_STAFF);
  cookieStore.set(
    SESSION_COOKIE_STAFF,
    criarTokenStaff({ id: usuario.id, username: usuario.username, role: usuario.role, mfa: true }),
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
