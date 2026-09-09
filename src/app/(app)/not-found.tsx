import Link from 'next/link';

import { Card, CardBody } from '@/components/ui/card';

export default function AppNotFound() {
  return (
    <Card>
      <CardBody className="space-y-4 py-10 text-center">
        <h1 className="font-display text-2xl font-semibold text-sand-900">
          Não encontramos essa página
        </h1>
        <p className="mx-auto max-w-md leading-relaxed text-sand-600">
          O item pode ter sido excluído, ou o endereço está diferente do esperado.
        </p>
        <div className="flex justify-center">
          <Link
            href="/painel"
            className="inline-flex h-11 items-center rounded-xl bg-rose-600 px-5 text-white hover:bg-rose-700"
          >
            Voltar ao painel
          </Link>
        </div>
      </CardBody>
    </Card>
  );
}
