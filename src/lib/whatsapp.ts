// Dispara o link de acesso via WhatsApp reaproveitando o workflow n8n
// ("envio_acesso_ds160", template Meta) — não fala direto com a API da
// Meta, só chama o webhook do n8n com { whatsapp_ds160, login }. Não manda
// senha: a senha de login é sempre o CPF, que o cliente já sabe de cor, e
// o template Meta não aceita dado sensível como parâmetro (bloqueado pela
// política deles) — por isso só 1 variável no corpo da mensagem.
export async function enviarLinkAcessoWhatsapp(params: {
  telefone: string;
  login: string;
}): Promise<{ ok: boolean; erro?: string }> {
  const webhookUrl = process.env.N8N_WEBHOOK_URL_ENVIO_ACESSO;
  if (!webhookUrl) {
    return { ok: false, erro: "N8N_WEBHOOK_URL_ENVIO_ACESSO não configurada." };
  }

  try {
    const resposta = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        whatsapp_ds160: params.telefone,
        login: params.login,
      }),
    });
    if (!resposta.ok) {
      return { ok: false, erro: `n8n respondeu ${resposta.status}` };
    }
    return { ok: true };
  } catch (erro) {
    return { ok: false, erro: erro instanceof Error ? erro.message : "Falha desconhecida" };
  }
}
