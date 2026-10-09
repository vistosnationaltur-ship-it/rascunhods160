import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "crypto";
import { prisma } from "@/lib/prisma";

// Backup semanal automático (cron da Vercel, ver src/app/api/cron/backup-semanal/route.ts) e backup
// pro Drive (scripts/backup-drive.ts). Mesmo conteúdo do scripts/backup.ts manual (usuarios +
// formularioSchema + clientes, com CPF/passaporte/respostas em texto puro), mas criptografado antes
// de sair da memória — o e-mail em trânsito e a caixa de entrada de quem recebe não guardam dado
// sensível em texto puro.
//
// Formato do arquivo .enc gerado: salt(16) + iv(12) + authTag(16) + dados
// cifrados, tudo concatenado em binário. Decifra com
// scripts/descriptografar-backup.ts.

// Fonte ÚNICA do que entra no backup (e-mail semanal e Drive leem daqui). Tabela nova no schema.prisma
// ⇒ incluir aqui E em scripts/restaurar-tudo.ts. (FormularioSchemaBackup e TentativaLogin ficam de fora
// de propósito: são snapshots e contadores temporários.)
export async function lerBancoDs160() {
  const [usuarios, formularioSchema, clientes] = await Promise.all([
    prisma.usuario.findMany(),
    prisma.formularioSchema.findMany(),
    prisma.clienteDs160.findMany(),
  ]);
  return { geradoEm: new Date().toISOString(), usuarios, formularioSchema, clientes };
}

export function resumoDoBackup(b: { usuarios: unknown[]; formularioSchema: unknown[]; clientes: unknown[] }): string {
  return `usuarios: ${b.usuarios.length}, formularioSchema: ${b.formularioSchema.length}, clientes: ${b.clientes.length}`;
}

export function cifrarBackup(json: string, senha: string): Buffer {
  const salt = randomBytes(16);
  const chaveDerivada = scryptSync(senha, salt, 32);
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", chaveDerivada, iv);
  const cifrado = Buffer.concat([cipher.update(json, "utf8"), cipher.final()]);
  return Buffer.concat([salt, iv, cipher.getAuthTag(), cifrado]);
}

// Inverso de cifrarBackup — usado pelo backup pro Drive pra conferir o arquivo logo depois de gravar.
export function decifrarBackup(bruto: Buffer, senha: string): string {
  const salt = bruto.subarray(0, 16);
  const iv = bruto.subarray(16, 28);
  const authTag = bruto.subarray(28, 44);
  const cifrado = bruto.subarray(44);
  const decipher = createDecipheriv("aes-256-gcm", scryptSync(senha, salt, 32), iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(cifrado), decipher.final()]).toString("utf8");
}

export async function gerarBackupCriptografado(): Promise<{ nomeArquivo: string; conteudo: Buffer; totais: string }> {
  const chave = process.env.BACKUP_ENCRYPTION_KEY;
  if (!chave) throw new Error("BACKUP_ENCRYPTION_KEY não configurada.");

  const backup = await lerBancoDs160();
  const conteudo = cifrarBackup(JSON.stringify(backup), chave);
  const nomeArquivo = `backup-${backup.geradoEm.replace(/[:.]/g, "-")}.enc`;

  return { nomeArquivo, conteudo, totais: resumoDoBackup(backup) };
}
