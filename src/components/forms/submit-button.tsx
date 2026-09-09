'use client';

import { useFormStatus } from 'react-dom';
import type { ComponentProps } from 'react';

import { Button } from '@/components/ui/button';

type Props = Omit<ComponentProps<typeof Button>, 'loading' | 'type'> & {
  /** Texto exibido enquanto o envio está em andamento. */
  pendingLabel?: string;
};

/** Botão de envio que já sabe sozinho quando o formulário está processando. */
export function SubmitButton({ children, pendingLabel, ...props }: Props) {
  const { pending } = useFormStatus();

  return (
    <Button {...props} type="submit" loading={pending}>
      {pending && pendingLabel ? pendingLabel : children}
    </Button>
  );
}
