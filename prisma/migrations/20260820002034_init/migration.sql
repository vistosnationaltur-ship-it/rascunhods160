-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'USUARIO');

-- CreateEnum
CREATE TYPE "StatusRascunho" AS ENUM ('EM_PREENCHIMENTO', 'CONCLUIDO');

-- CreateTable
CREATE TABLE "Usuario" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "senhaHash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'USUARIO',
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClienteDs160" (
    "id" TEXT NOT NULL,
    "flowClienteId" TEXT,
    "nome" TEXT NOT NULL,
    "cpf" TEXT,
    "email" TEXT,
    "telefone" TEXT,
    "username" TEXT NOT NULL,
    "senhaHash" TEXT NOT NULL,
    "status" "StatusRascunho" NOT NULL DEFAULT 'EM_PREENCHIMENTO',
    "respostas" JSONB NOT NULL DEFAULT '{}',
    "paginaAtual" INTEGER NOT NULL DEFAULT 0,
    "pdfGeradoEm" TIMESTAMP(3),
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClienteDs160_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_username_key" ON "Usuario"("username");

-- CreateIndex
CREATE UNIQUE INDEX "ClienteDs160_cpf_key" ON "ClienteDs160"("cpf");

-- CreateIndex
CREATE UNIQUE INDEX "ClienteDs160_username_key" ON "ClienteDs160"("username");

-- CreateIndex
CREATE INDEX "ClienteDs160_flowClienteId_idx" ON "ClienteDs160"("flowClienteId");
