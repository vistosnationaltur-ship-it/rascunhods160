import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  SESSION_COOKIE_CLIENTE,
  SESSION_COOKIE_STAFF,
  lerTokenCliente,
  lerTokenStaff,
} from "@/lib/auth";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/admin") && !pathname.startsWith("/admin/login")) {
    const token = request.cookies.get(SESSION_COOKIE_STAFF)?.value;
    const sessao = lerTokenStaff(token);
    if (sessao) {
      // Verificação em duas etapas obrigatória: sessão sem ela (senha certa, 2FA ainda não
      // configurado, ou cookie antigo de antes do 2FA) só enxerga a tela de configuração.
      if (!sessao.mfa && !pathname.startsWith("/admin/seguranca")) {
        return NextResponse.redirect(new URL("/admin/seguranca", request.url));
      }
      return NextResponse.next();
    }
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  if (pathname.startsWith("/preencher")) {
    const token = request.cookies.get(SESSION_COOKIE_CLIENTE)?.value;
    if (lerTokenCliente(token)) return NextResponse.next();
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin", "/admin/:path*", "/preencher", "/preencher/:path*"],
};
