"use client";

import { useFormStatus } from "react-dom";
import type { ButtonHTMLAttributes } from "react";

// Feedback visual de clique num form action direto (sem useActionState) —
// sem isso o botão fica parado enquanto a server action roda, e some a
// sensação de "cliquei e não aconteceu nada" em ações mais lentas (ex.:
// cadastro que dispara WhatsApp).
export function SubmitButton({
  children,
  pendingLabel,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { pendingLabel: string }) {
  const { pending } = useFormStatus();
  return (
    <button {...props} type="submit" disabled={pending || props.disabled}>
      {pending ? pendingLabel : children}
    </button>
  );
}
