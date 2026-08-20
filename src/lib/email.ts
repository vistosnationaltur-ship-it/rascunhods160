import { Resend } from "resend";

// Mesmo espírito do src/lib/whatsapp.ts: se a env var não estiver
// configurada, devolve erro claro em vez de quebrar o fluxo de
// conclusão do rascunho — o cliente já pode ver "concluído" mesmo que o
// e-mail ainda não esteja pronto (RESEND_API_KEY vem depois, quando o
// domínio de envio for verificado no Resend).
export async function enviarPdfRascunho(params: {
  nomeCliente: string;
  destinatarios: string[];
  pdf: Buffer;
}): Promise<{ ok: boolean; erro?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM;
  if (!apiKey || !from) {
    return { ok: false, erro: "RESEND_API_KEY ou RESEND_FROM não configuradas." };
  }
  if (params.destinatarios.length === 0) {
    return { ok: false, erro: "Nenhum destinatário informado." };
  }

  try {
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from,
      to: params.destinatarios,
      subject: `Rascunho DS-160 concluído — ${params.nomeCliente}`,
      text: `Segue em anexo o rascunho do DS-160 preenchido por ${params.nomeCliente}.\n\nO PDF está protegido por senha.`,
      attachments: [{ filename: "rascunho-ds160.pdf", content: params.pdf }],
    });
    if (error) return { ok: false, erro: error.message };
    return { ok: true };
  } catch (erro) {
    return { ok: false, erro: erro instanceof Error ? erro.message : "Falha desconhecida" };
  }
}
