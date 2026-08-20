import PDFDocument from "pdfkit";
import { respostasPorPagina, type Respostas } from "@/lib/formatar-respostas";
import { obterPaginas } from "@/lib/formulario-schema";

// Réplica em pdfkit (pure JS, roda em serverless sem binário nativo) —
// não é pixel-a-pixel igual ao template mPDF "zadani" antigo, mas
// reproduz estrutura (por página/seção), conteúdo completo e a mesma
// proteção por senha que a equipe já usa. Ver PDF_PASSWORD no .env.
export async function gerarPdfRascunho(params: {
  nomeCliente: string;
  email: string;
  respostas: Respostas;
}): Promise<Buffer> {
  const paginas = await obterPaginas();
  const senha = process.env.PDF_PASSWORD || "form2n";

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      margin: 50,
      userPassword: senha,
      ownerPassword: senha,
      permissions: { printing: "highResolution", modifying: false, copying: true },
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

    for (const pagina of respostasPorPagina(paginas, params.respostas)) {
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
