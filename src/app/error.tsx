"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto mt-8 w-full max-w-xl rounded-2xl border border-red-500/20 bg-red-500/[0.06] p-6 text-sm text-red-300">
      <p className="font-medium">Algo deu errado</p>
      <p className="mt-1 text-red-400/80">{error.message}</p>
      <button
        onClick={reset}
        className="mt-4 rounded-lg border border-red-500/30 px-4 py-2 font-medium text-red-300 transition-colors hover:bg-red-500/10"
      >
        Tentar de novo
      </button>
    </div>
  );
}
