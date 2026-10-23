'use client';

import { useEffect, useRef } from 'react';

// Turnstile Widget ID yang akan dipakai tiap instance
let turnstileScriptLoaded = false;

function loadTurnstileScript() {
  if (turnstileScriptLoaded || document.getElementById('cf-turnstile-script')) {
    turnstileScriptLoaded = true;
    return;
  }
  const script = document.createElement('script');
  script.id = 'cf-turnstile-script';
  script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
  script.async = true;
  script.defer = true;
  document.head.appendChild(script);
  turnstileScriptLoaded = true;
}

/**
 * TurnstileWidget — widget invisible/managed Cloudflare Turnstile
 *
 * Props:
 *   onVerify(token): dipanggil saat user terverifikasi
 *   onError(): dipanggil saat gagal
 *   onExpire(): dipanggil saat token expired
 */
export function TurnstileWidget({ onVerify, onError, onExpire }) {
  const containerRef = useRef(null);
  const widgetIdRef = useRef(null);

  useEffect(() => {
    loadTurnstileScript();

    const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
    if (!siteKey) {
      console.error('NEXT_PUBLIC_TURNSTILE_SITE_KEY tidak diset di .env.local');
      return;
    }

    const tryRender = () => {
      if (!window.turnstile || !containerRef.current) return;

      // Hindari render ganda
      if (widgetIdRef.current !== null) return;

      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: siteKey,
        callback: (token) => { onVerify?.(token); },
        'error-callback': () => { onError?.(); },
        'expired-callback': () => {
          onExpire?.();
          // Auto-reset saat expired
          if (widgetIdRef.current !== null) {
            window.turnstile.reset(widgetIdRef.current);
          }
        },
        theme: 'dark',
        size: 'normal',
      });
    };

    // Coba render langsung, atau tunggu script selesai load
    if (window.turnstile) {
      tryRender();
    } else {
      const interval = setInterval(() => {
        if (window.turnstile) {
          clearInterval(interval);
          tryRender();
        }
      }, 100);
      return () => clearInterval(interval);
    }
  }, [onVerify, onError, onExpire]);

  useEffect(() => {
    return () => {
      if (widgetIdRef.current !== null && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
  }, []);

  return <div ref={containerRef} />;
}

/**
 * CaptchaWrapper — wrapper kosong (kompatibilitas mundur).
 * Turnstile tidak butuh Provider seperti reCaptcha v3.
 */
export default function CaptchaWrapper({ children }) {
  return <>{children}</>;
}
