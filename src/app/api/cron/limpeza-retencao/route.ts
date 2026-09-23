import { NextResponse } from "next/server";
import { Resend } from "resend";
import { limparClientesAntigos } from "@/lib/limpeza-retencao";

// Roda todo dia (ver vercel.json) apagando rascunhos com exclusão agendada vencida (30 dias
// depois de "Passaporte devolvido" no Flow) e, como rede de segurança, os CONCLUIDO há mais de
// 6 meses — política de retenção (LGPD: não guardar dado sensível além do necessário). O backup semanal
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
          ? "Nenhum rascunho venceu a retenção desta vez."
          : excluidos
              .map(
                (c) =>
                  `- ${c.nome} (${c.email}) — ${c.motivo === "passaporte-devolvido" ? "30 dias após passaporte devolvido" : "concluído há mais de 6 meses"}`,
              )
              .join("\n");
      await resend.emails.send({
        from,
        to: [destino],
        subject: `Limpeza de retenção DS-160 — ${excluidos.length} removido(s)`,
        text:
          `Rascunhos que venceram a política de retenção foram apagados do banco.\n\n${lista}`,
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
