// Separado de idade.ts de propósito: esse arquivo importa
// formulario-schema.ts, que carrega o Prisma no topo - inutilizável em
// Client Component. formulario-mutacoes.ts precisa de CAMPO_ID_IDADE mas
// é livre de Prisma (importado por EditorCampo.tsx, client), então essas
// duas constantes moram num arquivo à parte, sem nenhuma dependência.

export const CAMPO_ID_NASCIMENTO = 25;

// Sentinela reservado pra representar "idade calculada" nas condicionais
// (ver src/lib/idade.ts e condicional.ts, operadores
// "maior_ou_igual"/"menor_que") sem precisar mudar o tipo de
// Regra.campoId (é number) nem duplicar a data de nascimento como se
// fosse um campo de verdade em `respostas`. Nenhum campo real do schema
// chega perto de um id negativo.
export const CAMPO_ID_IDADE = -1;
