import React from 'react';
import { LayoutList, LayoutGrid, Plus, SlidersHorizontal } from 'lucide-react';
import { WorldWiresLogo } from './WorldWiresLogo';

interface NavbarProps {
  totalCount: number;
  filteredCount: number;
  viewMode: 'list' | 'cards';
  onViewModeChange: (mode: 'list' | 'cards') => void;
  onOpenNewItem: () => void;
  onOpenPositions?: () => void;
  onOpenMaintenance?: () => void;
  onOpenMenu: () => void;
  positionsCount?: number;
  maintenanceCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  totalCount,
  filteredCount,
  viewMode,
  onViewModeChange,
  onOpenNewItem,
  onOpenMenu,
}) => {
  const isFiltered = filteredCount !== totalCount;

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-0 sm:h-20 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        {/* Brand & Stock count */}
        <div className="flex items-center justify-between sm:justify-start gap-3 sm:gap-4">
          <WorldWiresLogo />

          <div className="hidden md:block h-7 w-px bg-slate-200" />

          <div className="hidden sm:block">
            <p className="text-xs text-slate-500 font-medium">
              Raktárkészlet:{' '}
              <strong className="text-slate-800 font-bold tabular-nums text-xs sm:text-sm">{totalCount}</strong> tétel
              {isFiltered && (
                <span className="ml-1 text-teal-700 font-semibold text-xs">
                  (Szűrve: <span className="tabular-nums">{filteredCount}</span>)
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2 sm:gap-2.5 overflow-x-auto pb-0.5 sm:pb-0 w-full sm:w-auto justify-start sm:justify-end">
          {/* View toggle */}
          <div className="inline-flex rounded-xl border border-slate-200 bg-slate-50 p-0.5 sm:p-1 shrink-0">
            <button
              type="button"
              onClick={() => onViewModeChange('list')}
              className={`flex items-center gap-1 px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-bold rounded-lg transition-colors cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LayoutList className="w-4 h-4" />
              <span>Lista</span>
            </button>
            <button
              type="button"
              onClick={() => onViewModeChange('cards')}
              className={`flex items-center gap-1 px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-bold rounded-lg transition-colors cursor-pointer ${
                viewMode === 'cards'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
              <span>Kártyák</span>
            </button>
          </div>

          {/* New Item */}
          <button
            type="button"
            onClick={onOpenNewItem}
            className="flex items-center gap-1.5 px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors cursor-pointer shrink-0 whitespace-nowrap"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Új Tétel</span>
          </button>

          {/* Menu Button */}
          <button
            type="button"
            onClick={onOpenMenu}
            className="flex items-center gap-1.5 px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-bold text-slate-800 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl shadow-2xs transition-colors cursor-pointer shrink-0 whitespace-nowrap"
          >
            <SlidersHorizontal className="w-4 h-4 text-slate-600" />
            <span>Menü</span>
          </button>
        </div>
      </div>
    </header>
  );
};
