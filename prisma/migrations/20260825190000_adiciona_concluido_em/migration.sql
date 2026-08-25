-- Guarda quando o cliente marcou o rascunho como concluído, pra
-- aparecer na ficha dele no admin (antes só existia o status).
ALTER TABLE "ClienteDs160" ADD COLUMN "concluidoEm" TIMESTAMP(3);
