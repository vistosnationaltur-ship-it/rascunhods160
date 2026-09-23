"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { Role } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { SESSION_COOKIE_STAFF, criarTokenStaff, sessaoStaffAtual } from "@/lib/auth";
import { conferirCodigo2fa } from "@/lib/doisFatores";

export type EstadoSeguranca = { erro?: string };

async function gravarSessao(usuario: { id: string; username: string; role: Role }, mfa: boolean) {
  const cookieStore = await cookies();
  cookieStore.set(
    SESSION_COOKIE_STAFF,
    criarTokenStaff({ id: usuario.id, username: usuario.username, role: usuario.role, mfa }),
    {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    },
  );
}

// Confirma a configuração: o usuário digita um código gerado pelo app com o segredo mostrado na tela.
export async function ativar2fa(_anterior: EstadoSeguranca, formData: FormData): Promise<EstadoSeguranca> {
  const sessao = await sessaoStaffAtual();
  if (!sessao) redirect("/admin/login");

  const resultado = await conferirCodigo2fa(sessao.id, String(formData.get("codigo") ?? ""));
  if (!resultado.ok) return { erro: resultado.erro };

  const usuario = await prisma.usuario.update({
    where: { id: sessao.id },
    data: { totpAtivadoEm: new Date() },
  });
  await gravarSessao(usuario, true);
  redirect("/admin");
}

// Trocar de celular: exige um código válido do aparelho atual, apaga o segredo e volta pra tela
// de configuração (sessão sem 2FA até confirmar o novo).
export async function reiniciar2fa(_anterior: EstadoSeguranca, formData: FormData): Promise<EstadoSeguranca> {
  const sessao = await sessaoStaffAtual();
  if (!sessao) redirect("/admin/login");

  const resultado = await conferirCodigo2fa(sessao.id, String(formData.get("codigo") ?? ""));
  if (!resultado.ok) return { erro: resultado.erro };

  const usuario = await prisma.usuario.update({
    where: { id: sessao.id },
    data: { totpSecret: null, totpAtivadoEm: null, totpUltimoPasso: null },
  });
  await gravarSessao(usuario, false);
  redirect("/admin/seguranca");
}
