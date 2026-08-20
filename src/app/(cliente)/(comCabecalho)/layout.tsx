// Cabeçalho (logo + título + barra) só nas páginas internas do rascunho
// (preencher/concluído) — a tela de login já tem sua própria "capa" (o
// aviso "Leia com atenção"), repetir o cabeçalho ali ficava redundante
// com a logo que já aparece dentro do aviso.
export default function LayoutComCabecalho({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="bg-zinc-800 px-6 py-6 text-white">
        <div className="mx-auto flex max-w-3xl items-center gap-5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-2ntravel-branco.svg" alt="2N Travel" className="h-auto w-[140px] shrink-0" />
          <div>
            <h1 className="text-xl font-bold sm:text-2xl">Rascunho de Formulário DS160</h1>
            <p className="mt-1 text-sm text-zinc-300">Modelo online exclusivo 2N Travel</p>
          </div>
        </div>
      </header>
      <div className="bg-zinc-700 px-6 py-3 text-center text-sm font-semibold text-white">
        Preencha Corretamente o Formulário abaixo
      </div>
      <main className="mx-auto w-full max-w-3xl px-6 py-8">{children}</main>
    </>
  );
}
