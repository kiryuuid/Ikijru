'use client';

import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'app_download_popup_dismissed';
const COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24 jam
const SHOW_DELAY = 3000; // Tampil setelah 3 detik
const AUTO_DISMISS = 15000; // Auto-close setelah 15 detik

export default function AppDownloadPopup() {
  // Sementara dinonaktifkan sesuai permintaan
  return null;

  const dismiss = useCallback((permanent = false) => {
    setClosing(true);
    setTimeout(() => {
      setVisible(false);
      setClosing(false);
      setAnimateIn(false);
      if (permanent) {
        try {
          localStorage.setItem(STORAGE_KEY, Date.now().toString());
        } catch (_) {}
      }
    }, 400);
  }, []);

  useEffect(() => {
    // Jangan tampil jika sudah PWA / standalone
    if (typeof window !== 'undefined') {
      if (window.matchMedia?.('(display-mode: standalone)').matches) return;
      if (window.navigator?.standalone) return;
    }

    // Cek cooldown
    try {
      const dismissed = localStorage.getItem(STORAGE_KEY);
      if (dismissed && Date.now() - parseInt(dismissed, 10) < COOLDOWN_MS) return;
    } catch (_) {}

    const showTimer = setTimeout(() => {
      setVisible(true);
      // Trigger animasi masuk setelah render
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setAnimateIn(true);
        });
      });
    }, SHOW_DELAY);
    return () => clearTimeout(showTimer);
  }, []);

  // Auto-dismiss
  useEffect(() => {
    if (!visible || closing) return;
    const timer = setTimeout(() => dismiss(false), AUTO_DISMISS);
    return () => clearTimeout(timer);
  }, [visible, closing, dismiss]);

  if (!visible) return null;

  return (
    <>
      {/* Global keyframes */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes popupPulseGlow {
          0%, 100% { box-shadow: 0 4px 15px rgba(233, 121, 145, 0.3); }
          50% { box-shadow: 0 4px 25px rgba(233, 121, 145, 0.5); }
        }
      `}} />

      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9999,
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'center',
          pointerEvents: 'none',
        }}
        aria-live="polite"
      >
        {/* Backdrop */}
        <div
          onClick={() => dismiss(false)}
          style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)',
            pointerEvents: 'auto',
            opacity: animateIn && !closing ? 1 : 0,
            transition: 'opacity 0.4s ease',
          }}
        />

        {/* Popup Card */}
        <div
          style={{
            position: 'relative',
            pointerEvents: 'auto',
            width: '100%',
            maxWidth: '420px',
            margin: '0 16px 24px',
            transform: animateIn && !closing ? 'translateY(0)' : 'translateY(100%)',
            opacity: animateIn && !closing ? 1 : 0,
            transition: 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.4s ease',
          }}
        >
          <div
            style={{
              borderRadius: '16px',
              overflow: 'hidden',
              border: '1px solid rgba(255,255,255,0.1)',
              background: 'linear-gradient(135deg, rgba(15, 20, 35, 0.98) 0%, rgba(25, 15, 40, 0.98) 50%, rgba(15, 20, 35, 0.98) 100%)',
              boxShadow: '0 -8px 40px rgba(233, 121, 145, 0.15), 0 4px 30px rgba(0,0,0,0.6)',
            }}
          >
            {/* Glow accent top */}
            <div
              style={{
                height: '2px',
                width: '100%',
                background: 'linear-gradient(90deg, transparent, #e97991, #d881cc, #e97991, transparent)',
              }}
            />

            <div style={{ padding: '20px' }}>
              {/* Header: icon + title + close */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                {/* App Icon */}
                <div
                  style={{
                    flexShrink: 0,
                    width: '56px',
                    height: '56px',
                    borderRadius: '14px',
                    overflow: 'hidden',
                    border: '2px solid rgba(255,255,255,0.1)',
                    boxShadow: '0 4px 15px rgba(233, 121, 145, 0.25)',
                  }}
                >
                  <img
                    src="/icon-192.png"
                    alt="App Icon"
                    width={56}
                    height={56}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  />
                </div>

                {/* Text */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3
                    style={{
                      color: '#ffffff',
                      fontWeight: 700,
                      fontSize: '15px',
                      lineHeight: 1.3,
                      margin: 0,
                      fontFamily: 'var(--font-nunito), Nunito, sans-serif',
                    }}
                  >
                    Download Aplikasi {process.env.NEXT_PUBLIC_SITE_NAME || 'Doujindesu'} 📲
                  </h3>
                  <p
                    style={{
                      color: '#9ca3af',
                      fontSize: '12px',
                      marginTop: '4px',
                      lineHeight: 1.5,
                      fontFamily: 'var(--font-nunito), Nunito, sans-serif',
                    }}
                  >
                    Baca &amp; download doujinshi lebih cepat, fitur lengkap, dan tanpa gangguan iklan!
                  </p>
                </div>

                {/* Close button */}
                <button
                  onClick={() => dismiss(true)}
                  style={{
                    flexShrink: 0,
                    width: '28px',
                    height: '28px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(255,255,255,0.06)',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.12)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.06)'}
                  aria-label="Tutup"
                >
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 14 14"
                    fill="none"
                    stroke="#9ca3af"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  >
                    <path d="M1 1l12 12M13 1L1 13" />
                  </svg>
                </button>
              </div>

              {/* Features chips */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '14px' }}>
                {[
                  { icon: '⚡', text: 'Akses Cepat' },
                  { icon: '📥', text: 'Download Offline' },
                  { icon: '🔔', text: 'Notifikasi Update' },
                ].map((f) => (
                  <span
                    key={f.text}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '10px',
                      fontWeight: 600,
                      padding: '4px 10px',
                      borderRadius: '99px',
                      backgroundColor: 'rgba(255,255,255,0.05)',
                      color: '#d1d5db',
                      border: '1px solid rgba(255,255,255,0.06)',
                      fontFamily: 'var(--font-nunito), Nunito, sans-serif',
                    }}
                  >
                    <span>{f.icon}</span>
                    {f.text}
                  </span>
                ))}
              </div>

              {/* Action buttons */}
              <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
                <button
                  onClick={() => dismiss(true)}
                  style={{
                    flex: 1,
                    padding: '10px 0',
                    fontSize: '12px',
                    fontWeight: 700,
                    borderRadius: '12px',
                    border: '1px solid rgba(255,255,255,0.1)',
                    backgroundColor: 'transparent',
                    color: '#9ca3af',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s',
                    fontFamily: 'var(--font-nunito), Nunito, sans-serif',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  Nanti Saja
                </button>
                <a
                  href="https://sfile.co/dt3OvGUuRF5"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => dismiss(true)}
                  style={{
                    flex: 2,
                    padding: '10px 0',
                    fontSize: '12px',
                    fontWeight: 700,
                    borderRadius: '12px',
                    color: '#ffffff',
                    textAlign: 'center',
                    textDecoration: 'none',
                    background: 'linear-gradient(135deg, #e97991 0%, #d881cc 100%)',
                    boxShadow: '0 4px 15px rgba(233, 121, 145, 0.3)',
                    transition: 'filter 0.2s, transform 0.1s',
                    fontFamily: 'var(--font-nunito), Nunito, sans-serif',
                    animation: 'popupPulseGlow 2s ease-in-out infinite',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.filter = 'brightness(1.1)'}
                  onMouseLeave={(e) => e.currentTarget.style.filter = 'brightness(1)'}
                >
                  Download Sekarang
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}