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

  // O cache de rota do Next no navegador guarda a última versão de cada
  // página dinâmica por 30s por padrão. No wizard de preenchimento
  // (src/app/(cliente)/(comCabecalho)/preencher/[pagina]) isso é perigoso:
  // se o cliente usa "Anterior"/"Seguinte", ou o botão "Voltar" do PRÓPRIO
  // NAVEGADOR, o Next pode reaproveitar uma versão em cache da página de
  // ANTES da resposta certa ter sido salva - e como salvarPagina() faz
  // merge (`{...respostasAtuais, ...respostasPagina}`), um "Seguinte"
  // feito em cima dessa tela desatualizada sobrescreve a resposta certa
  // que já estava salva com a errada que ficou em cache (bug real, achado
  // em 2026-09-22: pergunta 315 "outro parente nos Estados Unidos"
  // salvando "Sim" mesmo o cliente tendo corrigido pra "Não" antes).
  // Zerando o staleTime de páginas dinâmicas, toda navegação do wizard
  // busca os dados de novo no servidor.
  experimental: {
    staleTimes: { dynamic: 0 },
  },
};

export default nextConfig;
