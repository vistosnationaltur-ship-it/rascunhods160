import { prisma } from "@/lib/prisma";

const JANELA_NOVA_VISITA_MS = 30 * 60 * 1000;

// Registra que o cliente abriu o rascunho. Chamado sempre que ele entra em /preencher (login ou
// cookie de 30 dias). Só conta como nova visita se passaram 30+ min do último acesso — recarregar a
// página não infla o contador. Falha aqui nunca pode atrapalhar o cliente.
export async function registrarAcessoCliente(clienteId: string): Promise<void> {
  try {
    const agora = new Date();
    const c = await prisma.clienteDs160.findUnique({
      where: { id: clienteId },
      select: { primeiroAcessoEm: true, ultimoAcessoEm: true },
    });
    if (!c) return;
    const novaVisita = !c.ultimoAcessoEm || agora.getTime() - c.ultimoAcessoEm.getTime() > JANELA_NOVA_VISITA_MS;
    await prisma.clienteDs160.update({
      where: { id: clienteId },
      data: {
        ultimoAcessoEm: agora,
        ...(c.primeiroAcessoEm ? {} : { primeiroAcessoEm: agora }),
        ...(novaVisita ? { totalAcessos: { increment: 1 } } : {}),
      },
    });
  } catch (e) {
    console.error("Falha ao registrar acesso do cliente:", e);
  }
}
