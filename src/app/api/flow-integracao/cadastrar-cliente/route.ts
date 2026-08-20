import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apenasDigitos, hashSenha } from "@/lib/senha";
import { enviarLinkAcessoWhatsapp } from "@/lib/whatsapp";

// Endpoint isolado, chamado pelo Flow Visto Americano (botão "Gerar
// acesso Rascunho DS160" na ficha do cliente) — cadastra o cliente
// aqui e já dispara o WhatsApp, tudo num clique só do lado do Flow.
// Mesmo segredo compartilhado usado na direção contrária (DS160 →
// Flow, rota /api/ds160-rascunho/clientes de lá).
export async function POST(request: NextRequest) {
  const secret = process.env.FLOW_API_SECRET;
  if (!secret) {
    return NextResponse.json({ erro: "FLOW_API_SECRET não configurada." }, { status: 500 });
  }
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ erro: "Não autorizado." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ erro: "Corpo da requisição não é JSON válido." }, { status: 400 });
  }

  const { nome, cpf: cpfBruto, email, telefone, flowClienteId } = body as {
    nome?: string;
    cpf?: string;
    email?: string;
    telefone?: string;
    flowClienteId?: string;
  };
  const cpf = apenasDigitos(cpfBruto ?? "");

  if (!nome || !email || !telefone || !cpf) {
    return NextResponse.json(
      { erro: "nome, email, telefone e cpf são obrigatórios (o CPF é a senha de login)." },
      { status: 400 },
    );
  }

  const existente = await prisma.clienteDs160.findUnique({ where: { email } });
  if (existente) {
    return NextResponse.json(
      { erro: `Já existe um cliente cadastrado com o e-mail "${email}".`, id: existente.id },
      { status: 409 },
    );
  }

  const cliente = await prisma.clienteDs160.create({
    data: {
      nome,
      cpf,
      email,
      telefone,
      flowClienteId: flowClienteId || null,
      senhaHash: hashSenha(cpf),
    },
  });

  const envio = await enviarLinkAcessoWhatsapp({ telefone, login: nome });

  return NextResponse.json(
    { ok: true, id: cliente.id, whatsappEnviado: envio.ok, whatsappErro: envio.erro },
    { status: 201 },
  );
}
