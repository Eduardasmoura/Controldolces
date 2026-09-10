import {
  IconDashboard,
  IconHistory,
  IconIngredients,
  IconPrice,
  IconRecipe,
  IconReports,
  IconSettings,
} from '@/components/ui/icons';

export const NAV_ITEMS = [
  { href: '/painel', label: 'Painel', short: 'Painel', Icon: IconDashboard },
  { href: '/ingredientes', label: 'Ingredientes', short: 'Insumos', Icon: IconIngredients },
  { href: '/produtos', label: 'Receitas', short: 'Receitas', Icon: IconRecipe },
  { href: '/precificar', label: 'Precificar', short: 'Precificar', Icon: IconPrice },
  { href: '/historico', label: 'Histórico', short: 'Histórico', Icon: IconHistory },
  { href: '/relatorios', label: 'Relatórios', short: 'Relatórios', Icon: IconReports },
  { href: '/configuracoes', label: 'Configurações', short: 'Ajustes', Icon: IconSettings },
] as const;

/**
 * Barra inferior do celular.
 *
 * Não é a lateral encolhida: são as quatro ações que uma confeiteira abre no dia
 * a dia, na ordem em que ela pensa — ver o painel, precificar, cuidar dos
 * insumos, cuidar das receitas. Histórico, relatórios e configurações vivem no
 * menu da conta, porque são consulta, não rotina.
 */
const ORDEM_MOBILE = ['/painel', '/precificar', '/ingredientes', '/produtos'] as const;

export const MOBILE_NAV_ITEMS = ORDEM_MOBILE.map(
  (href) => NAV_ITEMS.find((item) => item.href === href)!,
);
