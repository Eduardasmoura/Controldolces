'use client';

import Link from 'next/link';
import { useEffect } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardBody } from '@/components/ui/card';

/** Erro inesperado numa tela privada. Nada de mensagem técnica na cara da usuária. */
export default function AppError({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    console.error('[controldolces] erro de renderização', error);
  }, [error]);

  return (
    <Card>
      <CardBody className="space-y-4 py-10 text-center">
        <h1 className="font-display text-2xl font-bold text-content-strong">
          Não conseguimos carregar seus dados agora
        </h1>
        <p className="mx-auto max-w-md leading-relaxed text-content-muted">
          Seus dados estão salvos — o problema foi ao buscá-los. Tente novamente; se continuar
          assim, volte ao painel e siga por outro caminho.
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          <Button type="button" onClick={reset}>
            Tentar novamente
          </Button>
          <Link
            href="/painel"
            className="inline-flex h-11 items-center rounded-xl border border-surface-border bg-surface px-4 text-content hover:border-content-subtle/40"
          >
            Ir para o painel
          </Link>
        </div>
      </CardBody>
    </Card>
  );
}
