'use client';

import { useEffect, useRef } from 'react';
import { ADS_CONFIG } from '@/lib/ads';
import { useAuth } from '@/context/AuthContext';

export default function AdBanner({ slot, className = '', sticky = false }) {
  const { user, loading } = useAuth();
  const adRef = useRef(null);
  const pushed = useRef(false);

  const network = ADS_CONFIG.NETWORK;
  const isAdSense = network === 'adsense';
  const slotId = ADS_CONFIG.ADSENSE?.SLOTS?.[slot] || '';
  const customHtml = ADS_CONFIG.CUSTOM?.SLOTS?.[slot] || '';

  const shouldShowAds = (() => {
    if (!ADS_CONFIG.ENABLED) return false;
    if (loading) return false;
    if (!user) return true;
    if (user.isAdmin || user.isPremium) return false;
    return true;
  })();

  useEffect(() => {
    if (!shouldShowAds || !isAdSense || pushed.current) return;
    
    // Delay push adsbygoogle untuk memastikan script sudah load
    const timer = setTimeout(() => {
      try {
        if (window.adsbygoogle) {
          (window.adsbygoogle = window.adsbygoogle || []).push({});
          pushed.current = true;
        }
      } catch (_) {}
    }, 100);

    return () => clearTimeout(timer);
  }, [shouldShowAds, isAdSense]);

  if (!shouldShowAds) return null;
  
  // Untuk custom network, pastikan ada HTML
  if (!isAdSense && !customHtml) return null;
  
  // Untuk adsense, pastikan ada slotId
  if (isAdSense && !slotId) return null;

  const stickyClass = sticky
    ? 'fixed bottom-0 left-0 right-0 z-50 flex justify-center bg-bg-primary/80 backdrop-blur-sm border-t border-border py-1'
    : '';

  if (isAdSense) {
    return (
      <div className={`ad-banner overflow-hidden text-center ${stickyClass} ${className}`}>
        <ins
          ref={adRef}
          className="adsbygoogle"
          style={{ display: 'block' }}
          data-ad-client={ADS_CONFIG.ADSENSE.CLIENT_ID}
          data-ad-slot={slotId}
          data-ad-format="auto"
          data-full-width-responsive="true"
        />
      </div>
    );
  }

  // Untuk custom HTML banner (tanpa script)
  return (
    <div
      className={`ad-banner overflow-hidden text-center ${stickyClass} ${className}`}
      dangerouslySetInnerHTML={{ __html: customHtml }}
    />
  );
}