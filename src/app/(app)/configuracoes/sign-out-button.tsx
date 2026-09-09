'use client';

import { SubmitButton } from '@/components/forms/submit-button';
import { IconLogout } from '@/components/ui/icons';
import { signOutAction } from '@/server/actions/auth';

export function SignOutButton() {
  return (
    <form action={signOutAction}>
      <SubmitButton variant="secondary" pendingLabel="Saindo...">
        <IconLogout className="h-4 w-4" />
        Sair da conta
      </SubmitButton>
    </form>
  );
}
