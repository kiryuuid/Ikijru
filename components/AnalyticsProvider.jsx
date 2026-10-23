'use client';
import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { trackPageView } from '@/lib/analytics';

/**
 * Otomatis kirim page_view event setiap kali route berubah.
 * Taruh di dalam layout, setelah AuthProvider.
 */
export default function AnalyticsProvider({ children }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const url = pathname + (searchParams.toString() ? `?${searchParams.toString()}` : '');
    trackPageView(document.title || pathname, url);
  }, [pathname, searchParams]);

  return children;
}
