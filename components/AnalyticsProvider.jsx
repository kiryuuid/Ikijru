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
    
    // Beri jeda singkat agar Next.js selesai memperbarui <title> di dokumen
    const timer = setTimeout(() => {
      trackPageView(document.title || pathname, url);
    }, 150);

    return () => clearTimeout(timer);
  }, [pathname, searchParams]);

  return children;
}
