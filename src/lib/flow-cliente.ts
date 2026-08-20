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
