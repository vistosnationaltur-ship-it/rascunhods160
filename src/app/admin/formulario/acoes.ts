"use server";

import { exigirAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Pagina } from "@/lib/formulario-schema";
import { aplicarMudancaSchema } from "@/lib/formulario-persistencia";
import {
  adicionarCampo,
  adicionarPagina,
  criarCampo,
  moverCampo,
  moverPagina,
  proximoIdCampo,
  removerCampo,
  removerPagina,
  renomearPagina,
  type TipoCampo,
  TIPOS_CAMPO,
} from "@/lib/formulario-mutacoes";
import { registrarBackup } from "@/lib/formulario-backup";

export async function adicionarCampoAction(paginaIndice: number, tipo: string) {
  if (!TIPOS_CAMPO.includes(tipo as TipoCampo)) {
    throw new Error(`Tipo de campo inválido: ${tipo}.`);
  }
  await aplicarMudancaSchema(
    `adicionar campo (${tipo}) na página ${paginaIndice + 1}`,
    (paginas) => {
      const novo = criarCampo(proximoIdCampo(paginas), tipo as TipoCampo);
      return adicionarCampo(paginas, paginaIndice, novo);
    },
  );
}

export async function removerCampoAction(campoId: number) {
  await aplicarMudancaSchema(`excluir campo #${campoId}`, (paginas) =>
    removerCampo(paginas, campoId),
  );
}

export async function moverCampoAction(campoId: number, direcao: "cima" | "baixo") {
  await aplicarMudancaSchema(`mover campo #${campoId} para ${direcao}`, (paginas) =>
    moverCampo(paginas, campoId, direcao),
  );
}

// ---------- Páginas ----------

export async function adicionarPaginaAction(titulo: string) {
  await aplicarMudancaSchema("adicionar página", (paginas) => adicionarPagina(paginas, titulo));
}

export async function renomearPaginaAction(indice: number, titulo: string) {
  await aplicarMudancaSchema(`renomear página ${indice + 1}`, (paginas) =>
    renomearPagina(paginas, indice, titulo),
  );
}

export async function moverPaginaAction(indice: number, direcao: "cima" | "baixo") {
  await aplicarMudancaSchema(`mover página ${indice + 1} para ${direcao}`, (paginas) =>
    moverPagina(paginas, indice, direcao),
  );
}

export async function removerPaginaAction(indice: number) {
  await aplicarMudancaSchema(`excluir página ${indice + 1}`, (paginas) => {
    if (paginas.length <= 1) {
      throw new Error("O formulário precisa de pelo menos uma página.");
    }
    return removerPagina(paginas, indice);
  });

  // Clientes com rascunho em andamento podem ter ficado com paginaAtual
  // apontando pra um índice que não existe mais — traz de volta pro fim.
  const registro = await prisma.formularioSchema.findFirst();
  const total = (registro!.paginas as unknown as Pagina[]).length;
  await prisma.clienteDs160.updateMany({
    where: { paginaAtual: { gt: total - 1 } },
    data: { paginaAtual: total - 1 },
  });
}

// Restaura um snapshot inteiro. Antes de sobrescrever, guarda o estado
// atual como mais um backup (com motivo explícito) — dá pra desfazer a
// restauração.
export async function restaurarBackupAction(backupId: string) {
  await exigirAdmin();

  const backup = await prisma.formularioSchemaBackup.findUnique({ where: { id: backupId } });
  if (!backup) throw new Error("Backup não encontrado.");

  const registro = await prisma.formularioSchema.findFirst();
  if (!registro) throw new Error("FormularioSchema não encontrado.");

  const atuais = registro.paginas as unknown as Pagina[];
  await registrarBackup(
    atuais,
    `estado antes de restaurar o backup de ${backup.criadoEm.toISOString()}`,
  );

  await prisma.formularioSchema.update({
    where: { id: registro.id },
    data: { paginas: backup.paginas as unknown as object },
  });
}
