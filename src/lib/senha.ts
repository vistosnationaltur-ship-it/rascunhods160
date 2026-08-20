import { randomBytes, scryptSync, timingSafeEqual } from "crypto";

// Senha de login do cliente é sempre o CPF, só dígitos — usado tanto pra
// gerar o hash no cadastro quanto pra normalizar o que o cliente digita
// no login (tolera pontuação: "123.456.789-00" vira "12345678900").
export function apenasDigitos(valor: string): string {
  return valor.replace(/\D/g, "");
}

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
