-- CreateTable
CREATE TABLE "TentativaLogin" (
    "id" TEXT NOT NULL,
    "identificador" TEXT NOT NULL,
    "contexto" TEXT NOT NULL,
    "tentativas" INTEGER NOT NULL DEFAULT 0,
    "bloqueadoAte" TIMESTAMP(3),
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TentativaLogin_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TentativaLogin_identificador_contexto_key" ON "TentativaLogin"("identificador", "contexto");
