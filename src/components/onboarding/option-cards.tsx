'use client';

import { useId, useState } from 'react';

import { cn } from '@/components/ui/cn';
import { IconCheck } from '@/components/ui/icons';

/**
 * Grupo de opções em forma de cartão.
 *
 * Por baixo são `input[type=radio]` de verdade: setas do teclado navegam, o
 * leitor de tela anuncia "opção 2 de 6" e o formulário envia o valor sem
 * JavaScript nenhum. O cartão é só a aparência.
 */
export function OptionCards({
  name,
  options,
  defaultValue,
  columns = 2,
}: {
  name: string;
  options: { value: string; label: string; description?: string }[];
  defaultValue?: string;
  columns?: 1 | 2;
}) {
  const grupo = useId();
  const [selecionado, setSelecionado] = useState(defaultValue ?? '');

  return (
    <div
      className={cn('grid gap-2.5', columns === 2 ? 'sm:grid-cols-2' : '')}
      role="radiogroup"
      aria-labelledby={`${grupo}-legenda`}
    >
      {options.map((option) => {
        const id = `${grupo}-${option.value}`;
        const ativo = selecionado === option.value;

        return (
          <label
            key={option.value}
            htmlFor={id}
            className={cn(
              'relative flex cursor-pointer items-start gap-3 rounded-2xl border px-4 py-3.5 transition-colors',
              'has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-primary has-[:focus-visible]:ring-offset-2',
              ativo
                ? 'border-primary bg-primary-soft/50'
                : 'border-surface-border bg-surface hover:border-primary/40',
            )}
          >
            <input
              type="radio"
              id={id}
              name={name}
              value={option.value}
              checked={ativo}
              onChange={() => setSelecionado(option.value)}
              className="sr-only"
            />

            <span
              aria-hidden="true"
              className={cn(
                'mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border transition-colors',
                ativo ? 'border-primary bg-primary text-primary-contrast' : 'border-surface-border',
              )}
            >
              {ativo ? <IconCheck className="h-3 w-3" /> : null}
            </span>

            <span className="min-w-0">
              <span
                className={cn(
                  'block font-medium',
                  ativo ? 'text-primary-hover' : 'text-content-strong',
                )}
              >
                {option.label}
              </span>
              {option.description ? (
                <span className="mt-0.5 block text-sm leading-relaxed text-content-muted">
                  {option.description}
                </span>
              ) : null}
            </span>
          </label>
        );
      })}
    </div>
  );
}
