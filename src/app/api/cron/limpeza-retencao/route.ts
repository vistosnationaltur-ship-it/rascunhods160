import { NextResponse } from "next/server";
import { Resend } from "resend";
import { limparClientesAntigos } from "@/lib/limpeza-retencao";

// Roda 1x/mês (ver vercel.json) apagando rascunhos CONCLUIDO há mais de 6
// meses — política de retenção decidida com o usuário em 2026-09-04 (LGPD:
// não guardar dado sensível além do necessário). O backup semanal
// criptografado (outro cron) continua guardando uma cópia por um tempo
// mesmo depois do apagão daqui, então não é uma perda irreversível
// imediata se alguém precisar recuperar logo depois.
export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  if (!cronSecret || auth !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ ok: false, erro: "Não autorizado." }, { status: 401 });
  }

  try {
    const excluidos = await limparClientesAntigos();

    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.RESEND_FROM;
    const destino = process.env.TEAM_EMAIL_DS160;
    if (apiKey && from && destino) {
      const resend = new Resend(apiKey);
      const lista =
        excluidos.length === 0
          ? "Nenhum rascunho passou de 6 meses concluído desta vez."
          : excluidos
              .map((c) => `- ${c.nome} (${c.email}) — concluído em ${c.concluidoEm.toISOString().slice(0, 10)}`)
              .join("\n");
      await resend.emails.send({
        from,
        to: [destino],
        subject: `Limpeza de retenção DS-160 — ${excluidos.length} removido(s)`,
        text:
          `Rascunhos concluídos há mais de 6 meses foram apagados do banco (política de retenção).\n\n${lista}`,
      });
    }

    return NextResponse.json({ ok: true, removidos: excluidos.length });
  } catch (erro) {
    return NextResponse.json(
      { ok: false, erro: erro instanceof Error ? erro.message : "Falha desconhecida" },
      { status: 500 },
    );
  }
}
