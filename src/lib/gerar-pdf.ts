import { randomBytes } from "crypto";
import PDFDocument from "pdfkit";
import { respostasPorPagina, type Respostas } from "@/lib/formatar-respostas";
import { obterPaginas } from "@/lib/formulario-schema";
import { comIdadeInjetada } from "@/lib/idade";

// Réplica em pdfkit (pure JS, roda em serverless sem binário nativo) —
// não é pixel-a-pixel igual ao template mPDF "zadani" antigo, mas
// reproduz estrutura (por página/seção) e conteúdo completo.
//
// Senha (2026-09-23, revertendo a decisão de 2026-08-23 de mandar sem senha): o PDF que vai por
// e-mail tem todas as respostas (passaporte etc.), então sai protegido. A senha é o CPF de quem
// preencheu (só números) — o cliente já sabe (é o que ele digita pra entrar) e a equipe tem na
// ficha. Sem CPF, usa a env PDF_PASSWORD se existir; sem nenhum dos dois, sai sem senha.
export function senhaDoPdf(cpf: string | null | undefined): string | undefined {
  const digitos = (cpf ?? "").replace(/\D/g, "");
  return digitos || process.env.PDF_PASSWORD || undefined;
}

export async function gerarPdfRascunho(params: {
  nomeCliente: string;
  email: string;
  respostas: Respostas;
  /** Quando informada, o PDF sai criptografado (AES-256) e só abre com ela. */
  senha?: string;
}): Promise<Buffer> {
  const paginas = await obterPaginas();

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      margin: 50,
      ...(params.senha
        ? {
            userPassword: params.senha,
            ownerPassword: randomBytes(16).toString("hex"),
            pdfVersion: "1.7ext3" as const,
          }
        : {}),
    });

    const partes: Buffer[] = [];
    doc.on("data", (chunk) => partes.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(partes)));
    doc.on("error", reject);

    doc
      .fontSize(18)
      .text("Rascunho DS-160 — Visto Americano de Turista", { align: "center" })
      .moveDown(0.3)
      .fontSize(11)
      .fillColor("#555555")
      .text(`Cliente: ${params.nomeCliente}`, { align: "center" })
      .text(`E-mail: ${params.email}`, { align: "center" })
      .text(`Gerado em: ${new Date().toLocaleString("pt-BR")}`, { align: "center" })
      .fillColor("#000000")
      .moveDown(1.5);

    const respostas = comIdadeInjetada(paginas, params.respostas);
    for (const pagina of respostasPorPagina(paginas, respostas)) {
      if (doc.y > doc.page.height - 150) doc.addPage();

      doc
        .fontSize(13)
        .fillColor("#1e1b4b")
        .text(pagina.titulo, { underline: true })
        .fillColor("#000000")
        .moveDown(0.5);

      for (const { campo, texto } of pagina.itens) {
        if (doc.y > doc.page.height - 100) doc.addPage();

        doc.fontSize(10).font("Helvetica-Bold").text(campo.label);
        doc
          .font("Helvetica")
          .fillColor(texto ? "#000000" : "#9ca3af")
          .text(texto || "(não respondido)")
          .fillColor("#000000")
          .moveDown(0.6);
      }

      doc.moveDown(0.8);
    }

    doc.end();
  });
}
