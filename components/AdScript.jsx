'use client';

import Script from 'next/script';
import { ADS_CONFIG } from '@/lib/ads';
import { useAuth } from '@/context/AuthContext';

export default function AdScript() {
  const { user, loading } = useAuth();

  const shouldLoadScript = (() => {
    if (!ADS_CONFIG.ENABLED) return false;
    if (loading) return false;
    if (!user) return true;
    if (user.isAdmin || user.isPremium) return false;
    return true;
  })();

  if (!shouldLoadScript) return null;

  const network = ADS_CONFIG.NETWORK;

  // Adsense
  if (network === 'adsense' && ADS_CONFIG.ADSENSE?.CLIENT_ID) {
    return (
      <Script
        id="adsense-script"
        async
        src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADS_CONFIG.ADSENSE.CLIENT_ID}`}
        crossOrigin="anonymous"
        strategy="afterInteractive"
      />
    );
  }

  // Custom network dengan script eksternal
  if (network === 'adsterra' || network === 'custom') {
    const globalScript = ADS_CONFIG.CUSTOM?.SCRIPT_GLOBAL;
    
    if (globalScript?.SRC) {
      // Untuk script eksternal
      return (
        <Script
          id="custom-ad-script"
          src={globalScript.SRC}
          {...globalScript.DATA_ATTRIBUTES}
          strategy="afterInteractive"
          async
        />
      );
    }
    
    if (ADS_CONFIG.CUSTOM?.INLINE_SCRIPT) {
      // Untuk script inline
      return (
        <Script
          id="custom-inline-script"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{ __html: ADS_CONFIG.CUSTOM.INLINE_SCRIPT }}
        />
      );
    }
  }

  return null;
}