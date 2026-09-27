import React, { useState } from 'react';
import { InventoryItem } from '../types/inventory';
import { naturalCompare } from '../utils/naturalSort';
import {
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Filter,
  ArrowDownUp,
  Smartphone,
  Table as TableIcon
} from 'lucide-react';

export type SortField = 'id' | 'name' | 'factoryCode' | 'category' | 'manufacturer';

export interface ItemTableViewProps {
  items: InventoryItem[];
  onSelectItem: (item: InventoryItem) => void;
  onSelectCategory?: (category: string) => void;
  onSelectManufacturer?: (manufacturer: string) => void;
  sortField?: SortField;
  sortAsc?: boolean;
  onSortChange?: (field: SortField) => void;
}

export const ItemTableView: React.FC<ItemTableViewProps> = ({
  items,
  onSelectItem,
  onSelectCategory,
  onSelectManufacturer,
  sortField,
  sortAsc,
  onSortChange,
}) => {
  const [localSortField, setLocalSortField] = useState<SortField>('id');
  const [localSortAsc, setLocalSortAsc] = useState<boolean>(true);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(50);
  const [mobileDisplayMode, setMobileDisplayMode] = useState<'cards' | 'table'>('cards');

  const activeSortField = sortField !== undefined ? sortField : localSortField;
  const activeSortAsc = sortAsc !== undefined ? sortAsc : localSortAsc;

  const handleSort = (field: SortField) => {
    setCurrentPage(1);
    if (onSortChange) {
      onSortChange(field);
    } else {
      if (localSortField === field) {
        setLocalSortAsc(!localSortAsc);
      } else {
        setLocalSortField(field);
        setLocalSortAsc(true);
      }
    }
  };

  // Natural Alphanumeric Sort (1, 2, ... 9, 10, ... 99, 100)
  const sortedItems = [...items].sort((a, b) => {
    const valA = (a[activeSortField] as string | undefined) || '';
    const valB = (b[activeSortField] as string | undefined) || '';
    const comparison = naturalCompare(valA, valB);
    return activeSortAsc ? comparison : -comparison;
  });

  const totalPages = Math.ceil(sortedItems.length / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedItems = sortedItems.slice(startIndex, startIndex + pageSize);

  const getSortLabel = (field: SortField) => {
    switch (field) {
      case 'id':
        return 'Termék ID';
      case 'name':
        return 'Név';
      case 'factoryCode':
        return 'Gyári kód';
      case 'category':
        return 'Kategória';
      case 'manufacturer':
        return 'Gyártó';
    }
  };

  const renderSortIcon = (field: SortField) => {
    if (activeSortField !== field) {
      return <ArrowUpDown className="w-4 h-4 text-slate-300 group-hover:text-slate-500 inline ml-1.5" />;
    }
    return activeSortAsc ? (
      <ArrowUp className="w-4 h-4 text-blue-600 inline ml-1.5" />
    ) : (
      <ArrowDown className="w-4 h-4 text-blue-600 inline ml-1.5" />
    );
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Mobile Top Bar: Sort selector & Mobile mode toggle */}
      <div className="p-3.5 bg-slate-50/80 border-b border-slate-200 flex flex-col gap-2.5 sm:hidden">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
            <ArrowDownUp className="w-4 h-4 text-blue-600" />
            <span>Rendezés ({getSortLabel(activeSortField)} {activeSortAsc ? 'növekvő: 1→100' : 'csökkenő: 100→1'}):</span>
          </div>

          {/* Toggle between mobile compact card list and swipeable table */}
          <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5 text-xs">
            <button
              type="button"
              onClick={() => setMobileDisplayMode('cards')}
              className={`px-2 py-1 rounded flex items-center gap-1 font-bold ${
                mobileDisplayMode === 'cards'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Kártyák</span>
            </button>
            <button
              type="button"
              onClick={() => setMobileDisplayMode('table')}
              className={`px-2 py-1 rounded flex items-center gap-1 font-bold ${
                mobileDisplayMode === 'table'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span>Táblázat</span>
            </button>
          </div>
        </div>

        {/* Mobile Quick Sort Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          {(['id', 'name', 'factoryCode', 'category', 'manufacturer'] as SortField[]).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => handleSort(f)}
              className={`px-3 py-1.5 rounded-lg border font-bold whitespace-nowrap transition-colors flex items-center gap-1 shrink-0 ${
                activeSortField === f
                  ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <span>{getSortLabel(f)}</span>
              {activeSortField === f && (
                activeSortAsc ? <ArrowUp className="w-3.5 h-3.5 stroke-[2.5]" /> : <ArrowDown className="w-3.5 h-3.5 stroke-[2.5]" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Mobile Card-List Layout (when mobile and mode is cards) */}
      <div className={`${mobileDisplayMode === 'cards' ? 'block sm:hidden' : 'hidden'} divide-y divide-slate-100`}>
        {paginatedItems.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-base">
            Nincs megjeleníthető tétel a megadott szűrési feltételekkel.
          </div>
        ) : (
          paginatedItems.map((item) => (
            <div
              key={item.id}
              className="p-4 hover:bg-blue-50/30 transition-colors"
            >
              {/* Product ID and Name */}
              <div className="flex items-start justify-between gap-3 mb-2.5">
                <button
                  type="button"
                  onClick={() => onSelectItem(item)}
                  className="text-left group flex-1"
                >
                  <span className="font-mono text-base sm:text-lg font-black text-blue-600 group-hover:text-blue-800 transition-colors">
                    {item.id}
                  </span>
                  <div className="text-base sm:text-lg font-extrabold text-slate-900 group-hover:text-blue-600 transition-colors mt-0.5">
                    {item.name}
                  </div>
                </button>
                {item.factoryCode && item.factoryCode !== '-' && (
                  <span className="text-xs font-mono font-bold text-slate-600 bg-slate-100 border border-slate-200 px-2 py-1 rounded-md shrink-0">
                    {item.factoryCode}
                  </span>
                )}
              </div>

              {/* Category and Manufacturer interactive badges */}
              <div className="flex flex-wrap items-center gap-2 pt-1 text-xs sm:text-sm">
                {item.category && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectCategory?.(item.category);
                    }}
                    className="inline-flex items-center font-bold text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                    title={`Szűrés a(z) ${item.category} kategóriára`}
                  >
                    <span>{item.category}</span>
                  </button>
                )}

                {item.manufacturer && item.manufacturer !== '-' && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectManufacturer?.(item.manufacturer);
                    }}
                    className="inline-flex items-center font-bold text-blue-800 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                    title={`Szűrés a(z) ${item.manufacturer} gyártóra`}
                  >
                    <span>{item.manufacturer}</span>
                  </button>
                )}

                {item.location && (
                  <span className="text-xs text-slate-600 ml-auto font-semibold">
                    📍 {item.location}
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop & Tablet Table (and mobile when table mode is chosen) */}
      <div className={`${mobileDisplayMode === 'table' ? 'block' : 'hidden sm:block'} overflow-x-auto`}>
        <table className="w-full text-left border-collapse min-w-[620px]">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/80 text-xs sm:text-sm font-bold tracking-wider text-slate-700 uppercase select-none">
              <th
                onClick={() => handleSort('id')}
                className="py-4 px-4 sm:px-6 cursor-pointer hover:bg-slate-100 transition-colors group"
                title="Rendezés Termék ID szerint (1, 2, ... 9, 10, ... 100)"
              >
                <span>TERMÉK ID</span>
                {renderSortIcon('id')}
              </th>
              <th
                onClick={() => handleSort('name')}
                className="py-4 px-4 sm:px-6 cursor-pointer hover:bg-slate-100 transition-colors group"
                title="Rendezés Termék Név szerint (1, 2, ... 9, 10, ... 100)"
              >
                <span>TERMÉK NÉV</span>
                {renderSortIcon('name')}
              </th>
              <th
                onClick={() => handleSort('factoryCode')}
                className="py-4 px-4 sm:px-6 cursor-pointer hover:bg-slate-100 transition-colors group"
                title="Rendezés Gyári Kód szerint"
              >
                <span>GYÁRI KÓD</span>
                {renderSortIcon('factoryCode')}
              </th>
              <th
                onClick={() => handleSort('category')}
                className="py-4 px-4 sm:px-6 cursor-pointer hover:bg-slate-100 transition-colors group text-teal-700"
                title="Rendezés Kategória szerint"
              >
                <span>KATEGÓRIA</span>
                {renderSortIcon('category')}
              </th>
              <th
                onClick={() => handleSort('manufacturer')}
                className="py-4 px-4 sm:px-6 cursor-pointer hover:bg-slate-100 transition-colors group text-blue-700"
                title="Rendezés Gyártó szerint"
              >
                <span>GYÁRTÓ</span>
                {renderSortIcon('manufacturer')}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm sm:text-base text-slate-800">
            {paginatedItems.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-16 text-center text-slate-400 text-base">
                  Nincs megjeleníthető tétel a megadott szűrési feltételekkel.
                </td>
              </tr>
            ) : (
              paginatedItems.map((item) => (
                <tr
                  key={item.id}
                  className="hover:bg-blue-50/50 transition-colors group"
                >
                  {/* Termék ID - clicking opens the product */}
                  <td className="py-4 px-4 sm:px-6 font-mono font-black text-base sm:text-lg text-blue-600 group-hover:text-blue-800">
                    <button
                      type="button"
                      onClick={() => onSelectItem(item)}
                      className="text-left font-mono font-bold text-base sm:text-lg hover:text-blue-800 hover:bg-blue-100/70 px-2 py-1 -ml-2 rounded-lg transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-400"
                      title="Kattints a termék adatlapjának megnyitásához"
                    >
                      {item.id}
                    </button>
                  </td>

                  {/* Termék név - also opens the product */}
                  <td className="py-4 px-4 sm:px-6 font-bold text-base sm:text-lg text-slate-900">
                    <button
                      type="button"
                      onClick={() => onSelectItem(item)}
                      className="text-left font-bold text-base sm:text-lg hover:text-blue-600 cursor-pointer focus:outline-none transition-colors"
                    >
                      {item.name}
                    </button>
                  </td>

                  {/* Gyári kód */}
                  <td className="py-4 px-4 sm:px-6 font-mono text-sm sm:text-base text-slate-600">
                    {item.factoryCode || '-'}
                  </td>

                  {/* Kategória - clicking filters by this category */}
                  <td className="py-4 px-4 sm:px-6">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectCategory?.(item.category);
                      }}
                      className="text-left font-bold text-sm sm:text-base text-teal-700 hover:text-teal-900 hover:bg-teal-50 px-2 py-1 -ml-2 rounded-lg transition-colors cursor-pointer"
                      title={`Szűrés erre a kategóriára: ${item.category}`}
                    >
                      <span>{item.category}</span>
                    </button>
                  </td>

                  {/* Gyártó - clicking filters by this manufacturer */}
                  <td className="py-4 px-4 sm:px-6">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectManufacturer?.(item.manufacturer);
                      }}
                      className="text-left font-bold text-sm sm:text-base text-blue-700 hover:text-blue-900 hover:bg-blue-50 px-2 py-1 -ml-2 rounded-lg transition-colors cursor-pointer"
                      title={`Szűrés erre a gyártóra: ${item.manufacturer}`}
                    >
                      <span>{item.manufacturer}</span>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {sortedItems.length > 0 && (
        <div className="py-3.5 px-4 sm:px-6 border-t border-slate-100 bg-slate-50/70 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs sm:text-sm text-slate-600">
          <div className="flex items-center gap-2">
            <span className="font-medium">Oldalméret:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs sm:text-sm text-slate-800 font-bold focus:outline-none focus:border-blue-500"
            >
              <option value={25}>25 sor</option>
              <option value={50}>50 sor</option>
              <option value={100}>100 sor</option>
              <option value={200}>200 sor</option>
            </select>
            <span className="text-slate-400 tabular-nums">
              ({startIndex + 1} - {Math.min(startIndex + pageSize, sortedItems.length)} / {sortedItems.length})
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              className="p-2 border border-slate-200 rounded-lg hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none text-slate-700 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 font-bold text-slate-800 tabular-nums">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              className="p-2 border border-slate-200 rounded-lg hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none text-slate-700 cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
