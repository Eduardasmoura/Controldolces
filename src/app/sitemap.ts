import type { MetadataRoute } from 'next';

import { siteUrl } from '@/lib/supabase/env';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl();
  return [
    { url: base, changeFrequency: 'weekly', priority: 1 },
    { url: `${base}/como-funciona`, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/criar-conta`, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${base}/entrar`, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${base}/suporte`, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${base}/termos`, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${base}/privacidade`, changeFrequency: 'yearly', priority: 0.2 },
  ];
}
