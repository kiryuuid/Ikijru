import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { Suspense } from 'react';
import Script from 'next/script';
import AnalyticsProvider from '@/components/AnalyticsProvider';
import AdScript from '@/components/AdScript';
import AdBanner from '@/components/AdBanner';
import ThemeProvider from '@/components/ThemeProvider';
import AppDownloadPopup from '@/components/AppDownloadPopup';


const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME || 'Doujindesu';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://doujindesu.web.id';
const SITE_DESC = `UPDATE Doujinshi setiap hari hanya di ${SITE_NAME}. Doujinshi disini bermuatan konten dewasa, jadi sesuaikanlah dengan bijak antara bacaan anda dengan umur anda. Semua doujin disini hanya fiktif belaka.`;

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} - Baca & Download Doujinshi Bahasa Indonesia`,
    template: `%s - ${SITE_NAME}`,
  },
  description: SITE_DESC,
  keywords: [`${SITE_NAME} 02`, `manga ${SITE_NAME}`, 'kiriyuu manhwa', 'kiriyuu manhua', 'baca komik', 'baca manga gratis', 'komik online'],
  authors: [{ name: SITE_NAME }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  openGraph: {
    type: 'website',
    locale: 'id_ID',
    url: SITE_URL,
    siteName: SITE_NAME,
    title: `${SITE_NAME} - Baca & Download Doujinshi Bahasa Indonesia`,
    description: SITE_DESC,
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: SITE_NAME }],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${SITE_NAME} - Baca & Download Doujinshi Bahasa Indonesia`,
    description: SITE_DESC,
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-video-preview': -1, 'max-image-preview': 'large', 'max-snippet': -1 },
  },
  alternates: { canonical: SITE_URL },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#080c14',
};

export default function RootLayout({ children }) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Nunito:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content={SITE_NAME} />

        {/* Pindahkan script JSON-LD ke sini (ini aman di head) */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebSite',
              name: SITE_NAME,
              url: SITE_URL,
              description: SITE_DESC,
              potentialAction: {
                '@type': 'SearchAction',
                target: { '@type': 'EntryPoint', urlTemplate: `${SITE_URL}/manga?q={search_term_string}` },
                'query-input': 'required name=search_term_string',
              },
            }),
          }}
        />
      </head>
      <body className="bg-bg-primary text-text-primary font-body antialiased">
        <Script
          id="histats"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: ``,
          }}
        />

        <Script
          src="https://analytics.ahrefs.com/analytics.js"
          data-key=""
          strategy="afterInteractive"
        />
        <ThemeProvider>
          <AuthProvider>
            {/* AdScript harus di dalam AuthProvider agar bisa cek status user */}
            <AdScript />

            <Suspense fallback={null}>
              <AnalyticsProvider>
                {children}
              </AnalyticsProvider>
            </Suspense>

            {/* Sticky bottom ad — harus di dalam AuthProvider agar tidak tampil untuk admin/premium */}
            <AdBanner slot="STICKY_BOTTOM" sticky />
          </AuthProvider>
          {/* Popup download aplikasi dinonaktifkan sementara */}
          {/* <AppDownloadPopup /> */}
        </ThemeProvider>
      </body>
    </html>
  );
}