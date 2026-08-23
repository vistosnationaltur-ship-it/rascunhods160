import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // pdfkit lê os arquivos de métrica de fonte (.afm) do disco em tempo de
  // execução (fs.readFileSync) — sem isso, o file tracing do Next não
  // inclui esses arquivos no bundle da function serverless, e a geração
  // de PDF quebra em produção (Vercel) mesmo funcionando local, porque
  // localmente o node_modules inteiro já está disponível no disco.
  outputFileTracingIncludes: {
    "/preencher/**": ["./node_modules/pdfkit/js/data/**"],
    "/admin/clientes/**": ["./node_modules/pdfkit/js/data/**"],
  },
};

export default nextConfig;
