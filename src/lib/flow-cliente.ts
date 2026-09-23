export type ClienteFlow = {
  id: string;
  nome: string;
  cpf: string | null;
  email: string | null;
  telefone: string | null;
};

// Busca clientes no Flow Visto Americano (rota isolada e só-leitura de
// lá, ver src/app/api/ds160-rascunho/clientes/route.ts no repo do Flow).
// Se as env vars não estiverem configuradas ou o Flow estiver fora do ar,
// retorna [] em vez de quebrar a tela — o admin sempre pode digitar os
// dados manualmente como alternativa.
export async function buscarClientesFlow(q: string): Promise<ClienteFlow[]> {
  const baseUrl = process.env.FLOW_API_URL;
  const secret = process.env.FLOW_API_SECRET;
  if (!baseUrl || !secret || q.trim().length < 2) return [];

  try {
    const url = new URL("/api/ds160-rascunho/clientes", baseUrl);
    url.searchParams.set("q", q.trim());
    const resposta = await fetch(url, {
      headers: { Authorization: `Bearer ${secret}` },
      cache: "no-store",
    });
    if (!resposta.ok) return [];
    const dados = (await resposta.json()) as { clientes: ClienteFlow[] };
    return dados.clientes ?? [];
  } catch {
    return [];
  }
}

// Acha no Flow o cliente com esse CPF (comparação só por dígitos, no Flow). Usado pra vincular
// sozinho quem é cadastrado direto aqui, sem passar pela busca. null = não achou ou Flow fora do ar.
export async function buscarClienteFlowPorCpf(cpf: string): Promise<ClienteFlow | null> {
  const baseUrl = process.env.FLOW_API_URL;
  const secret = process.env.FLOW_API_SECRET;
  const digitos = cpf.replace(/\D/g, "");
  if (!baseUrl || !secret || digitos.length !== 11) return null;

  try {
    const url = new URL("/api/ds160-rascunho/cliente-por-cpf", baseUrl);
    url.searchParams.set("cpf", digitos);
    const resposta = await fetch(url, {
      headers: { Authorization: `Bearer ${secret}` },
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
    if (!resposta.ok) return null;
    const dados = (await resposta.json()) as { cliente: ClienteFlow | null };
    return dados.cliente ?? null;
  } catch {
    return null;
  }
}

// Avisa o Flow que o rascunho foi concluído. Com flowClienteId, é direto; sem ele (cadastro
// manual aqui) o Flow acha a pessoa pelo CPF e, se ela não existir lá, cria com estes dados.
// Devolve o id do cliente no Flow (pra gravar o vínculo) ou null se não deu.
export async function avisarFlowConclusao(cliente: {
  flowClienteId: string | null;
  cpf: string | null;
  nome: string;
  email: string;
  telefone: string | null;
}): Promise<string | null> {
  const baseUrl = process.env.FLOW_API_URL;
  const secret = process.env.FLOW_API_SECRET;
  if (!baseUrl || !secret) return null;
  if (!cliente.flowClienteId && !cliente.cpf) return null;

  const resposta = await fetch(`${baseUrl}/api/ds160-rascunho/marcar-concluido`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${secret}` },
    body: JSON.stringify(
      cliente.flowClienteId
        ? { clienteId: cliente.flowClienteId }
        : { cpf: cliente.cpf, nome: cliente.nome, email: cliente.email, telefone: cliente.telefone },
    ),
    signal: AbortSignal.timeout(10000),
  });
  if (!resposta.ok) {
    throw new Error(`Flow respondeu ${resposta.status}`);
  }
  const dados = (await resposta.json()) as { clienteId?: string };
  return dados.clienteId ?? cliente.flowClienteId;
}
