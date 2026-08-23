import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // pdfkit lê arquivos de métrica de fonte (.afm) do disco em tempo de
  // execução, relativos à própria pasta do pacote — isso quebra quando o
  // Next empacota o código (o .afm não viaja junto). serverExternalPackages
  // faz o Next usar `require` nativo pro pdfkit em vez de empacotar,
  // preservando a estrutura de arquivos do pacote em runtime (mesmo
  // mecanismo que já resolve isso pra libs nativas tipo sharp/canvas).
  // Tentativa anterior com outputFileTracingIncludes não funcionou —
  // continuou dando ENOENT em produção mesmo com o include.
  serverExternalPackages: ["pdfkit"],
};

export default nextConfig;
