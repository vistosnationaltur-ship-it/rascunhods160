import { randomBytes, scryptSync, timingSafeEqual } from "crypto";

export function hashSenha(senha: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(senha, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function senhaConfere(senha: string, senhaHash: string): boolean {
  const [salt, hash] = senhaHash.split(":");
  if (!salt || !hash) return false;
  const hashCalculado = scryptSync(senha, salt, 64);
  const hashArmazenado = Buffer.from(hash, "hex");
  if (hashCalculado.length !== hashArmazenado.length) return false;
  return timingSafeEqual(hashCalculado, hashArmazenado);
}
