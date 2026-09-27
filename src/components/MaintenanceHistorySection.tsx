import React from 'react';
import { MaintenanceRecord } from '../types/inventory';
import {
  Wrench,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Calendar,
  Layers,
  FileText,
  XCircle,
  Plus,
} from 'lucide-react';

interface MaintenanceHistorySectionProps {
  records: MaintenanceRecord[];
  onNavigateToItem?: (itemId: string) => void;
  onAddMaintenance?: () => void;
}

export const MaintenanceHistorySection: React.FC<MaintenanceHistorySectionProps> = ({
  records,
  onNavigateToItem,
  onAddMaintenance,
}) => {
  // Sort newest first by date string
  const sortedRecords = [...records].sort((a, b) => {
    return (b.date || '').localeCompare(a.date || '');
  });

  const isReplacedItem = (rec: MaintenanceRecord) => {
    const s = (rec.status || '').toLowerCase().trim();
    return Boolean(rec.changeItem && rec.changeItem.trim()) || s.includes('repair') || s.includes('csere');
  };

  const isPassStatus = (rec: MaintenanceRecord) => {
    const s = (rec.status || '').toLowerCase().trim();
    return s.includes('pass');
  };

  const isFailStatus = (rec: MaintenanceRecord) => {
    const s = (rec.status || '').toLowerCase().trim();
    return s.includes('fail') || s.includes('rossz');
  };

  return (
    <div className="mt-8 rounded-2xl overflow-hidden border-2 border-emerald-800 bg-white shadow-md text-slate-800">
      {/* Dark Green Section Header (Címsor sötétzöld) */}
      <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-emerald-950 p-4 sm:p-5 border-b-2 border-emerald-950 text-white flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-emerald-800 border border-emerald-600/60 flex items-center justify-center text-emerald-200 shadow-inner shrink-0">
            <Wrench className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-black tracking-wide text-white uppercase">
                Karbantartási Történet
              </h2>
              <span className="text-[11px] font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-800 border border-emerald-600 text-emerald-100">
                {records.length} bejegyzés
              </span>
            </div>
            <p className="text-xs text-emerald-200 mt-0.5">
              Hivatalos szerviz, felülvizsgálat és alkatrészcserék naplója
            </p>
          </div>
        </div>

        {/* Legend & Add Maintenance button */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-800/80 text-emerald-100 border border-emerald-600/80 shadow-xs">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
            Pass (Megfelelt)
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-black bg-amber-400 text-slate-950 border border-amber-300 shadow-xs">
            <AlertTriangle className="w-3.5 h-3.5" />
            Alkatrész Csere
          </span>
          {onAddMaintenance && (
            <button
              type="button"
              onClick={onAddMaintenance}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-400 hover:bg-emerald-300 active:scale-95 text-emerald-950 font-black text-xs shadow-md transition-all cursor-pointer ml-1"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Új Karbantartás</span>
            </button>
          )}
        </div>
      </div>

      {/* Desktop Table View - Clean Light Background (Alapvetően világos) */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            {/* Table Header: Sötétzöld fejléc kerettel */}
            <tr className="bg-emerald-950 text-emerald-100 uppercase text-xs font-black tracking-wider border-b-2 border-emerald-800">
              <th className="py-3 px-4 w-36">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Dátum</span>
                </div>
              </th>
              <th className="py-3 px-4 w-44">
                <div className="flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Státusz</span>
                </div>
              </th>
              <th className="py-3 px-4">
                <div className="flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Elvégzett Munka / Leírás</span>
                </div>
              </th>
              <th className="py-3 px-4 w-60">
                <div className="flex items-center gap-1.5">
                  <Wrench className="w-3.5 h-3.5 text-amber-400" />
                  <span>Kicserélt Alkatrész</span>
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-emerald-100 bg-white">
            {sortedRecords.map((rec, index) => {
              const replaced = isReplacedItem(rec);
              const pass = isPassStatus(rec);
              const fail = isFailStatus(rec);

              return (
                <tr
                  key={rec.inspectionId || index}
                  className={`transition-colors ${
                    index % 2 === 0 ? 'bg-white' : 'bg-emerald-50/30'
                  } hover:bg-emerald-50/80`}
                >
                  {/* Dátum */}
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-900 whitespace-nowrap text-xs sm:text-sm">
                    {rec.date || '—'}
                  </td>

                  {/* Státusz */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
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
                  <td className="py-3.5 px-4 text-slate-800 font-medium">
                    {rec.description ? (
                      <span className="text-slate-800">{rec.description}</span>
                    ) : (
                      <span className="text-slate-400 italic text-xs">
                        Nincs kiegészítő megjegyzés
                      </span>
                    )}
                  </td>

                  {/* Change Item (Kicserélt Alkatrész) */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    {rec.changeItem && rec.changeItem.trim() ? (
                      <button
                        type="button"
                        onClick={() => onNavigateToItem?.(rec.changeItem!)}
                        className="group inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-400 text-slate-950 hover:bg-amber-300 active:scale-95 border border-amber-300 transition-all font-mono font-bold text-xs sm:text-sm cursor-pointer shadow-xs"
                        title={`Ugrás a(z) ${rec.changeItem} alkatrészre`}
                      >
                        <span className="tracking-tight">{rec.changeItem}</span>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-950 group-hover:translate-x-0.5 transition-transform" />
                      </button>
                    ) : (
                      <span className="text-slate-400 text-xs italic">
                        — Nincs csere —
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Card List View (< sm screens) - Clean Light cards with sötétzöld keret */}
      <div className="sm:hidden divide-y divide-emerald-100 p-3 space-y-3 bg-slate-50/60">
        {sortedRecords.map((rec, index) => {
          const replaced = isReplacedItem(rec);
          const pass = isPassStatus(rec);
          const fail = isFailStatus(rec);

          return (
            <div
              key={rec.inspectionId || index}
              className="p-3.5 rounded-xl bg-white border border-emerald-700/30 space-y-2.5 shadow-xs"
            >
              {/* Header with Date and Status */}
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono font-bold text-slate-900 text-xs flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-emerald-700" />
                  {rec.date || '—'}
                </span>

                {replaced ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-400 text-slate-950 border border-amber-300 shadow-xs">
                    <AlertTriangle className="w-3 h-3 text-slate-950" />
                    <span>Csere</span>
                  </span>
                ) : pass ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <span>Pass</span>
                  </span>
                ) : fail ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">
                    <XCircle className="w-3 h-3 text-rose-600" />
                    <span>{rec.status}</span>
                  </span>
                ) : (
                  <span className="text-xs text-slate-700 font-bold">
                    {rec.status}
                  </span>
                )}
              </div>

              {/* Description */}
              {rec.description && (
                <div className="text-xs text-slate-700 bg-emerald-50/60 p-2.5 rounded-lg border border-emerald-200/80 font-medium">
                  {rec.description}
                </div>
              )}

              {/* Change Item button on mobile */}
              {rec.changeItem && rec.changeItem.trim() && (
                <div className="pt-1 flex items-center justify-between gap-2 bg-amber-50 p-2 rounded-lg border border-amber-300/80">
                  <span className="text-[11px] font-bold text-amber-900 uppercase tracking-wider">
                    Kicserélt tétel:
                  </span>
                  <button
                    type="button"
                    onClick={() => onNavigateToItem?.(rec.changeItem!)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-amber-400 text-slate-950 hover:bg-amber-300 font-mono font-black text-xs shadow-xs"
                  >
                    <span>{rec.changeItem}</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Sötétzöld árnyalatú lábléc / Footer */}
      <div className="bg-emerald-50 px-4 py-2.5 border-t border-emerald-200 text-xs text-emerald-900 font-semibold flex items-center justify-between">
        <span>World Wires Kft. Karbantartási és Minőségbiztosítási Rendszer</span>
        <span className="font-mono text-emerald-800 font-bold">{records.length} bejegyzés</span>
      </div>
    </div>
  );
};
