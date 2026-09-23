// Aviso de Privacidade do Rascunho DS-160 (LGPD, Lei nº 13.709/2018).
//
// ATENÇÃO — RASCUNHO PARA REVISÃO JURÍDICA: este texto foi redigido com base no que o sistema
// realmente faz hoje (dados coletados, prazos de retenção, medidas de segurança) e nos dados da
// contratada que já constam no contrato do Flow. Deve ser revisado por advogado(a) antes de ir
// ao ar. Sempre que o texto mudar de forma relevante, SUBA a versão abaixo: quem aceitou a
// versão antiga será pedido de novo no próximo login.
export const VERSAO_AVISO_PRIVACIDADE = "2026-09-23-r1";
export const DATA_AVISO_PRIVACIDADE = "23/09/2026";

export const CONTROLADORA_NOME = "JANAINA PIRES DOS SANTOS CRUZ";
export const CONTROLADORA_CNPJ = "48.135.204/0001-66";

// Encarregado(a) pelo tratamento de dados (LGPD art. 41) e canal de contato, definidos pela 2N em
// 2026-09-23. A env EMAIL_PRIVACIDADE, se existir, sobrescreve o e-mail (sem precisar de deploy de código).
export const ENCARREGADO: string | null = "Alex G Cruz";
export const EMAIL_PRIVACIDADE_PADRAO = "contato@ds160.2ntravel.com.br";

export function emailPrivacidade(): string {
  return process.env.EMAIL_PRIVACIDADE?.trim() || EMAIL_PRIVACIDADE_PADRAO;
}

export function contatoPrivacidade(): string {
  return `pelo e-mail ${emailPrivacidade()}`;
}

export type SecaoAviso = { titulo: string; paragrafos: string[]; itens?: string[] };

export function secoesAviso(): SecaoAviso[] {
  return [
    {
      titulo: "1. Quem é responsável pelos seus dados",
      paragrafos: [
        `A 2N Travel presta assessoria para pedidos de visto americano de turista. A responsável pelo tratamento dos seus dados (controladora) é ${CONTROLADORA_NOME}, inscrita no CNPJ ${CONTROLADORA_CNPJ}.`,
        ...(ENCARREGADO
          ? [
              `Encarregado(a) pelo tratamento de dados pessoais: ${ENCARREGADO}, contato ${emailPrivacidade()}.`,
            ]
          : []),
      ],
    },
    {
      titulo: "2. Quais dados coletamos",
      paragrafos: ["Coletamos o que é necessário para preencher o formulário DS-160 em seu nome:"],
      itens: [
        "Identificação e contato: nome, CPF, e-mail e telefone.",
        "Dados do formulário DS-160: passaporte, endereço, família, trabalho ou estudo, histórico de viagens e demais respostas exigidas pelo governo americano.",
        "Respostas de segurança e antecedentes exigidas pelo formulário. Alguns desses dados podem ser considerados sensíveis ou de natureza delicada (por exemplo, sobre saúde, antecedentes ou religião), e por isso pedimos o seu consentimento específico.",
      ],
    },
    {
      titulo: "3. Para que usamos",
      paragrafos: [
        "Usamos seus dados somente para prestar o serviço contratado: preencher e revisar o DS-160, orientar você no processo do visto e nos comunicarmos sobre ele. Não vendemos seus dados e não os usamos para publicidade de terceiros.",
        "As bases legais são a execução do contrato de assessoria (art. 7º, V, da LGPD) e o seu consentimento (arts. 7º, I, e 11, I), inclusive para os dados sensíveis.",
      ],
    },
    {
      titulo: "4. Com quem compartilhamos",
      paragrafos: [
        "Apenas o necessário para o serviço: a equipe autorizada da 2N Travel; fornecedores de tecnologia que operam o sistema sob nossas instruções (hospedagem, banco de dados, envio de e-mail e de mensagens); e o sistema oficial do governo dos Estados Unidos (CEAC), para onde o formulário é enviado em seu nome. Por isso seus dados podem ser transferidos para fora do Brasil.",
      ],
    },
    {
      titulo: "5. Como protegemos",
      paragrafos: [
        "Adotamos medidas técnicas e administrativas, entre elas:",
      ],
      itens: [
        "conexão criptografada (HTTPS) e acesso ao seu rascunho apenas com e-mail e CPF;",
        "acesso da equipe com senha e verificação em duas etapas;",
        "PDF do rascunho enviado por e-mail protegido por senha;",
        "cópias de segurança criptografadas e acesso restrito a quem precisa.",
      ],
    },
    {
      titulo: "6. Por quanto tempo guardamos",
      paragrafos: [
        "O seu rascunho do DS-160 é apagado do sistema 30 dias depois da devolução do seu passaporte e, em qualquer caso, no máximo 6 meses depois de você concluí-lo. Dados básicos de cadastro (nome e contato) podem ser mantidos para futuros atendimentos e para cumprir obrigações legais, e você pode pedir a exclusão quando quiser.",
      ],
    },
    {
      titulo: "7. Seus direitos",
      paragrafos: [
        `Você pode, a qualquer momento, pedir: confirmação de que tratamos seus dados; acesso a eles; correção; anonimização, bloqueio ou eliminação; portabilidade; informação sobre com quem compartilhamos; e a revogação do consentimento (art. 18 da LGPD). Fale com a gente ${contatoPrivacidade()}. A revogação não afeta o que já foi feito com base no consentimento anterior, e pode impedir a continuação do serviço.`,
      ],
    },
    {
      titulo: "8. Menores de idade e preenchimento por outra pessoa",
      paragrafos: [
        "Para menores de 18 anos, o formulário deve ser preenchido e o consentimento dado por um dos pais ou pelo responsável legal, em benefício do menor. Ao preencher os dados de um familiar, você declara ter autorização ou representação para isso.",
      ],
    },
    {
      titulo: "9. Segurança nunca é absoluta",
      paragrafos: [
        "Trabalhamos para proteger seus dados, mas nenhum sistema é 100% seguro. Se houver incidente que possa causar risco relevante a você, avisaremos você e as autoridades competentes, como a lei determina.",
      ],
    },
    {
      titulo: "10. Atualizações",
      paragrafos: [
        `Este aviso pode ser atualizado. A versão vigente é a de ${DATA_AVISO_PRIVACIDADE}. Se houver mudança relevante, pediremos que você leia e concorde de novo.`,
      ],
    },
  ];
}
