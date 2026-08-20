// Roda scripts/converter-schema.ts antes (gera src/lib/formulario-schema.json
// a partir do Gravity Forms), e este script joga esse conteúdo pro banco
// (tabela FormularioSchema). Só precisa rodar uma vez — depois disso o
// admin edita direto pela tela e o arquivo .json vira só um histórico.
import { readFileSync } from "fs";
import { join } from "path";
import { prisma } from "@/lib/prisma";

async function main() {
  const caminho = join(__dirname, "..", "src", "lib", "formulario-schema.json");
  const paginas = JSON.parse(readFileSync(caminho, "utf8"));

  const existente = await prisma.formularioSchema.findFirst();
  if (existente) {
    await prisma.formularioSchema.update({ where: { id: existente.id }, data: { paginas } });
    console.log("FormularioSchema existente atualizado com o conteúdo do .json.");
  } else {
    await prisma.formularioSchema.create({ data: { paginas } });
    console.log("FormularioSchema criado no banco.");
  }
}

main().finally(() => prisma.$disconnect());
