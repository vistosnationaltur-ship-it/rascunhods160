-- Verificação em duas etapas da equipe, exclusão agendada do rascunho e registro de consentimento (LGPD).
-- Tudo opcional/com padrão: dados existentes não mudam.

-- AlterTable
ALTER TABLE "Usuario" ADD COLUMN "totpSecret" TEXT,
ADD COLUMN "totpAtivadoEm" TIMESTAMP(3),
ADD COLUMN "totpUltimoPasso" INTEGER,
ADD COLUMN "totpTentativas" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "totpBloqueadoAte" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "ClienteDs160" ADD COLUMN "excluirApos" TIMESTAMP(3),
ADD COLUMN "consentimentoEm" TIMESTAMP(3),
ADD COLUMN "consentimentoVersao" TEXT;
