import { prisma } from "@/lib/prisma";
import type { Pagina } from "./formulario-schema";

// Quantos snapshots do schema guardar. Cada save do builder gera um; os
// mais antigos além disso são podados.
const MAX_BACKUPS = 30;

// Grava um snapshot do estado ATUAL do schema (o de antes da alteração)
// e poda os excedentes. Chamado por src/app/admin/formulario/acoes.ts
// antes de todo prisma.formularioSchema.update.
export async function registrarBackup(paginasAntes: Pagina[], motivo: string): Promise<void> {
  await prisma.formularioSchemaBackup.create({
    data: { paginas: paginasAntes as unknown as object, motivo },
  });

  const excedentes = await prisma.formularioSchemaBackup.findMany({
    orderBy: { criadoEm: "desc" },
    skip: MAX_BACKUPS,
    select: { id: true },
  });
  if (excedentes.length > 0) {
    await prisma.formularioSchemaBackup.deleteMany({
      where: { id: { in: excedentes.map((b) => b.id) } },
    });
  }
}

export type BackupResumo = {
  id: string;
  motivo: string;
  criadoEm: Date;
  totalPaginas: number;
  totalCampos: number;
};

export async function listarBackups(): Promise<BackupResumo[]> {
  const backups = await prisma.formularioSchemaBackup.findMany({
    orderBy: { criadoEm: "desc" },
  });
  return backups.map((b) => {
    const paginas = b.paginas as unknown as Pagina[];
    return {
      id: b.id,
      motivo: b.motivo,
      criadoEm: b.criadoEm,
      totalPaginas: paginas.length,
      totalCampos: paginas.reduce((n, p) => n + p.campos.length, 0),
    };
  });
}
