"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { SESSION_COOKIE_STAFF, criarTokenStaff } from "@/lib/auth";
import { senhaConfere } from "@/lib/senha";

export async function loginStaff(formData: FormData) {
  const username = (formData.get("username") ?? "").toString().trim();
  const senha = (formData.get("senha") ?? "").toString();

  const usuario = await prisma.usuario.findUnique({ where: { username } });
  if (!usuario || !senhaConfere(senha, usuario.senhaHash)) {
    throw new Error("Usuário ou senha incorretos.");
  }

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
