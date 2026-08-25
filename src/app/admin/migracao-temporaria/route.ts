import { NextResponse } from "next/server";
import { exigirAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// ROTA TEMPORÁRIA — aplica a migração "adiciona_concluido_em" direto em
// produção, porque a DATABASE_URL de lá está marcada "Sensitive" no
// Vercel e não dá pra puxar pra rodar `prisma migrate deploy` de fora.
// Idempotente (IF NOT EXISTS + ON CONFLICT), então pode ser chamada mais
// de uma vez sem problema. REMOVER esse arquivo depois de confirmar que
// rodou (visitar a URL uma vez logado como admin já resolve).
export async function GET() {
  await exigirAdmin();

  await prisma.$executeRawUnsafe(
    `ALTER TABLE "ClienteDs160" ADD COLUMN IF NOT EXISTS "concluidoEm" TIMESTAMP(3);`,
  );

  // Marca a migração como aplicada na tabela de controle do Prisma, pra
  // um "prisma migrate deploy" futuro (rodado com acesso de verdade ao
  // banco) não tentar aplicar de novo e falhar com "coluna já existe".
  await prisma.$executeRawUnsafe(
    `INSERT INTO "_prisma_migrations"
       (id, checksum, migration_name, started_at, finished_at, applied_steps_count)
     SELECT gen_random_uuid()::text,
        '3065cd9fddf0bffc1d1811d336fbc2f0de2916a7f245a1c31e03b3aeee49b181',
        '20260825190000_adiciona_concluido_em',
        now(), now(), 1
     WHERE NOT EXISTS (
       SELECT 1 FROM "_prisma_migrations" WHERE migration_name = '20260825190000_adiciona_concluido_em'
     );`,
  );

  return NextResponse.json({ ok: true, mensagem: "Coluna concluidoEm garantida e migração marcada como aplicada." });
}
