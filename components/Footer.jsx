import Link from 'next/link';

export default function Footer({ className = '' }) {
  const currentYear = new Date().getFullYear();
  const siteName = process.env.NEXT_PUBLIC_SITE_NAME || 'Pojokmanga';

  return (
    <footer className={`border-t border-border mt-8 md:mt-12 py-6 md:py-8 bg-bg-secondary/40 ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-3 text-center md:text-left">
        <p className="text-text-muted text-xs">
          © {currentYear} <span className="font-bold text-text-secondary">{siteName}</span> · Baca & Download Komik Bahasa Indonesia
        </p>
        <div className="flex justify-center items-center gap-4 flex-wrap">
          <Link
            href="/privacy-policy"
            className="text-xs text-text-secondary hover:text-accent-red transition-colors"
          >
            Privacy Policy
          </Link>
          <span className="text-text-muted text-xs">·</span>
          <Link
            href="/terms"
            className="text-xs text-text-secondary hover:text-accent-red transition-colors"
          >
            Terms of Service
          </Link>
          <span className="text-text-muted text-xs">·</span>
          <Link
            href="/changelog"
            className="text-xs text-text-secondary hover:text-accent-red transition-colors"
          >
            Changelog
          </Link>
        </div>
      </div>
    </footer>
  );
}
