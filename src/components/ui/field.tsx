'use client';

import { useId } from 'react';
import type { ComponentProps, ReactNode } from 'react';

import { cn } from './cn';

const CONTROL =
  'w-full rounded-xl border bg-white px-3.5 text-[16px] text-sand-800 placeholder:text-sand-400 transition-colors disabled:bg-sand-50 disabled:text-sand-500';

type FieldShellProps = {
  label: string;
  hint?: ReactNode;
  error?: string | null;
  required?: boolean;
  /** Texto fixo à direita do campo, como "R$" ou "%". */
  children: (ids: { id: string; describedBy: string | undefined; invalid: boolean }) => ReactNode;
};

/**
 * Casca compartilhada por todos os campos: rótulo ligado ao controle, dica e
 * mensagem de erro associadas por aria-describedby. Sem isso o leitor de tela
 * anuncia o campo sem dizer o que deu errado.
 */
export function FieldShell({ label, hint, error, required, children }: FieldShellProps) {
  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const describedBy = [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(' ') || undefined;

  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium text-sand-700">
        {label}
        {required ? <span className="ml-0.5 text-rose-600">*</span> : null}
      </label>
      {children({ id, describedBy, invalid: Boolean(error) })}
      {hint && !error ? (
        <p id={hintId} className="text-xs leading-relaxed text-sand-500">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} role="alert" className="text-xs font-medium text-danger-600">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function controlClass(invalid: boolean, className?: string) {
  return cn(
    CONTROL,
    invalid ? 'border-danger-500 focus:ring-danger-500' : 'border-sand-200 hover:border-sand-300',
    className,
  );
}

type TextFieldProps = Omit<ComponentProps<'input'>, 'id'> & {
  label: string;
  hint?: ReactNode;
  error?: string | null;
  prefix?: string;
  suffix?: string;
};

export function TextField({ label, hint, error, prefix, suffix, className, ...props }: TextFieldProps) {
  return (
    <FieldShell label={label} hint={hint} error={error} required={props.required}>
      {({ id, describedBy, invalid }) => (
        <div className="relative">
          {prefix ? (
            <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-sm text-sand-500">
              {prefix}
            </span>
          ) : null}
          <input
            {...props}
            id={id}
            aria-describedby={describedBy}
            aria-invalid={invalid || undefined}
            className={controlClass(
              invalid,
              cn('h-11', prefix && 'pl-10', suffix && 'pr-10', className),
            )}
          />
          {suffix ? (
            <span className="pointer-events-none absolute inset-y-0 right-3.5 flex items-center text-sm text-sand-500">
              {suffix}
            </span>
          ) : null}
        </div>
      )}
    </FieldShell>
  );
}

type SelectFieldProps = Omit<ComponentProps<'select'>, 'id'> & {
  label: string;
  hint?: ReactNode;
  error?: string | null;
};

export function SelectField({ label, hint, error, className, children, ...props }: SelectFieldProps) {
  return (
    <FieldShell label={label} hint={hint} error={error} required={props.required}>
      {({ id, describedBy, invalid }) => (
        <select
          {...props}
          id={id}
          aria-describedby={describedBy}
          aria-invalid={invalid || undefined}
          className={controlClass(invalid, cn('h-11 appearance-none bg-[length:14px] bg-[right_0.9rem_center] bg-no-repeat pr-10', className))}
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='none' stroke='%237D746C' stroke-width='1.6' stroke-linecap='round'%3E%3Cpath d='M4 6.5 8 10.5 12 6.5'/%3E%3C/svg%3E\")",
          }}
        >
          {children}
        </select>
      )}
    </FieldShell>
  );
}

type TextAreaFieldProps = Omit<ComponentProps<'textarea'>, 'id'> & {
  label: string;
  hint?: ReactNode;
  error?: string | null;
};

export function TextAreaField({ label, hint, error, className, ...props }: TextAreaFieldProps) {
  return (
    <FieldShell label={label} hint={hint} error={error} required={props.required}>
      {({ id, describedBy, invalid }) => (
        <textarea
          {...props}
          id={id}
          aria-describedby={describedBy}
          aria-invalid={invalid || undefined}
          className={controlClass(invalid, cn('min-h-[6rem] resize-y py-2.5', className))}
        />
      )}
    </FieldShell>
  );
}
