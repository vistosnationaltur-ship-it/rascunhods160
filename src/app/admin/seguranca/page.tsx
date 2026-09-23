import Link from "next/link";
import { redirect } from "next/navigation";
import QRCode from "qrcode";
import { prisma } from "@/lib/prisma";
import { sessaoStaffAtual } from "@/lib/auth";
import { cifrarSegredoTotp, decifrarSegredoTotp, gerarSecretBase32, otpauthUri } from "@/lib/totp";
import { FormCodigo2fa } from "@/components/FormCodigo2fa";
import { ativar2fa, reiniciar2fa } from "./actions";

const CARD = "flex flex-col gap-4 rounded-xl border border-white/10 bg-zinc-900/40 p-6";

export default async function SegurancaPage() {
  const sessao = await sessaoStaffAtual();
  if (!sessao) redirect("/admin/login");

  let usuario = await prisma.usuario.findUnique({ where: { id: sessao.id } });
  if (!usuario) redirect("/admin/login");

  const ativoEm = usuario.totpSecret ? usuario.totpAtivadoEm : null;

  // Ainda sem 2FA: garante um segredo pendente (fica cifrado) e mostra o QR pra escanear.
  let segredo = "";
  let qr = "";
  if (!ativoEm) {
    if (!usuario.totpSecret) {
      usuario = await prisma.usuario.update({
        where: { id: usuario.id },
        data: { totpSecret: cifrarSegredoTotp(gerarSecretBase32()), totpUltimoPasso: null },
      });
    }
    segredo = decifrarSegredoTotp(usuario.totpSecret!);
    qr = await QRCode.toDataURL(otpauthUri(segredo, usuario.username, "Rascunho DS160 — 2N"), {
      width: 224,
      margin: 1,
    });
  }

  return (
    <div className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-6 p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-zinc-100">Segurança da conta</h1>
        {ativoEm && (
          <Link href="/admin" className="text-sm text-indigo-400 underline-offset-4 hover:underline">
            Voltar
          </Link>
        )}
      </div>

      {!ativoEm ? (
        <section className={CARD}>
          <p className="text-sm text-zinc-300">
            Para continuar, ative a <strong>verificação em duas etapas</strong>. Além da senha, o login
            passa a pedir um código de 6 dígitos que muda a cada 30 segundos.
          </p>
          <ol className="list-decimal pl-5 text-sm text-zinc-400">
            <li>Instale um app autenticador (Google Authenticator, Microsoft Authenticator ou Authy).</li>
            <li>Escaneie o QR code abaixo (ou digite a chave manualmente).</li>
            <li>Digite aqui o código de 6 dígitos que o app mostrar.</li>
          </ol>
          <div className="flex flex-col items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qr} alt="QR code do autenticador" width={224} height={224} className="rounded-lg bg-white p-2" />
            <p className="text-xs text-zinc-500">Chave manual:</p>
            <code className="break-all rounded bg-white/5 px-2 py-1 font-mono text-xs text-zinc-200">{segredo}</code>
          </div>
          <FormCodigo2fa action={ativar2fa} rotuloBotao="Ativar verificação em duas etapas" />
        </section>
      ) : (
        <section className={CARD}>
          <p className="text-sm text-emerald-400">
            ✓ Verificação em duas etapas ativa desde{" "}
            {ativoEm.toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" })}.
          </p>
          <div className="flex flex-col gap-2">
            <h2 className="text-sm font-semibold text-zinc-400">Trocar de celular</h2>
            <p className="text-xs text-zinc-500">Digite o código atual do app para gerar uma nova configuração.</p>
            <FormCodigo2fa action={reiniciar2fa} rotuloBotao="Reconfigurar" />
          </div>
        </section>
      )}
    </div>
  );
}
