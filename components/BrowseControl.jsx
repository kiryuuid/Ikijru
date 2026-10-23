'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Filter, Grid, List, X } from 'lucide-react';
import MangaCard from './MangaCard';
import MangaListItem from './MangaListItem';

const TYPES = ['', 'manga', 'manhwa', 'doujinshi'];
const STATUSES = ['', 'Publishing', 'Finished'];
const ORDERS = [
  { value: 'latest', label: 'Update' },
  { value: 'popular', label: 'Populer' },
  { value: 'az', label: 'A-Z' },
  { value: 'za', label: 'Z-A' },
];

export default function BrowseControl({ genres, totalItems, q, mangas, currentFilters = {} }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const totalCount = Number(totalItems) || 0;
  const formattedTotalCount = new Intl.NumberFormat('id-ID').format(totalCount);

  const [viewMode, setViewMode] = useState('grid');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const [localFilter, setLocalFilter] = useState({
    type: currentFilters.type || searchParams.get('type') || '',
    status: currentFilters.status || searchParams.get('status') || '',
    genre: currentFilters.genre || searchParams.get('genre') || '',
    order: currentFilters.order || searchParams.get('order') || 'latest',
  });

  useEffect(() => {
    setLocalFilter({
      type: searchParams.get('type') || '',
      status: searchParams.get('status') || '',
      genre: searchParams.get('genre') || '',
      order: searchParams.get('order') || 'latest',
    });
  }, [searchParams]);

  const handleSelect = (key, value) => {
    setLocalFilter(prev => ({ ...prev, [key]: value }));
  };

  const applyFilter = () => {
    const p = new URLSearchParams();
    const qVal = searchParams.get('q');
    if (qVal) p.set('q', qVal);
    if (localFilter.type) p.set('type', localFilter.type);
    if (localFilter.status) p.set('status', localFilter.status);
    if (localFilter.genre) p.set('genre', localFilter.genre);
    if (localFilter.order) p.set('order', localFilter.order);
    router.push(`/manga?${p.toString()}`);
    setIsFilterOpen(false);
  };

  const clearFilter = () => {
    setLocalFilter({ type: '', status: '', genre: '', order: 'latest' });
  };

  const activeFilterCount = [
    localFilter.type,
    localFilter.status,
    localFilter.genre,
    localFilter.order && localFilter.order !== 'latest' ? localFilter.order : '',
  ].filter(Boolean).length;

  const OptionButton = ({ label, isActive, onClick }) => (
    <button
      onClick={onClick}
      className={`max-w-full px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap ${isActive
          ? 'bg-accent-red border-accent-red text-white'
          : 'bg-transparent border-border text-text-muted hover:border-accent-red hover:text-text-primary'
        }`}
    >
      {label}
    </button>
  );

  return (
    <>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div className="min-w-0">
          <h1 className="font-display text-2xl md:text-3xl text-text-primary tracking-wide mb-1 break-words">
            {q ? (
              <span>Hasil: <span className="text-accent-red">"{q}"</span></span>
            ) : localFilter.genre ? (
              <span>Genre: <span className="text-accent-red">{localFilter.genre}</span></span>
            ) : localFilter.type ? (
              <span className="capitalize">{localFilter.type}</span>
            ) : (
              'Daftar Komik'
            )}
          </h1>
          <p className="text-text-muted text-xs md:text-sm">
            {totalCount > 0
              ? `Menampilkan ${formattedTotalCount} judul komik`
              : 'Tidak ada judul ditemukan'}
          </p>
        </div>

        <div className="flex w-full md:w-auto items-center justify-between md:justify-end gap-2 md:gap-3">
          {/* Toggle View */}
          <div className="flex items-center bg-bg-elevated rounded-lg p-1 border border-border shrink-0">
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md transition-all ${viewMode === 'list' ? 'bg-accent-red text-white' : 'text-text-muted hover:text-text-primary'}`}
            >
              <List size={18} />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md transition-all ${viewMode === 'grid' ? 'bg-accent-red text-white' : 'text-text-muted hover:text-text-primary'}`}
            >
              <Grid size={18} />
            </button>
          </div>

          <button
            onClick={() => setIsFilterOpen(true)}
            className="relative flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-bg-elevated border border-border rounded-lg text-text-secondary hover:border-accent-red hover:text-accent-red transition-all min-w-[120px]"
          >
            <Filter size={18} />
            <span className="text-sm font-bold">Filter</span>
            {activeFilterCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-accent-red text-white text-[10px] font-bold flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Active Filter Badges */}
      {activeFilterCount > 0 && (
        <div className="flex items-center gap-2 flex-wrap mb-5">
          <span className="text-xs text-text-muted">Filter aktif:</span>
          {localFilter.type && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-accent-red/10 text-accent-red text-xs font-bold border border-accent-red/20">
              Tipe: {localFilter.type}
              <button type="button" onClick={() => { handleSelect('type', ''); applyFilter(); }} className="hover:text-text-primary text-sm font-bold">&times;</button>
            </span>
          )}
          {localFilter.status && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-accent-red/10 text-accent-red text-xs font-bold border border-accent-red/20">
              Status: {localFilter.status}
              <button type="button" onClick={() => { handleSelect('status', ''); applyFilter(); }} className="hover:text-text-primary text-sm font-bold">&times;</button>
            </span>
          )}
          {localFilter.genre && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-accent-red/10 text-accent-red text-xs font-bold border border-accent-red/20">
              Genre: {localFilter.genre}
              <button type="button" onClick={() => { handleSelect('genre', ''); applyFilter(); }} className="hover:text-text-primary text-sm font-bold">&times;</button>
            </span>
          )}
          {localFilter.order && localFilter.order !== 'latest' && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-accent-red/10 text-accent-red text-xs font-bold border border-accent-red/20">
              Urutan: {ORDERS.find(o => o.value === localFilter.order)?.label || localFilter.order}
              <button type="button" onClick={() => { handleSelect('order', 'latest'); applyFilter(); }} className="hover:text-text-primary text-sm font-bold">&times;</button>
            </span>
          )}
          <button type="button" onClick={clearFilter} className="text-xs text-text-muted hover:text-accent-red underline ml-1">
            Reset
          </button>
        </div>
      )}

      {/* Content */}
      {mangas.length > 0 ? (
        viewMode === 'grid' ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 md:gap-5">
            {mangas.map((manga) => (
              <MangaCard key={manga._id || manga.slug} manga={manga} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
            {mangas.map((manga) => (
              <MangaListItem key={manga._id || manga.slug} manga={manga} />
            ))}
          </div>
        )
      ) : (
        <div className="flex flex-col items-center justify-center py-24 text-center px-4 border-2 border-dashed border-border rounded-3xl bg-bg-elevated/30">
          <div className="w-16 h-16 bg-bg-elevated rounded-full flex items-center justify-center mb-4">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-7 h-7 text-text-muted">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </div>
          <h3 className="font-display text-lg text-text-primary tracking-wide mb-1">Tidak ada komik ditemukan</h3>
          <p className="text-text-muted text-sm max-w-xs mx-auto">Coba kurangi filter atau gunakan kata kunci lain.</p>
        </div>
      )}

      {/* Filter Modal */}
      {isFilterOpen && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsFilterOpen(false)} />
          <div className="relative w-full sm:max-w-lg bg-bg-card border border-border sm:rounded-2xl rounded-t-2xl shadow-2xl flex flex-col h-[88vh] sm:h-auto sm:max-h-[85vh]">
            <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-border">
              <h2 className="text-lg font-bold text-text-primary">Filter Komik</h2>
              <button onClick={() => setIsFilterOpen(false)} className="text-text-muted hover:text-accent-red">
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-5 space-y-6">
              {/* Urutan */}
              <div>
                <h3 className="text-sm font-bold text-text-primary mb-3">Urutan</h3>
                <div className="flex flex-wrap gap-2">
                  {ORDERS.map((o) => (
                    <OptionButton
                      key={o.value}
                      label={o.label}
                      isActive={localFilter.order === o.value}
                      onClick={() => handleSelect('order', o.value)}
                    />
                  ))}
                </div>
              </div>

              {/* Tipe */}
              <div>
                <h3 className="text-sm font-bold text-text-primary mb-3">Tipe</h3>
                <div className="flex flex-wrap gap-2">
                  {TYPES.map((t) => (
                    <OptionButton
                      key={t || 'all'}
                      label={t ? t.charAt(0).toUpperCase() + t.slice(1) : 'Semua'}
                      isActive={localFilter.type === t}
                      onClick={() => handleSelect('type', t)}
                    />
                  ))}
                </div>
              </div>

              {/* Status */}
              <div>
                <h3 className="text-sm font-bold text-text-primary mb-3">Status</h3>
                <div className="flex flex-wrap gap-2">
                  {STATUSES.map((s) => (
                    <OptionButton
                      key={s || 'all'}
                      label={s ? (s === 'Publishing' ? 'ONG' : 'END') : 'Semua'}
                      isActive={localFilter.status === s}
                      onClick={() => handleSelect('status', s)}
                    />
                  ))}
                </div>
              </div>

              {/* Genre */}
              {genres?.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold text-text-primary mb-3">Genre</h3>
                  <div className="flex flex-wrap gap-2 overflow-hidden">
                    <OptionButton
                      label="Semua"
                      isActive={localFilter.genre === ''}
                      onClick={() => handleSelect('genre', '')}
                    />
                    {genres.map((g) => (
                      <OptionButton
                        key={g.name}
                        label={`${g.name} (${g.count})`}
                        isActive={localFilter.genre === g.name}
                        onClick={() => handleSelect('genre', g.name)}
                      />
                    ))}
                  </div>
                </div>
              )}

            </div>

            <div className="p-4 border-t border-border bg-bg-card sm:rounded-b-2xl flex gap-3">
              <button
                onClick={clearFilter}
                className="flex-1 py-3 rounded-xl border border-border text-text-primary font-bold text-sm hover:bg-bg-elevated"
              >
                Reset
              </button>
              <button
                onClick={applyFilter}
                className="flex-1 py-3 rounded-xl bg-accent-red text-white font-bold text-sm hover:bg-accent-redDark shadow-lg"
              >
                Terapkan
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
