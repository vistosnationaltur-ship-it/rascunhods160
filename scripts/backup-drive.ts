// Backup COMPLETO e CRIPTOGRAFADO do Rascunho DS-160 numa pasta — a mesma pasta do Google Drive do backup do
// Flow (subpasta "DS160"). É chamado pelo "Fazer-Backup-Flow.bat" do Flow (que passa --destino), ou sozinho:
//
//   npm run backup:drive                       (usa BACKUP_DRIVE_DIR do .env)
//   npx tsx --env-file=.env scripts/backup-drive.ts --destino "G:\Meu Drive\Sistema Completo Flow\DS160"
//
// A senha vem de BACKUP_ENCRYPTION_KEY do .env DESTE projeto. Sem ela o script não grava nada.
//
// O que grava na pasta:
//   - ds160-backup-AAAA-MM-DD_HHMM.enc : usuários, schema do formulário e clientes (CPF, passaporte, respostas),
//     cifrado (AES-256-GCM), gravado em arquivo temporário e CONFERIDO relendo (descriptografa e compara contagens);
//   - "Codigo do Sistema/" : espelho do código atual (inclui o que não foi commitado), sem node_modules, .next, .env*;
//   - ds160-historico-git.bundle : todo o histórico do Git num arquivo só;
//   - ds160.env.enc : o .env deste PC cifrado (sem a própria senha do backup);
//   - ULTIMO-BACKUP.txt e LEIA-ME-RESTAURAR.md.
//
// RETENÇÃO (LGPD): este backup tem dado sensível de cliente e o sistema apaga rascunhos concluídos após 6 meses.
// Por isso as cópias de dados ficam só RETENCAO_DIAS (28) dias — nunca menos que as MANTER_MINIMO (2) mais novas.
//
// Falha => e-mail de alerta (RESEND_API_KEY, RESEND_FROM e TEAM_EMAIL_DS160 no .env), salvo com --sem-alerta
// (o Flow passa essa flag porque ele mesmo avisa). O código de saída é 1 se falhar.
import {
  copyFileSync,
  cpSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  renameSync,
  rmSync,
  statSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { spawnSync } from "node:child_process";
import { join, relative, resolve, sep } from "node:path";
import { Resend } from "resend";
import { cifrarBackup, decifrarBackup, lerBancoDs160, resumoDoBackup } from "@/lib/backup-automatico";
import { prisma } from "@/lib/prisma";

const PADRAO = /^ds160-backup-\d{4}-\d{2}-\d{2}_\d{4}\.enc$/;
const RETENCAO_DIAS = 28;
const MANTER_MINIMO = 2;

const EXCLUIR_PASTAS = new Set(["node_modules", ".next", ".git", ".vercel", "backups", "out", "build", "coverage"]);
const EXCLUIR_CAMINHOS = [`src${sep}generated`];
const EXCLUIR_ARQUIVOS = [/^\.env/, /\.tsbuildinfo$/, /^DOCUMENTACAO-INFRAESTRUTURA\.md$/, /^next-env\.d\.ts$/];

function copiarCodigo(raiz: string, pasta: string): number {
  const final = join(pasta, "Codigo do Sistema");
  const novo = `${final}.novo`;
  const antigo = `${final}.antigo`;
  rmSync(novo, { recursive: true, force: true });
  rmSync(antigo, { recursive: true, force: true });

  let arquivos = 0;
  cpSync(raiz, novo, {
    recursive: true,
    filter: (origem) => {
      const rel = relative(raiz, origem);
      if (rel === "") return true;
      const partes = rel.split(sep);
      if (EXCLUIR_PASTAS.has(partes[0])) return false;
      if (EXCLUIR_CAMINHOS.some((c) => rel === c || rel.startsWith(c + sep))) return false;
      if (partes.length === 1 && EXCLUIR_ARQUIVOS.some((r) => r.test(partes[0]))) return false;
      arquivos++;
      return true;
    },
  });

  // Troca só depois da cópia completa: se algo falhar no meio, o espelho anterior continua intacto.
  if (existsSync(final)) renameSync(final, antigo);
  renameSync(novo, final);
  rmSync(antigo, { recursive: true, force: true });
  return arquivos;
}

function exportarGit(raiz: string, pasta: string): boolean {
  const final = join(pasta, "ds160-historico-git.bundle");
  const temporario = `${final}.tmp`;
  const r = spawnSync("git", ["bundle", "create", temporario, "--all"], { cwd: raiz, encoding: "utf8" });
  if (r.status !== 0) return false;
  renameSync(temporario, final);
  return true;
}

function guardarEnvCifrado(raiz: string, pasta: string, senha: string): boolean {
  const caminho = join(raiz, ".env");
  if (!existsSync(caminho)) return false;
  // A própria senha do backup não precisa ir dentro do arquivo cifrado por ela.
  const texto = readFileSync(caminho, "utf8")
    .split(/\r?\n/)
    .filter((l) => !l.startsWith("BACKUP_ENCRYPTION_KEY="))
    .join("\n");
  const final = join(pasta, "ds160.env.enc");
  const temporario = `${final}.tmp`;
  writeFileSync(temporario, cifrarBackup(texto, senha));
  renameSync(temporario, final);
  return true;
}

function argumento(nome: string): string | undefined {
  const i = process.argv.indexOf(nome);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

function mensagemSegura(erro: unknown): string {
  const bruto = erro instanceof Error ? erro.message : String(erro);
  return bruto.replace(/[a-z]+:\/\/\S+/gi, "[endereço omitido]").slice(0, 300);
}

async function avisar(assunto: string, texto: string): Promise<void> {
  if (process.argv.includes("--sem-alerta")) return;
  const chave = process.env.RESEND_API_KEY;
  const de = process.env.RESEND_FROM;
  const para = process.env.TEAM_EMAIL_DS160;
  if (!chave || !de || !para) {
    console.warn("(alerta NÃO enviado por e-mail: RESEND_API_KEY/RESEND_FROM/TEAM_EMAIL_DS160 ausentes neste PC)");
    return;
  }
  try {
    await new Resend(chave).emails.send({ from: de, to: [para], subject: `⚠ ${assunto}`, text: texto });
  } catch {
    // alerta é só um aviso extra; a falha já está no console e no código de saída
  }
}

async function main() {
  const destino = argumento("--destino") ?? process.env.BACKUP_DRIVE_DIR;
  if (!destino) throw new Error('Faltou a pasta: use --destino "<pasta>" ou defina BACKUP_DRIVE_DIR.');
  const senha = process.env.BACKUP_ENCRYPTION_KEY;
  if (!senha) throw new Error("Faltou BACKUP_ENCRYPTION_KEY neste .env (a mesma do backup semanal por e-mail). Nada foi gravado.");

  const pasta = resolve(destino);
  mkdirSync(pasta, { recursive: true });

  const backup = await lerBancoDs160();
  const cifrado = cifrarBackup(JSON.stringify(backup), senha);

  const agora = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  const carimbo = `${agora.getFullYear()}-${p(agora.getMonth() + 1)}-${p(agora.getDate())}_${p(agora.getHours())}${p(agora.getMinutes())}`;
  const nome = `ds160-backup-${carimbo}.enc`;
  const final = join(pasta, nome);
  const temporario = `${final}.tmp`;

  writeFileSync(temporario, cifrado);
  renameSync(temporario, final);

  // Confere o arquivo que realmente ficou no disco: abre, descriptografa e compara cada tabela.
  const original = backup as unknown as Record<string, unknown>;
  const lido = JSON.parse(decifrarBackup(readFileSync(final), senha)) as Record<string, unknown>;
  for (const t of Object.keys(original).filter((k) => Array.isArray(original[k]))) {
    const esperado = (original[t] as unknown[]).length;
    const gravado = Array.isArray(lido[t]) ? (lido[t] as unknown[]).length : -1;
    if (esperado !== gravado) {
      unlinkSync(final);
      throw new Error(`O arquivo gravado não bate com o banco em "${t}" (${gravado} de ${esperado}). Backup descartado.`);
    }
  }

  // Retenção por idade (LGPD): só mexe em arquivos com o nome exato que este script gera.
  const limite = agora.getTime() - RETENCAO_DIAS * 86_400_000;
  const copias = readdirSync(pasta)
    .filter((f) => PADRAO.test(f))
    .sort();
  const apagaveis = copias.slice(0, Math.max(0, copias.length - MANTER_MINIMO));
  const apagar = apagaveis.filter((f) => statSync(join(pasta, f)).mtimeMs < limite);
  for (const f of apagar) unlinkSync(join(pasta, f));

  const raiz = process.cwd();
  const avisos: string[] = [];
  const arquivos = copiarCodigo(raiz, pasta);
  const git = exportarGit(raiz, pasta);
  const env = guardarEnvCifrado(raiz, pasta, senha);
  if (!git) avisos.push("Histórico do Git (ds160-historico-git.bundle) NÃO foi gerado.");
  if (!env) avisos.push("Arquivo .env não encontrado neste PC: ds160.env.enc NÃO foi gerado.");
  const sistema = `código (${arquivos} arquivos), histórico do Git ${git ? "ok" : "FALHOU"}, variáveis .env ${env ? "cifradas" : "não encontradas"}`;

  const guia = resolve(raiz, "RESTAURAR.md");
  if (existsSync(guia)) copyFileSync(guia, join(pasta, "LEIA-ME-RESTAURAR.md"));

  writeFileSync(
    join(pasta, "ULTIMO-BACKUP.txt"),
    `Último backup do Rascunho DS-160: ${agora.toISOString()}\nArquivo: ${nome}\nConteúdo: ${resumoDoBackup(backup)}\nSistema: ${sistema}\n` +
      (avisos.length > 0 ? `AVISOS: ${avisos.join(" | ")}\n` : "") +
      `Cópias de dados guardadas por ${RETENCAO_DIAS} dias (LGPD). Criptografado (AES-256-GCM). Senha = BACKUP_ENCRYPTION_KEY do DS-160 (cofre de senhas, NÃO está aqui).\n` +
      `Para recuperar: leia LEIA-ME-RESTAURAR.md.\n`,
  );

  console.log(`Backup DS-160 gravado: ${final}`);
  console.log(`Conferido: ${resumoDoBackup(backup)}`);
  console.log(`Sistema: ${sistema}`);
  if (apagar.length) console.log(`Retenção: ${apagar.length} cópia(s) com mais de ${RETENCAO_DIAS} dias removida(s).`);
  if (avisos.length > 0) {
    console.warn(`ATENÇÃO:\n- ${avisos.join("\n- ")}`);
    await avisar("Backup do DS-160 concluído com avisos", avisos.join("\n"));
  }
}

main()
  .catch(async (err) => {
    console.error("ERRO:", err);
    await avisar("Backup do DS-160 no Drive FALHOU", `O backup do Rascunho DS-160 para o Drive falhou.\n\nMotivo: ${mensagemSegura(err)}`);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
