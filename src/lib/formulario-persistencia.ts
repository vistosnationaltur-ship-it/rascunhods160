import { exigirAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Pagina } from "./formulario-schema";
import { registrarBackup } from "./formulario-backup";
import { validarSchema } from "./formulario-mutacoes";

// Ponto único por onde TODA alteração do schema do formulário passa,
// venha do builder (add/excluir/reordenar/trocar tipo) ou do editor de
// campo (label, opções, condicional). Sempre: exige admin → valida o
// resultado → tira backup do estado anterior → grava. Se a validação
// falhar, nada é gravado e nenhum backup é criado.
export async function aplicarMudancaSchema(
  motivo: string,
  transformar: (paginas: Pagina[]) => Pagina[],
): Promise<void> {
  await exigirAdmin();

  const registro = await prisma.formularioSchema.findFirst();
  if (!registro) throw new Error("FormularioSchema não encontrado.");

  const atuais = registro.paginas as unknown as Pagina[];
  const novas = transformar(atuais);

  const erros = validarSchema(novas);
  if (erros.length > 0) {
    throw new Error(erros.join(" "));
  }

  await registrarBackup(atuais, motivo);

  await prisma.formularioSchema.update({
    where: { id: registro.id },
    data: { paginas: novas as unknown as object },
  });
}
