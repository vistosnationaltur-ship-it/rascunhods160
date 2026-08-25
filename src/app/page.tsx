import Link from "next/link";

/**
 * Ícones inline (sem lib externa — dois ícones simples, não vale dependência).
 */
function PassportIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <rect x="5" y="2.5" width="14" height="19" rx="2" />
      <circle cx="12" cy="10" r="2.6" />
      <path d="M9.2 16c.5-1.4 1.6-2.1 2.8-2.1s2.3.7 2.8 2.1" />
      <path d="M8.5 6.2h7" />
    </svg>
  );
}

function KeyPeopleIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <circle cx="8.5" cy="7.5" r="3" />
      <path d="M2.5 20c0-3.3 2.7-5.5 6-5.5s6 2.2 6 5.5" />
      <circle cx="17.5" cy="10.5" r="2.4" />
      <path d="M14.8 6.2l1.6-1.6 1 1 1.6-1.6" />
    </svg>
  );
}

export default function HomePage() {
  return (
    <div className="relative isolate flex min-h-screen flex-col overflow-hidden bg-[#0B1D2E] text-[#F4EEE1]">
      {/*
        Fundo full-bleed — três camadas empilhadas:
        1) gradiente navy (sempre presente, base do design)
        2) imagem de viagem (troque o arquivo em /public/hero-bg.jpg quando
           tiver o asset final; sem o arquivo, o navegador simplesmente não
           renderiza essa camada e o gradiente/textura seguem cobrindo tudo —
           fallback gracioso, sem quebra de layout)
        3) overlay escuro pra manter o contraste do texto mesmo com foto real
      */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage:
            "linear-gradient(180deg, #0B1D2E 0%, #08141F 100%), url('/hero-bg.jpg')",
          backgroundBlendMode: "overlay",
        }}
      />
      {/* textura decorativa — linhas de rota estilo mapa-múndi, bem sutil */}
      <svg
        aria-hidden
        className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.07]"
        preserveAspectRatio="none"
        viewBox="0 0 1440 900"
        fill="none"
      >
        <path
          d="M-40 620 C 200 520, 380 700, 620 560 S 1040 420, 1220 540 S 1500 460, 1600 380"
          stroke="#F4EEE1"
          strokeWidth={1.2}
        />
        <path
          d="M-60 260 C 180 340, 340 160, 560 240 S 900 340, 1120 200 S 1440 180, 1560 260"
          stroke="#C9A34D"
          strokeWidth={1.2}
        />
        <path
          d="M-40 860 C 260 760, 460 900, 720 800 S 1120 700, 1480 800"
          stroke="#F4EEE1"
          strokeWidth={1}
        />
        {[
          [120, 560], [620, 560], [1220, 540], [340, 160], [900, 340], [1120, 200], [720, 800],
        ].map(([cx, cy]) => (
          <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={3} fill="#C9A34D" />
        ))}
      </svg>
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-black/55" />

      <header className="relative z-10 border-b border-white/10 bg-[#0B1D2E]/40 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#C9A34D] font-display text-xs font-semibold text-[#C9A34D]">
              2N
            </span>
            <span className="text-sm font-semibold tracking-[0.02em] text-[#F4EEE1]">
              2N TRAVEL <span className="text-[#C9A34D]">|</span> DS160
            </span>
          </div>
        </div>
      </header>

      <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 py-20 text-center">
        <h1 className="sr-only">Rascunho DS160 — 2N Travel</h1>
        <p className="max-w-xl text-balance text-[1.125rem] font-normal text-[#F4EEE1]/80 sm:text-[1.25rem]">
          Seu caminho simplificado para vistos americanos. Moderno. Seguro. Eficiente.
        </p>

        <div className="mt-10 flex w-full max-w-xs flex-col gap-4 sm:max-w-none sm:w-auto sm:flex-row">
          <Link
            href="/login"
            className="group inline-flex items-center justify-center gap-2 rounded-full border border-[#C9A34D] bg-[#1E4258]/40 px-8 py-3.5 text-sm font-semibold text-[#C9A34D] shadow-[0_0_24px_rgba(201,163,77,0.25)] transition-shadow duration-[160ms] ease-[cubic-bezier(0.16,1,0.3,1)] hover:shadow-[0_0_32px_rgba(201,163,77,0.4)] motion-safe:hover:-translate-y-px motion-safe:transition-[transform,box-shadow] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C9A34D]"
          >
            <PassportIcon className="h-4 w-4" />
            Acesso do cliente
          </Link>
          <Link
            href="/admin/login"
            className="group inline-flex items-center justify-center gap-2 rounded-full border border-[#C9A34D]/70 bg-[#08141F]/60 px-8 py-3.5 text-sm font-semibold text-[#C9A34D] transition-shadow duration-[160ms] ease-[cubic-bezier(0.16,1,0.3,1)] hover:shadow-[0_0_20px_rgba(201,163,77,0.22)] motion-safe:hover:-translate-y-px motion-safe:transition-[transform,box-shadow] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C9A34D]"
          >
            <KeyPeopleIcon className="h-4 w-4" />
            Acesso da equipe
          </Link>
        </div>
      </main>

      <footer className="relative z-10 border-t border-white/10 px-6 py-6 text-center text-xs text-[#F4EEE1]/50">
        <p>© 2026 2N Travel. Todos os direitos reservados.</p>
        <p className="mt-1 tracking-[0.04em]">2N TRAVEL | DS160</p>
      </footer>
    </div>
  );
}
