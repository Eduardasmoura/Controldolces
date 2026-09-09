'use client';

import { useActionState } from 'react';

import { SubmitButton } from '@/components/forms/submit-button';
import { Alert } from '@/components/ui/feedback';
import { IconCopy } from '@/components/ui/icons';
import { IDLE, type FormState } from '@/server/form-state';

/** Duplica a receita de um produto para criar uma variação. */
export function DuplicateButton({
  id,
  action,
}: {
  id: string;
  action: (state: FormState, formData: FormData) => Promise<FormState>;
}) {
  const [state, formAction] = useActionState(action, IDLE);

  if (state.status === 'error') {
    return <Alert tone="danger">{state.message}</Alert>;
  }

  return (
    <form action={formAction}>
      <input type="hidden" name="id" value={id} />
      <SubmitButton variant="ghost" size="sm" pendingLabel="Duplicando...">
        <IconCopy className="h-4 w-4" />
        <span className="sr-only">Duplicar receita</span>
      </SubmitButton>
    </form>
  );
}
