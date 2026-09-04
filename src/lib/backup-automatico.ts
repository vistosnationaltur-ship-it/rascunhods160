import { createCipheriv, randomBytes, scryptSync } from "crypto";
import { prisma } from "@/lib/prisma";

// Backup semanal automático (cron da Vercel, ver src/app/api/cron/backup-semanal/route.ts).
// Mesmo conteúdo do scripts/backup.ts manual (usuarios + formularioSchema
// + clientes, com CPF/passaporte/respostas em texto puro), mas
// criptografado antes de sair da memória do servidor — o e-mail em
// trânsito e a caixa de entrada de quem recebe não guardam dado sensível
// em texto puro.
//
// Formato do arquivo .enc gerado: salt(16) + iv(12) + authTag(16) + dados
// cifrados, tudo concatenado em binário. Decifra com
// scripts/descriptografar-backup.ts.
export async function gerarBackupCriptografado(): Promise<{ nomeArquivo: string; conteudo: Buffer; totais: string }> {
  const chave = process.env.BACKUP_ENCRYPTION_KEY;
  if (!chave) throw new Error("BACKUP_ENCRYPTION_KEY não configurada.");

  const [usuarios, formularioSchema, clientes] = await Promise.all([
    prisma.usuario.findMany(),
    prisma.formularioSchema.findMany(),
    prisma.clienteDs160.findMany(),
  ]);

  const geradoEm = new Date().toISOString();
  const json = JSON.stringify({ geradoEm, usuarios, formularioSchema, clientes });

  const salt = randomBytes(16);
  const chaveDerivada = scryptSync(chave, salt, 32);
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", chaveDerivada, iv);
  const cifrado = Buffer.concat([cipher.update(json, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();

  const conteudo = Buffer.concat([salt, iv, authTag, cifrado]);
  const nomeArquivo = `backup-${geradoEm.replace(/[:.]/g, "-")}.enc`;
  const totais = `usuarios: ${usuarios.length}, formularioSchema: ${formularioSchema.length}, clientes: ${clientes.length}`;

  return { nomeArquivo, conteudo, totais };
}
