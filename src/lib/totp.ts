import { randomBytes, createHmac, timingSafeEqual, createCipheriv, createDecipheriv, scryptSync } from "crypto";

/**
 * TOTP (RFC 6238): SHA1, passo de 30s, 6 dígitos — sem dependência externa. Funciona com Google
 * Authenticator, Microsoft Authenticator, Authy etc. Mesma base do 2ntravel-crm.
 */

const BASE32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
const PASSO_S = 30;

export function gerarSecretBase32(bytes = 20): string {
  const buf = randomBytes(bytes);
  let bits = 0;
  let valor = 0;
  let saida = "";
  for (const byte of buf) {
    valor = (valor << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      saida += BASE32[(valor >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) saida += BASE32[(valor << (5 - bits)) & 31];
  return saida;
}

function base32ParaBuffer(s: string): Buffer {
  const limpo = s.toUpperCase().replace(/[^A-Z2-7]/g, "");
  let bits = 0;
  let valor = 0;
  const bytes: number[] = [];
  for (const ch of limpo) {
    valor = (valor << 5) | BASE32.indexOf(ch);
    bits += 5;
    if (bits >= 8) {
      bytes.push((valor >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return Buffer.from(bytes);
}

function hotp(secret: Buffer, contador: number): string {
  const buf = Buffer.alloc(8);
  buf.writeUInt32BE(Math.floor(contador / 2 ** 32), 0);
  buf.writeUInt32BE(contador >>> 0, 4);
  const hmac = createHmac("sha1", secret).update(buf).digest();
  const offset = hmac[hmac.length - 1] & 0xf;
  const bin =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);
  return String(bin % 1_000_000).padStart(6, "0");
}

export function gerarTotp(secretBase32: string, em = Date.now()): string {
  return hotp(base32ParaBuffer(secretBase32), Math.floor(em / 1000 / PASSO_S));
}

/**
 * Confere o código (aceita o atual e ±1 janela, por causa de relógio desregulado) e devolve o
 * NÚMERO DO PASSO que bateu, ou null. O chamador guarda o último passo usado e recusa passo
 * menor ou igual: assim o mesmo código não vale duas vezes (replay).
 */
export function passoTotpValido(secretBase32: string, codigo: string, em = Date.now()): number | null {
  const limpo = codigo.replace(/\D/g, "");
  if (limpo.length !== 6) return null;
  const secret = base32ParaBuffer(secretBase32);
  const atual = Math.floor(em / 1000 / PASSO_S);
  let achado: number | null = null;
  for (let j = -1; j <= 1; j++) {
    const esperado = Buffer.from(hotp(secret, atual + j));
    const recebido = Buffer.from(limpo);
    // Percorre as 3 janelas sempre (tempo constante), sem sair no primeiro acerto.
    if (esperado.length === recebido.length && timingSafeEqual(esperado, recebido)) achado = atual + j;
  }
  return achado;
}

export function otpauthUri(secretBase32: string, conta: string, emissor: string): string {
  const rotulo = encodeURIComponent(`${emissor}:${conta}`);
  const params = new URLSearchParams({ secret: secretBase32, issuer: emissor, digits: "6", period: "30" });
  return `otpauth://totp/${rotulo}?${params.toString()}`;
}

// ---------- segredo cifrado no banco ----------
// O segredo do TOTP não fica em texto puro na tabela: se o banco vazar sozinho, os códigos
// continuam impossíveis de gerar. Chave derivada do AUTH_SECRET (que só existe nas variáveis
// da Vercel). AES-256-GCM; formato base64(iv 12 + tag 16 + dados).

function chaveDoSegredo(): Buffer {
  const base = process.env.AUTH_SECRET;
  if (!base) throw new Error("AUTH_SECRET não configurada.");
  return scryptSync(base, "totp-segredo-v1", 32);
}

export function cifrarSegredoTotp(segredo: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", chaveDoSegredo(), iv);
  const cifrado = Buffer.concat([cipher.update(segredo, "utf8"), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), cifrado]).toString("base64");
}

export function decifrarSegredoTotp(guardado: string): string {
  const bruto = Buffer.from(guardado, "base64");
  const decipher = createDecipheriv("aes-256-gcm", chaveDoSegredo(), bruto.subarray(0, 12));
  decipher.setAuthTag(bruto.subarray(12, 28));
  return Buffer.concat([decipher.update(bruto.subarray(28)), decipher.final()]).toString("utf8");
}
