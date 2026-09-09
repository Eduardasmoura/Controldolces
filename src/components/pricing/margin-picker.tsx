'use client';

import { TextField } from '@/components/ui/field';
import { cn } from '@/components/ui/cn';
import { parseNumberInput } from '@/lib/format';
import { MAX_MARGIN_PERCENT } from '@/lib/pricing';

const SUGESTOES = [30, 40, 50, 60, 70];

/** Escolha da margem desejada: atalhos comuns mais digitação livre. */
export function MarginPicker({
  value,
  onChange,
  error,
}: {
  value: string;
  onChange: (value: string) => void;
  error?: string | null;
}) {
  const numero = parseNumberInput(value);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {SUGESTOES.map((margem) => {
          const ativo = numero === margem;
          return (
            <button
              key={margem}
              type="button"
              onClick={() => onChange(String(margem))}
              aria-pressed={ativo}
              className={cn(
                'h-10 min-w-[4rem] rounded-xl border px-3 text-sm font-medium transition-colors',
                ativo
                  ? 'border-rose-600 bg-rose-600 text-white'
                  : 'border-sand-200 bg-white text-sand-700 hover:border-rose-200 hover:text-rose-700',
              )}
            >
              {margem}%
            </button>
          );
        })}
      </div>

      <TextField
        label="Ou digite a margem que você quer"
        name="marginPercent"
        inputMode="decimal"
        suffix="%"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        error={error}
        hint={`Margem é quanto sobra de cada real vendido. Máximo de ${MAX_MARGIN_PERCENT}%.`}
      />
    </div>
  );
}
