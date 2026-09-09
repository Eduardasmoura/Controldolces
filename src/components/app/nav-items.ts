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

/** No celular a barra inferior mostra só o essencial; o resto vive no menu. */
export const MOBILE_NAV_ITEMS = NAV_ITEMS.filter((item) =>
  ['/painel', '/ingredientes', '/produtos', '/precificar'].includes(item.href),
);
