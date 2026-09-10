'use client';

import Link from 'next/link';
import { useActionState, useState } from 'react';

import { SubmitButton } from '@/components/forms/submit-button';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/feedback';
import { IconEdit, IconTrash } from '@/components/ui/icons';
import {
  deleteIngredientAction,
  toggleIngredientActiveAction,
} from '@/server/actions/ingredients';
import { IDLE } from '@/server/form-state';

/**
 * Ações de cada linha: editar, desativar/reativar e excluir.
 *
 * A exclusão pede confirmação no lugar. Quando o banco recusa por o ingrediente
 * estar em uso, a mensagem aparece com a saída certa ao lado — desativar — em
 * vez de deixar a usuária num beco sem saída.
 */
export function IngredientRowActions({
  id,
  name,
  isActive,
  usageCount,
}: {
  id: string;
  name: string;
  isActive: boolean;
  usageCount: number;
}) {
  const [excluir, excluirAction] = useActionState(deleteIngredientAction, IDLE);
  const [alternar, alternarAction] = useActionState(toggleIngredientActiveAction, IDLE);
  const [confirmando, setConfirmando] = useState(false);

  if (excluir.status === 'error') {
    return (
      <div className="w-full space-y-2">
        <Alert tone="warning">{excluir.message}</Alert>
        <div className="flex flex-wrap gap-2">
          {isActive ? (
            <form action={alternarAction}>
              <input type="hidden" name="id" value={id} />
              <SubmitButton variant="secondary" size="sm" pendingLabel="Desativando...">
                Desativar ingrediente
              </SubmitButton>
            </form>
          ) : null}
          <Button type="button" variant="ghost" size="sm" onClick={() => setConfirmando(false)}>
            Cancelar
          </Button>
        </div>
      </div>
    );
  }

  if (alternar.status === 'error') {
    return <Alert tone="danger">{alternar.message}</Alert>;
  }

  if (confirmando) {
    return (
      <div className="flex w-full flex-wrap items-center justify-end gap-2">
        <span className="text-xs text-content-muted">Excluir {name}?</span>
        <form action={excluirAction}>
          <input type="hidden" name="id" value={id} />
          <SubmitButton variant="danger" size="sm" pendingLabel="Excluindo...">
            Confirmar
          </SubmitButton>
        </form>
        <Button type="button" variant="ghost" size="sm" onClick={() => setConfirmando(false)}>
          Cancelar
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-end gap-1">
      <Link
        href={`/ingredientes/${id}`}
        className="inline-flex h-9 items-center gap-1.5 rounded-xl px-3 text-sm text-content-muted hover:bg-surface-muted hover:text-content-strong"
      >
        <IconEdit className="h-4 w-4" />
        <span className="sr-only sm:not-sr-only">Editar</span>
        <span className="sr-only">{name}</span>
      </Link>

      <form action={alternarAction}>
        <input type="hidden" name="id" value={id} />
        {!isActive ? <input type="hidden" name="reativar" value="1" /> : null}
        <SubmitButton
          variant="ghost"
          size="sm"
          pendingLabel={isActive ? 'Desativando...' : 'Reativando...'}
        >
          {isActive ? 'Desativar' : 'Reativar'}
          <span className="sr-only"> {name}</span>
        </SubmitButton>
      </form>

      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => setConfirmando(true)}
        title={
          usageCount > 0
            ? 'Em uso em receitas — a exclusão vai pedir para desativar'
            : 'Excluir definitivamente'
        }
      >
        <IconTrash className="h-4 w-4" />
        <span className="sr-only">Excluir {name}</span>
      </Button>
    </div>
  );
}
