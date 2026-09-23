import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { COOKIE_2FA_STAFF, lerToken2faStaff } from "@/lib/auth";
import { FormCodigo2fa } from "@/components/FormCodigo2fa";
import { verificarLogin2fa } from "./actions";

export default async function LoginStaff2faPage() {
  const cookieStore = await cookies();
  if (!lerToken2faStaff(cookieStore.get(COOKIE_2FA_STAFF)?.value)) redirect("/admin/login");

  return (
    <div className="flex flex-1 items-center justify-center">
      <div className="flex w-full max-w-sm flex-col gap-5 rounded-2xl border border-white/10 bg-zinc-900/60 p-8 shadow-2xl shadow-black/40">
        <div className="flex flex-col items-center gap-2 text-center">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-indigo-500" />
          <h1 className="text-lg font-semibold text-zinc-100">Verificação em duas etapas</h1>
          <p className="text-sm text-zinc-500">Digite o código de 6 dígitos do seu aplicativo autenticador.</p>
        </div>
        <FormCodigo2fa action={verificarLogin2fa} rotuloBotao="Entrar" />
        <a href="/admin/login" className="text-center text-xs text-zinc-500 underline-offset-4 hover:underline">
          Voltar ao login
        </a>
      </div>
    </div>
  );
}
