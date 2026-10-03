-- Controle de acesso do cliente ao rascunho. Colunas opcionais/com padrão: quem já tinha rascunho
-- aparece como "nunca abriu" até o próximo acesso (não há como reconstruir o passado).

-- AlterTable
ALTER TABLE "ClienteDs160" ADD COLUMN "primeiroAcessoEm" TIMESTAMP(3),
ADD COLUMN "ultimoAcessoEm" TIMESTAMP(3),
ADD COLUMN "totalAcessos" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "ultimoSalvamentoEm" TIMESTAMP(3);
