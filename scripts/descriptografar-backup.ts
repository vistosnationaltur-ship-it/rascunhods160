import { readFileSync, writeFileSync } from "node:fs";
import { createDecipheriv, scryptSync } from "node:crypto";

// Abre um .enc gerado pelo backup semanal automático (ver
// src/lib/backup-automatico.ts) e grava o JSON de volta em texto puro.
//
// Uso:
//   npx tsx scripts/descriptografar-backup.ts <arquivo.enc> [--chave "<BACKUP_ENCRYPTION_KEY>"]
// Sem --chave, usa a variável de ambiente BACKUP_ENCRYPTION_KEY (ex:
// rodando com `npx tsx --env-file=.env ...` se a chave estiver no .env
// local, ou exportando a chave de produção na sessão do terminal antes).
function main() {
  const [arquivo, ...resto] = process.argv.slice(2);
  if (!arquivo) {
    console.error("Uso: npx tsx scripts/descriptografar-backup.ts <arquivo.enc> [--chave \"...\"]");
    process.exit(1);
  }

  const flagChave = resto.indexOf("--chave");
  const chave = flagChave >= 0 ? resto[flagChave + 1] : process.env.BACKUP_ENCRYPTION_KEY;
  if (!chave) {
    console.error("Faltou a chave: passe --chave \"...\" ou defina BACKUP_ENCRYPTION_KEY no ambiente.");
    process.exit(1);
  }

  const bruto = readFileSync(arquivo);
  const salt = bruto.subarray(0, 16);
  const iv = bruto.subarray(16, 28);
  const authTag = bruto.subarray(28, 44);
  const cifrado = bruto.subarray(44);

  const chaveDerivada = scryptSync(chave, salt, 32);
  const decipher = createDecipheriv("aes-256-gcm", chaveDerivada, iv);
  decipher.setAuthTag(authTag);
  const json = Buffer.concat([decipher.update(cifrado), decipher.final()]).toString("utf8");

  const saida = arquivo.replace(/\.enc$/, "") + ".json";
  writeFileSync(saida, json);
  console.log(`Backup descriptografado em ${saida}`);
}

main();
