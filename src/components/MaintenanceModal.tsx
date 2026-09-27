import React, { useState, useMemo } from 'react';
import {
  X,
  Wrench,
  Search,
  Filter,
  Calendar,
  Layers,
  FileText,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ArrowRight,
  ArrowUpDown,
  Download,
  Plus
} from 'lucide-react';
import { MaintenanceRecord, InventoryItem } from '../types/inventory';
import { naturalCompare } from '../utils/naturalSort';

interface MaintenanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  maintenanceRecords: MaintenanceRecord[];
  items: InventoryItem[];
  onSelectRecordItem: (itemId: string) => void;
}

export const MaintenanceModal: React.FC<MaintenanceModalProps> = ({
  isOpen,
  onClose,
  maintenanceRecords,
  items,
  onSelectRecordItem,
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pass' | 'repair' | 'fail'>('all');
  const [sortField, setSortField] = useState<'date' | 'itemId' | 'status'>('date');
  const [sortAsc, setSortAsc] = useState(false); // newest date first by default

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(30);

  if (!isOpen) return null;

  // Item map for quick lookup of names
  const itemMap = new Map<string, InventoryItem>();
  for (const it of items) {
    itemMap.set(it.id.toLowerCase(), it);
    if (it.factoryCode) itemMap.set(it.factoryCode.toLowerCase(), it);
  }

  const filteredRecords = maintenanceRecords.filter((rec) => {
    const q = search.toLowerCase().trim();
    if (q) {
      const matchId = rec.itemId.toLowerCase().includes(q);
      const matchDesc = (rec.description || '').toLowerCase().includes(q);
      const matchChange = (rec.changeItem || '').toLowerCase().includes(q);
      const matchStatus = (rec.status || '').toLowerCase().includes(q);
      const matchDate = (rec.date || '').toLowerCase().includes(q);
      const item = itemMap.get(rec.itemId.toLowerCase());
      const matchItemName = item?.name ? item.name.toLowerCase().includes(q) : false;

      if (!matchId && !matchDesc && !matchChange && !matchStatus && !matchDate && !matchItemName) {
        return false;
      }
    }

    if (statusFilter !== 'all') {
      const isReplaced = Boolean(rec.changeItem && rec.changeItem.trim()) || (rec.status || '').toLowerCase().includes('repair');
      const isPass = (rec.status || '').toLowerCase().includes('pass') && !isReplaced;
      const isFail = (rec.status || '').toLowerCase().includes('fail') || (rec.status || '').toLowerCase().includes('rossz');

      if (statusFilter === 'pass' && !isPass) return false;
      if (statusFilter === 'repair' && !isReplaced) return false;
      if (statusFilter === 'fail' && !isFail) return false;
    }

    return true;
  });

  const sortedRecords = [...filteredRecords].sort((a, b) => {
    let comparison = 0;
    if (sortField === 'date') {
      comparison = naturalCompare(a.date || '', b.date || '');
    } else if (sortField === 'itemId') {
      comparison = naturalCompare(a.itemId || '', b.itemId || '');
    } else if (sortField === 'status') {
      comparison = naturalCompare(a.status || '', b.status || '');
    }
    return sortAsc ? comparison : -comparison;
  });

  const totalPages = Math.ceil(sortedRecords.length / pageSize) || 1;
  const currentPage = Math.min(page, totalPages);
  const paginatedRecords = sortedRecords.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleSort = (field: 'date' | 'itemId' | 'status') => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(field === 'itemId');
    }
    setPage(1);
  };

  const isReplacedItem = (rec: MaintenanceRecord) => {
    return Boolean(rec.changeItem && rec.changeItem.trim()) || (rec.status || '').toLowerCase().includes('repair') || (rec.status || '').toLowerCase().includes('csere');
  };

  const isPassStatus = (rec: MaintenanceRecord) => {
    return (rec.status || '').toLowerCase().includes('pass');
  };

  const isFailStatus = (rec: MaintenanceRecord) => {
    return (rec.status || '').toLowerCase().includes('fail') || (rec.status || '').toLowerCase().includes('rossz');
  };

  // Stats
  const passCount = maintenanceRecords.filter((r) => isPassStatus(r) && !isReplacedItem(r)).length;
  const repairCount = maintenanceRecords.filter(isReplacedItem).length;
  const failCount = maintenanceRecords.filter(isFailStatus).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-2 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border-2 border-emerald-800 w-full max-w-5xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Sötétzöld Címsor / Modal Header */}
        <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-emerald-950 px-5 py-4 border-b-2 border-emerald-950 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-800 border border-emerald-600/70 flex items-center justify-center text-emerald-200 shrink-0 shadow-inner">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-white uppercase tracking-wide">
                  Karbantartási Nyilvántartás & Szerviznapló
                </h2>
                <span className="text-[11px] font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-800 border border-emerald-600 text-emerald-100">
                  {maintenanceRecords.length} bejegyzés
                </span>
              </div>
              <p className="text-xs text-emerald-200">
                A raktárban nyilvántartott eszközök, gépek és alkatrészek karbantartási előzményei
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-emerald-300 hover:text-white hover:bg-emerald-800/80 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter bar and quick stats */}
        <div className="bg-emerald-50/50 p-4 border-b border-emerald-200 space-y-3 shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-emerald-700 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Keresés termék ID, megnevezés, leírás vagy alkatrész szerint..."
                className="w-full pl-9 pr-4 py-2 bg-white rounded-xl border border-emerald-300 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 text-xs sm:text-sm font-medium outline-hidden text-slate-900 shadow-2xs"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Quick status filter pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              <button
                type="button"
                onClick={() => {
                  setStatusFilter('all');
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  statusFilter === 'all'
                    ? 'bg-emerald-800 text-white shadow-xs'
                    : 'bg-white text-slate-700 hover:bg-emerald-100 border border-emerald-200'
                }`}
              >
                Összes ({maintenanceRecords.length})
              </button>
              <button
                type="button"
                onClick={() => {
                  setStatusFilter('pass');
                  setPage(1);
                }}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  statusFilter === 'pass'
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'bg-white text-emerald-800 hover:bg-emerald-100 border border-emerald-300'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span>Pass ({passCount})</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setStatusFilter('repair');
                  setPage(1);
                }}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
                  statusFilter === 'repair'
                    ? 'bg-amber-400 text-slate-950 border border-amber-500 shadow-xs'
                    : 'bg-white text-amber-900 hover:bg-amber-50 border border-amber-300'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                <span>Alkatrész Csere ({repairCount})</span>
              </button>
              {failCount > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setStatusFilter('fail');
                    setPage(1);
                  }}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    statusFilter === 'fail'
                      ? 'bg-rose-700 text-white shadow-xs'
                      : 'bg-white text-rose-800 hover:bg-rose-50 border border-rose-300'
                  }`}
                >
                  <XCircle className="w-3.5 h-3.5 text-rose-500" />
                  <span>Nem felelt meg ({failCount})</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Table list - White clean background with sötétzöld keret */}
        <div className="overflow-y-auto flex-1 p-0">
          <table className="w-full text-left border-collapse text-sm">
            <thead className="sticky top-0 z-10">
              <tr className="bg-emerald-950 text-emerald-100 uppercase text-xs font-black tracking-wider border-b-2 border-emerald-800">
                <th
                  onClick={() => handleSort('date')}
                  className="py-3 px-4 w-36 cursor-pointer hover:bg-emerald-900 select-none transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Dátum</span>
                    <ArrowUpDown className="w-3 h-3 text-emerald-400/70 ml-1" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('itemId')}
                  className="py-3 px-4 w-48 cursor-pointer hover:bg-emerald-900 select-none transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <Wrench className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Termék ID / Eszköz</span>
                    <ArrowUpDown className="w-3 h-3 text-emerald-400/70 ml-1" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('status')}
                  className="py-3 px-4 w-44 cursor-pointer hover:bg-emerald-900 select-none transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Státusz</span>
                    <ArrowUpDown className="w-3 h-3 text-emerald-400/70 ml-1" />
                  </div>
                </th>
                <th className="py-3 px-4">
                  <div className="flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Elvégzett Munka / Leírás</span>
                  </div>
                </th>
                <th className="py-3 px-4 w-56">
                  <div className="flex items-center gap-1.5">
                    <Wrench className="w-3.5 h-3.5 text-amber-400" />
                    <span>Kicserélt Alkatrész</span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-emerald-100 bg-white">
              {paginatedRecords.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    <Wrench className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="font-semibold text-sm">Nem található karbantartási bejegyzés a megadott szűrésre.</p>
                  </td>
                </tr>
              ) : (
                paginatedRecords.map((rec, index) => {
                  const replaced = isReplacedItem(rec);
                  const pass = isPassStatus(rec);
                  const fail = isFailStatus(rec);
                  const item = itemMap.get(rec.itemId.toLowerCase());

                  return (
                    <tr
                      key={rec.inspectionId || index}
                      className={`transition-colors ${
                        index % 2 === 0 ? 'bg-white' : 'bg-emerald-50/20'
                      } hover:bg-emerald-50/70`}
                    >
                      {/* Dátum */}
                      <td className="py-3 px-4 font-mono font-bold text-slate-900 whitespace-nowrap text-xs sm:text-sm">
                        {rec.date || '—'}
                      </td>

                      {/* Termék ID és név - kattintható */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            onSelectRecordItem(rec.itemId);
                          }}
                          className="text-left group cursor-pointer"
                          title="Ugrás a termék adatlapjára"
                        >
                          <div className="font-mono font-black text-emerald-950 group-hover:text-emerald-700 flex items-center gap-1.5">
                            <span>{rec.itemId}</span>
                            <ArrowRight className="w-3 h-3 text-slate-400 group-hover:translate-x-0.5 group-hover:text-emerald-700 transition-all" />
                          </div>
                          {item?.name && (
                            <div className="text-[11px] text-slate-500 truncate max-w-[180px]">
                              {item.name}
                            </div>
                          )}
                        </button>
                      </td>

                      {/* Státusz */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {replaced ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-amber-400 text-slate-950 border border-amber-300 shadow-xs">
                            <AlertTriangle className="w-3.5 h-3.5 text-slate-950 stroke-[2.5]" />
                            <span>Alkatrész Csere</span>
                          </span>
                        ) : pass ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-xs">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 stroke-[2.5]" />
                            <span>Pass</span>
                          </span>
                        ) : fail ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">
                            <XCircle className="w-3.5 h-3.5 text-rose-600" />
                            <span>{rec.status || 'Fail'}</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-300">
                            {rec.status || '—'}
                          </span>
                        )}
                      </td>

                      {/* Leírás */}
                      <td className="py-3 px-4 text-slate-800 font-medium text-xs sm:text-sm">
                        {rec.description ? (
                          <span>{rec.description}</span>
                        ) : (
                          <span className="text-slate-400 italic text-xs">Nincs kiegészítő megjegyzés</span>
                        )}
                      </td>

                      {/* Change Item (Kicserélt Alkatrész) */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {rec.changeItem && rec.changeItem.trim() ? (
                          <button
                            type="button"
                            onClick={() => {
                              onClose();
                              onSelectRecordItem(rec.changeItem!);
                            }}
                            className="group inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-400 text-slate-950 hover:bg-amber-300 active:scale-95 border border-amber-300 transition-all font-mono font-bold text-xs cursor-pointer shadow-xs"
                            title={`Ugrás a(z) ${rec.changeItem} alkatrészre`}
                          >
                            <span className="tracking-tight">{rec.changeItem}</span>
                            <ArrowRight className="w-3 h-3 text-slate-950 group-hover:translate-x-0.5 transition-transform" />
                          </button>
                        ) : (
                          <span className="text-slate-400 text-xs italic">— Nincs csere —</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer with pagination and total */}
        <div className="bg-emerald-50 px-5 py-3 border-t border-emerald-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-emerald-950 font-semibold shrink-0">
          <div className="flex items-center gap-3">
            <span>
              Megjelenítve: <strong>{paginatedRecords.length}</strong> / <strong>{sortedRecords.length}</strong> bejegyzés
            </span>
            {search && <span className="text-emerald-700">(szűrt találatok)</span>}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-2.5 py-1 rounded border border-emerald-300 bg-white hover:bg-emerald-100 disabled:opacity-40 disabled:hover:bg-white cursor-pointer font-bold"
              >
                Előző
              </button>
              <span className="tabular-nums">
                {currentPage} / {totalPages} oldal
              </span>
              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="px-2.5 py-1 rounded border border-emerald-300 bg-white hover:bg-emerald-100 disabled:opacity-40 disabled:hover:bg-white cursor-pointer font-bold"
              >
                Következő
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
