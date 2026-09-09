'use client';

import { useActionState, useState } from 'react';

import { Button } from '@/components/ui/button';
import { SubmitButton } from '@/components/forms/submit-button';
import { Alert } from '@/components/ui/feedback';
import { IconTrash } from '@/components/ui/icons';
import { IDLE, type FormState } from '@/server/form-state';

/**
 * Exclusão em dois toques: o botão pede confirmação no lugar antes de agir.
 * Mais leve que uma janela modal e igualmente claro sobre a consequência.
 */
export function DeleteForm({
  id,
  action,
  label = 'Excluir',
  confirmation,
}: {
  id: string;
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  label?: string;
  confirmation: string;
}) {
  const [state, formAction] = useActionState(action, IDLE);
  const [confirming, setConfirming] = useState(false);

  if (state.status === 'error') {
    return (
      <div className="space-y-2">
        <Alert tone="danger">{state.message}</Alert>
        <Button type="button" variant="secondary" size="sm" onClick={() => setConfirming(false)}>
          Entendi
        </Button>
      </div>
    );
  }

  if (!confirming) {
    return (
      <Button type="button" variant="ghost" size="sm" onClick={() => setConfirming(true)}>
        <IconTrash className="h-4 w-4" />
        <span className="sr-only sm:not-sr-only">{label}</span>
      </Button>
    );
  }

  return (
    <form action={formAction} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="id" value={id} />
      <span className="text-xs text-sand-600">{confirmation}</span>
      <SubmitButton variant="danger" size="sm" pendingLabel="Excluindo...">
        Confirmar
      </SubmitButton>
      <Button type="button" variant="ghost" size="sm" onClick={() => setConfirming(false)}>
        Cancelar
      </Button>
    </form>
  );
}
