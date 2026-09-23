import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import type { Role } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

// Dois logins independentes nesta mesma app: staff (administra o módulo,
// cadastra clientes) e cliente (preenche o próprio rascunho). Cookies e
// sessões separados de propósito — um cliente nunca deve conseguir
// acessar rotas de staff nem vice-versa.

const DURACAO_SESSAO_MS = 30 * 24 * 60 * 60 * 1000; // 30 dias

function assinar(payload: string): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET não configurada.");
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

function criarToken(dados: Record<string, unknown>, duracaoMs = DURACAO_SESSAO_MS): string {
  const payload = JSON.stringify({ ...dados, exp: Date.now() + duracaoMs });
  const payloadBase64 = Buffer.from(payload).toString("base64url");
  const assinatura = assinar(payloadBase64);
  return `${payloadBase64}.${assinatura}`;
}

function lerToken(token: string | undefined): Record<string, unknown> | null {
  if (!token) return null;
  const [payloadBase64, assinatura] = token.split(".");
  if (!payloadBase64 || !assinatura) return null;

  let assinaturaEsperada: string;
  try {
    assinaturaEsperada = assinar(payloadBase64);
  } catch {
    return null;
  }

  const a = Buffer.from(assinatura);
  const b = Buffer.from(assinaturaEsperada);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  try {
    const payload = JSON.parse(Buffer.from(payloadBase64, "base64url").toString());
    if (typeof payload.exp !== "number" || payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

// ---------- Sessão de staff ----------

export const SESSION_COOKIE_STAFF = "ds160_staff_session";

export type SessaoStaff = {
  id: string;
  username: string;
  role: Role;
  // true quando o login passou pela verificação em duas etapas. Sessão sem isso só alcança a
  // tela de configuração do 2FA (ver src/proxy.ts).
  mfa?: boolean;
};

// Cookie curto (5 min) entre "senha certa" e "código do app certo".
export const COOKIE_2FA_STAFF = "ds160_staff_2fa";

/** Token de "senha conferida, falta o código do app": só serve pra tela do código. */
export function criarToken2faStaff(usuarioId: string): string {
  return criarToken({ tipo: "2fa", id: usuarioId }, 5 * 60 * 1000);
}

export function lerToken2faStaff(token: string | undefined): string | null {
  const payload = lerToken(token);
  return payload && payload.tipo === "2fa" && typeof payload.id === "string" ? payload.id : null;
}

export function criarTokenStaff(sessao: SessaoStaff): string {
  return criarToken(sessao);
}

export function lerTokenStaff(token: string | undefined): SessaoStaff | null {
  const payload = lerToken(token);
  if (!payload) return null;
  return {
    id: payload.id as string,
    username: payload.username as string,
    role: payload.role as Role,
    mfa: payload.mfa === true,
  };
}

export async function sessaoStaffAtual(): Promise<SessaoStaff | null> {
  const cookieStore = await cookies();
  return lerTokenStaff(cookieStore.get(SESSION_COOKIE_STAFF)?.value);
}

// Reconsulta o papel no banco em vez de confiar só no cookie: uma
// promoção/rebaixamento ou exclusão de usuário precisa valer na hora,
// não só depois que a sessão (assinada, sem estado) expirar sozinha.
// Mesmo padrão do projeto Flow Visto Americano (src/lib/auth.ts de lá).
export async function exigirAdmin(): Promise<SessaoStaff> {
  const sessao = await sessaoStaffAtual();
  if (!sessao) throw new Error("Não autenticado.");
  if (!sessao.mfa) throw new Error("Ative a verificação em duas etapas para continuar.");

  const usuario = await prisma.usuario.findUnique({ where: { id: sessao.id } });
  if (!usuario || usuario.role !== "ADMIN") {
    throw new Error("Apenas administradores podem fazer isso.");
  }
  return sessao;
}

// ---------- Sessão de cliente ----------

export const SESSION_COOKIE_CLIENTE = "ds160_cliente_session";

export type SessaoCliente = {
  id: string;
  email: string;
};

export function criarTokenCliente(sessao: SessaoCliente): string {
  return criarToken(sessao);
}

export function lerTokenCliente(token: string | undefined): SessaoCliente | null {
  const payload = lerToken(token);
  if (!payload) return null;
  return { id: payload.id as string, email: payload.email as string };
}

export async function sessaoClienteAtual(): Promise<SessaoCliente | null> {
  const cookieStore = await cookies();
  return lerTokenCliente(cookieStore.get(SESSION_COOKIE_CLIENTE)?.value);
}

export async function exigirCliente(): Promise<SessaoCliente> {
  const sessao = await sessaoClienteAtual();
  if (!sessao) throw new Error("Não autenticado.");
  return sessao;
}
