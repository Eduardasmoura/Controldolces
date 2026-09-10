import type { Metadata, Viewport } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';

import './globals.css';
import { siteUrl } from '@/lib/supabase/env';

/**
 * Uma família só, em vários pesos.
 *
 * Plus Jakarta Sans tem a geometria aberta que dá clareza no celular e peso
 * suficiente (200 a 800) para os títulos terem presença sem precisar de uma
 * segunda fonte. O contraste entre título e texto vem do peso e do espaçamento
 * entre letras, não de uma troca de família.
 */
const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
  weight: ['300', '400', '500', '600', '700', '800'],
});

const title = 'ControlDolces — saiba quanto custa e quanto cobrar pelos seus doces';
const description =
  'Calculadora de precificação para confeiteiras: cadastre ingredientes, monte a ficha técnica, inclua embalagem, mão de obra, gás e energia, e descubra o custo real, o preço mínimo e o preço recomendado de cada produto.';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: {
    default: title,
    template: '%s · ControlDolces',
  },
  description,
  applicationName: 'ControlDolces',
  keywords: [
    'precificação para confeiteiras',
    'como precificar doces',
    'calcular custo de receita',
    'planilha de precificação confeitaria',
    'margem de lucro doces',
    'ficha técnica confeitaria',
  ],
  authors: [{ name: 'ControlDolces' }],
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    url: siteUrl(),
    siteName: 'ControlDolces',
    title,
    description,
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
  },
  icons: {
    icon: [{ url: '/icon.svg', type: 'image/svg+xml' }],
    apple: '/icon.svg',
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: '#FDFBF8',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={jakarta.variable}>
      <body className="min-h-dvh font-sans">{children}</body>
    </html>
  );
}
