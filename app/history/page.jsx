import { Suspense } from 'react';
import HistoryList from '@/components/HistoryList';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Riwayat Baca',
  description: 'Semua komik yang pernah kamu baca.',
};

export default function HistoryPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-accent-red/30 border-t-accent-red rounded-full animate-spin" />
      </div>
    }>
      <HistoryList />
    </Suspense>
  );
}
