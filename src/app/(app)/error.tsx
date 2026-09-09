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
        <h1 className="font-display text-2xl font-semibold text-sand-900">
          Algo não carregou como devia
        </h1>
        <p className="mx-auto max-w-md leading-relaxed text-sand-600">
          Seus dados estão salvos. Tente abrir a tela de novo — se continuar assim, volte ao painel e
          siga por outro caminho.
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          <Button type="button" onClick={reset}>
            Tentar de novo
          </Button>
          <Link
            href="/painel"
            className="inline-flex h-11 items-center rounded-xl border border-sand-200 bg-white px-4 text-sand-700 hover:border-sand-300"
          >
            Ir para o painel
          </Link>
        </div>
      </CardBody>
    </Card>
  );
}
