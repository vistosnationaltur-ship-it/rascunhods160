import { NextResponse } from "next/server";
import { Resend } from "resend";
import { gerarBackupCriptografado } from "@/lib/backup-automatico";

// Disparado semanalmente pelo Cron Jobs da Vercel (ver vercel.json). A
// Vercel manda "Authorization: Bearer <CRON_SECRET>" sozinha quando essa
// env var existe no projeto — checar aqui impede que qualquer um na
// internet acione o backup (e gaste a cota do Resend) só de saber a URL.
export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  if (!cronSecret || auth !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ ok: false, erro: "Não autorizado." }, { status: 401 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM;
  const destino = process.env.TEAM_EMAIL_DS160;
  if (!apiKey || !from || !destino) {
    return NextResponse.json(
      { ok: false, erro: "RESEND_API_KEY, RESEND_FROM ou TEAM_EMAIL_DS160 não configuradas." },
      { status: 500 },
    );
  }

  try {
    const { nomeArquivo, conteudo, totais } = await gerarBackupCriptografado();

    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from,
      to: [destino],
      subject: `Backup semanal DS160 (criptografado) — ${new Date().toISOString().slice(0, 10)}`,
      text:
        `Backup automático em anexo, criptografado (AES-256-GCM).\n\n${totais}\n\n` +
        `Pra abrir: npx tsx scripts/descriptografar-backup.ts <arquivo.enc> ` +
        `(precisa da BACKUP_ENCRYPTION_KEY — está no .env de produção, não neste e-mail).`,
      attachments: [{ filename: nomeArquivo, content: conteudo }],
    });

    if (error) {
      return NextResponse.json({ ok: false, erro: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true, totais });
  } catch (erro) {
    return NextResponse.json(
      { ok: false, erro: erro instanceof Error ? erro.message : "Falha desconhecida" },
      { status: 500 },
    );
  }
}
