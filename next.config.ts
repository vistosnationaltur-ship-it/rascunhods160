import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // pdfkit lê os arquivos de métrica de fonte (.afm) do disco em tempo de
  // execução (fs.readFileSync) — sem isso, o file tracing do Next não
  // inclui esses arquivos no bundle da function serverless, e a geração
  // de PDF quebra em produção (Vercel) mesmo funcionando local, porque
  // localmente o node_modules inteiro já está disponível no disco.
  // Aplicado a toda rota, de propósito — o padrão restrito por rota
  // (ex.: "/preencher/**") não bateu certo com o path real da rota
  // /admin/clientes/[id]/pdf na Vercel (continuou dando 500 mesmo depois
  // do include específico), então foi trocado pelo curinga total, que é
  // barato (só uns KB de dado de fonte) e elimina qualquer dúvida de
  // path matching.
  outputFileTracingIncludes: {
    "/**": ["./node_modules/pdfkit/js/data/**"],
  },
};

export default nextConfig;
