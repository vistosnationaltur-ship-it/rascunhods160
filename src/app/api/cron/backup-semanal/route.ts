import { NextResponse } from "next/server";
import { Resend } from "resend";
import { gerarBackupCriptografado } from "@/lib/backup-automatico";

// Disparado semanalmente pelo Cron Jobs da Vercel (ver vercel.json). A
// Vercel manda "Authorization: Bearer <CRON_SECRET>" sozinha quando essa
// env var existe no projeto — checar aqui impede que qualquer um na
// internet acione o backup (e gaste a cota do Resend) só de saber a URL.

// Falha do backup => e-mail de aviso pro mesmo destino (antes só aparecia no log da Vercel e ninguém via).
// Cobre o caso mais provável de falha real: o anexo ficar grande demais pro envio — o aviso é pequeno e sai.
// Se a falha for o próprio Resend fora do ar, o aviso também não sai (aí só o log da Vercel mostra).
// Nunca lança: avisar é um extra e não pode esconder o erro original.
async function avisarFalha(apiKey: string, from: string, destino: string, motivo: string): Promise<void> {
  const seguro = motivo.replace(/[a-z]+:\/\/\S+/gi, "[endereço omitido]").slice(0, 300);
  try {
    await new Resend(apiKey).emails.send({
      from,
      to: [destino],
      subject: `⚠ Backup semanal do DS160 FALHOU — ${new Date().toISOString().slice(0, 10)}`,
      text:
        `O backup semanal automático do Rascunho DS-160 não saiu.\n\nMotivo: ${seguro}\n\n` +
        `O que fazer: veja o log do cron /api/cron/backup-semanal na Vercel (projeto do DS-160). ` +
        `Enquanto isso, rode o backup à mão (npm run backup:drive, ou o atalho "Backup do Flow" no PC do Drive). ` +
        `Guia: RESTAURAR.md.`,
    });
  } catch {
    // sem alternativa: o erro original já vai na resposta e no log
  }
}

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
      await avisarFalha(apiKey, from, destino, `Erro ao enviar o e-mail do backup: ${error.message}`);
      return NextResponse.json({ ok: false, erro: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true, totais });
  } catch (erro) {
    const motivo = erro instanceof Error ? erro.message : "Falha desconhecida";
    await avisarFalha(apiKey, from, destino, `Erro ao gerar o backup: ${motivo}`);
    return NextResponse.json({ ok: false, erro: motivo }, { status: 500 });
  }
}
