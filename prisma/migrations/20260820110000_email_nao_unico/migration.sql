-- E-mail deixa de ser único: uma família pode compartilhar o mesmo
-- e-mail/telefone do responsável, um cadastro por pessoa (CPF diferente
-- cada um, que é quem continua único e é a senha de login).
DROP INDEX "ClienteDs160_email_key";
