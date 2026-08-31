"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { restaurarBackupAction } from "../acoes";

export function RestaurarBackup({ backupId }: { backupId: string }) {
  const router = useRouter();
  const [pendente, iniciar] = useTransition();
  const [confirmando, setConfirmando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  function restaurar() {
    setErro(null);
    iniciar(async () => {
      try {
        await restaurarBackupAction(backupId);
        setConfirmando(false);
        router.push("/admin/formulario");
        router.refresh();
      } catch (err) {
        setErro(err instanceof Error ? err.message : "Falha ao restaurar.");
      }
    });
  }

  if (!confirmando) {
    return (
      <button
        type="button"
        onClick={() => setConfirmando(true)}
        className="rounded-md border border-white/10 px-2.5 py-1 text-xs text-zinc-400 hover:border-indigo-500/40 hover:text-indigo-300"
      >
        Restaurar
      </button>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={pendente}
          onClick={restaurar}
          className="rounded-md border border-indigo-500/30 bg-indigo-500/10 px-2.5 py-1 text-xs text-indigo-300 hover:bg-indigo-500/20"
        >
          Substituir o formulário atual por este
        </button>
        <button
          type="button"
          onClick={() => setConfirmando(false)}
          className="text-xs text-zinc-500 hover:text-zinc-300"
        >
          Cancelar
        </button>
      </div>
      {erro && <p className="text-xs text-red-400">{erro}</p>}
    </div>
  );
}
