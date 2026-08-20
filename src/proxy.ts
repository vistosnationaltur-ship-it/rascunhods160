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

  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    const token = request.cookies.get(SESSION_COOKIE_STAFF)?.value;
    if (lerTokenStaff(token)) return NextResponse.next();
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
  matcher: ["/admin/:path*", "/preencher/:path*"],
};
