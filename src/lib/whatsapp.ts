// Dispara o link de acesso via WhatsApp reaproveitando o workflow n8n que
// já existe e já está aprovado ("envio_acesso_ds160", template Meta) —
// não fala direto com a API da Meta, só chama o webhook do n8n com o
// mesmo formato de campos que o fluxo original espera:
// { whatsapp_ds160, login, senha_cpf }.
export async function enviarLinkAcessoWhatsapp(params: {
  telefone: string;
  login: string;
  senha: string;
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
        senha_cpf: params.senha,
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
