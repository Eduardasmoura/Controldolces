import type { Metadata } from 'next';

import { PageHeader } from '@/components/app/page-header';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { formatDate } from '@/lib/format';
import { requireContext } from '@/server/context';
import { getSubscription } from '@/server/queries';

import { BusinessForm } from './business-form';
import { CostSettingsForm } from './cost-settings-form';
import { SignOutButton } from './sign-out-button';

export const metadata: Metadata = {
  title: 'Configurações',
  robots: { index: false, follow: false },
};

const PLANOS: Record<string, string> = {
  free: 'Gratuito',
  pro: 'Profissional',
};

const SITUACOES: Record<string, string> = {
  active: 'ativo',
  trialing: 'em teste',
  canceled: 'cancelado',
};

export default async function SettingsPage() {
  const { user, profile, business, settings } = await requireContext();
  const subscription = await getSubscription(business.id);

  return (
    <>
      <PageHeader
        title="Configurações"
        description="Os valores daqui entram em todos os cálculos do sistema."
      />

      <div className="space-y-6">
        <CostSettingsForm
          initial={{
            laborHourlyRate: String(settings.labor_hourly_rate),
            defaultMarginPercent: String(settings.default_margin_percent),
            minimumMarginPercent: String(settings.minimum_margin_percent),
            variableFeesPercent: String(settings.variable_fees_percent),
            indirectMethod: settings.indirect_method,
            indirectPercent: String(settings.indirect_percent),
            indirectMonthlyAmount: String(settings.indirect_monthly_amount),
            indirectMonthlyUnits: String(settings.indirect_monthly_units),
            indirectMonthlyHours: String(settings.indirect_monthly_hours),
          }}
        />

        <BusinessForm
          initial={{ fullName: profile?.full_name ?? '', businessName: business.name }}
          email={user.email ?? ''}
        />

        <Card>
          <CardHeader title="Sua conta" description="Plano e acesso." />
          <CardBody className="space-y-4">
            <dl className="grid gap-3 sm:grid-cols-3">
              <div>
                <dt className="text-xs font-medium text-sand-500">Plano</dt>
                <dd className="mt-0.5 text-sm text-sand-800">
                  {subscription ? (PLANOS[subscription.plan] ?? subscription.plan) : 'Gratuito'}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-sand-500">Situação</dt>
                <dd className="mt-0.5 text-sm text-sand-800">
                  {subscription ? (SITUACOES[subscription.status] ?? subscription.status) : 'ativo'}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-sand-500">Conta criada em</dt>
                <dd className="mt-0.5 text-sm text-sand-800">{formatDate(business.created_at)}</dd>
              </div>
            </dl>

            <div className="border-t border-sand-100 pt-4">
              <SignOutButton />
            </div>
          </CardBody>
        </Card>
      </div>
    </>
  );
}
