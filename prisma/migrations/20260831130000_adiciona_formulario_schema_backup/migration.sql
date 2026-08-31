-- Snapshots do schema do formulário (FormularioSchema.paginas) tirados
-- antes de cada alteração feita pelo builder no admin, pra permitir
-- restaurar o formulário inteiro se um save quebrar algo.
CREATE TABLE "FormularioSchemaBackup" (
    "id" TEXT NOT NULL,
    "paginas" JSONB NOT NULL,
    "motivo" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FormularioSchemaBackup_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FormularioSchemaBackup_criadoEm_idx" ON "FormularioSchemaBackup"("criadoEm");
