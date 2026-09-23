import type { Metadata } from "next";
import { DATA_AVISO_PRIVACIDADE, secoesAviso } from "@/lib/aviso-privacidade";

export const metadata: Metadata = { title: "Aviso de Privacidade — Rascunho DS-160" };

export default function PrivacidadePage() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-10">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-zinc-900">Aviso de Privacidade</h1>
        <p className="text-sm text-zinc-500">Rascunho do DS-160 · versão de {DATA_AVISO_PRIVACIDADE}</p>
      </div>

      {secoesAviso().map((secao) => (
        <section key={secao.titulo} className="flex flex-col gap-2">
          <h2 className="text-base font-semibold text-zinc-900">{secao.titulo}</h2>
          {secao.paragrafos.map((p) => (
            <p key={p} className="text-sm leading-relaxed text-zinc-700">
              {p}
            </p>
          ))}
          {secao.itens && (
            <ul className="list-disc pl-5 text-sm leading-relaxed text-zinc-700">
              {secao.itens.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          )}
        </section>
      ))}

      <a href="/login" className="w-fit text-sm text-blue-700 underline-offset-4 hover:underline">
        ← Voltar ao login
      </a>
    </main>
  );
}
