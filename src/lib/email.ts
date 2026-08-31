import { Resend } from "resend";

// Destinatários do PDF do rascunho: sempre o cliente que preencheu
// (e-mail de login) + cópia pra equipe (TEAM_EMAIL_DS160). O campo 54
// ("Receber uma cópia pelo e-mail") entra junto quando preenchido — é um
// segundo endereço opcional (ex: despachante), não substitui o cliente.
export function destinatariosRascunho(
  emailCliente: string | null | undefined,
  respostas: Record<string, string | string[] | undefined>,
): string[] {
  const dest = new Set<string>();

  if (emailCliente && emailCliente.trim()) dest.add(emailCliente.trim().toLowerCase());

  const emailEquipe = process.env.TEAM_EMAIL_DS160;
  if (emailEquipe) dest.add(emailEquipe.trim().toLowerCase());

  const copiaExtra = respostas["54"];
  if (typeof copiaExtra === "string" && copiaExtra.trim()) dest.add(copiaExtra.trim().toLowerCase());

  return [...dest];
}

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
      text: `Segue em anexo o rascunho do DS-160 preenchido por ${params.nomeCliente}.`,
      attachments: [{ filename: "rascunho-ds160.pdf", content: params.pdf }],
    });
    if (error) return { ok: false, erro: error.message };
    return { ok: true };
  } catch (erro) {
    return { ok: false, erro: erro instanceof Error ? erro.message : "Falha desconhecida" };
  }
}
