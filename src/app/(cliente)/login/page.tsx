"use client";

import { Suspense, useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { loginCliente } from "./actions";

function AvisoRascunho() {
  return (
    <div className="flex w-full flex-col gap-6 rounded-lg border border-zinc-200 bg-white p-6 sm:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:gap-8">
        <div className="flex flex-1 flex-col gap-3">
          <h1 className="text-xl font-bold text-zinc-900">Leia com atenção</h1>
          <p className="text-sm leading-relaxed text-zinc-700">
            As informações inseridas a seguir serão usadas para o preenchimento online do seu
            pedido de visto, o Formulário DS-160, dentro do sistema americano.
          </p>
          <p className="text-sm leading-relaxed text-zinc-700">
            Será através dele que sua solicitação de visto será analisada, por onde o cônsul fará
            a análise e o cruzamento de informações junto ao sistema interno americano para
            conceder ou negar seu pedido de visto.
          </p>
          <p className="text-sm leading-relaxed text-zinc-700">
            Além de usar as informações para fazer as perguntas durante a entrevista. Portanto,
            recomendamos que todos os campos sejam preenchidos e sempre com informações
            verdadeiras.
          </p>
          <p className="text-sm leading-relaxed text-zinc-700">
            Qualquer mentira ou divergência de informação poderá implicar em sua negativa.
          </p>
          <p className="text-sm leading-relaxed text-zinc-700">
            O correto preenchimento é de sua inteira responsabilidade. Qualquer informação
            errada, falsa ou divergente pode acarretar na recusa imediata da sua solicitação de
            visto americano de turista.
          </p>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/aviso-rascunho.webp"
          alt="Passaporte e confirmação do DS-160"
          className="h-48 w-full rounded-lg object-cover sm:h-auto sm:w-64 sm:shrink-0"
        />
      </div>

      <div className="flex justify-center rounded-lg bg-zinc-800 p-6">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo-2ntravel-aviso.jpg" alt="2N Travel" className="h-auto w-48" />
      </div>
    </div>
  );
}

function FormularioLogin() {
  const [estado, formAction, pendente] = useActionState(loginCliente, {});
  const searchParams = useSearchParams();
  const salvo = searchParams.get("salvo") === "1";

  return (
    <form
      action={formAction}
      className="flex w-full max-w-sm flex-col gap-5 rounded-lg border border-zinc-200 bg-white p-8 shadow-sm"
    >
      <div className="flex flex-col gap-1 text-center">
        <h2 className="text-lg font-semibold text-zinc-900">Acesse seu rascunho</h2>
        <p className="text-sm text-zinc-500">Entre com o e-mail cadastrado e o seu CPF</p>
      </div>
      {salvo && (
        <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          Suas respostas foram salvas. Pode voltar quando quiser — vai continuar exatamente daqui.
        </p>
      )}
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="text-zinc-700">E-mail</span>
        <input
          type="email"
          name="email"
          required
          autoFocus
          autoCapitalize="off"
          autoCorrect="off"
          className="rounded-md border border-zinc-300 px-3 py-2.5 text-zinc-900 outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
        />
      </label>
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="text-zinc-700">CPF</span>
        <input
          type="password"
          name="senha"
          required
          placeholder="000.000.000-00"
          className="rounded-md border border-zinc-300 px-3 py-2.5 text-zinc-900 outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
        />
      </label>
      {estado?.erro && (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {estado.erro}
        </p>
      )}
      <button
        type="submit"
        disabled={pendente}
        className="rounded-md bg-zinc-800 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-60"
      >
        {pendente ? "Entrando..." : "Entrar"}
      </button>
    </form>
  );
}

export default function LoginClientePage() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col items-center gap-8 px-6 py-8">
      <AvisoRascunho />
      <Suspense fallback={null}>
        <FormularioLogin />
      </Suspense>
    </div>
  );
}
