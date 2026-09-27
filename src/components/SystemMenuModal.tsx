import React, { useRef } from 'react';
import { X, MapPin, ChevronRight, Upload, Download, RefreshCw, CheckCircle2, Sliders, Image as ImageIcon, FileDown, Wrench } from 'lucide-react';

interface SystemMenuModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenPositions: () => void;
  onOpenMaintenance?: () => void;
  onImportCSV: (csvString: string) => void;
  onExportCSV: () => void;
  onExportPDF?: () => void;
  onResetDB: () => void;
  totalItems: number;
  totalCategories: number;
  totalManufacturers: number;
  totalLocations: number;
  totalPositions: number;
  totalMaintenance?: number;
}

export const SystemMenuModal: React.FC<SystemMenuModalProps> = ({
  isOpen,
  onClose,
  onOpenPositions,
  onOpenMaintenance,
  onImportCSV,
  onExportCSV,
  onExportPDF,
  onResetDB,
  totalItems,
  totalCategories,
  totalManufacturers,
  totalLocations,
  totalPositions,
  totalMaintenance,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        onImportCSV(text);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-4 sm:my-6">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 bg-slate-50/60">
          <div className="flex items-center gap-3">
            <img src="/ww_logo.svg" alt="World Wires Kft. Logó" className="w-10 h-10 object-contain shrink-0" />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                  World Wires Kft.
                </span>
                <span className="text-xs font-bold text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200">
                  Rendszer Menü
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Raktárkészlet konfiguráció, pozíciók és adatkezelés
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body content */}
        <div className="p-4 sm:p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Section 1: Karbantartás Menüpont */}
          {onOpenMaintenance && (
            <div>
              <div className="flex items-center gap-1.5 text-xs sm:text-sm font-bold uppercase tracking-wider text-emerald-800 mb-2">
                <Wrench className="w-4 h-4 text-emerald-700" />
                <span>KARBANTARTÁS MENÜPONT</span>
              </div>

              <div
                onClick={() => {
                  onClose();
                  onOpenMaintenance();
                }}
                className="p-4 bg-emerald-50/70 hover:bg-emerald-100/70 border-2 border-emerald-400 rounded-2xl flex items-center justify-between gap-3 cursor-pointer transition-all shadow-xs group"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-xl bg-emerald-800 text-white flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                    <Wrench className="w-6 h-6 text-emerald-200" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-base sm:text-lg font-black text-slate-900 group-hover:text-emerald-950">
                        Karbantartási Nyilvántartás
                      </span>
                      {typeof totalMaintenance === 'number' && (
                        <span className="px-2.5 py-0.5 text-xs font-bold text-emerald-950 bg-emerald-200 rounded-full tabular-nums">
                          {totalMaintenance} bejegyzés
                        </span>
                      )}
                    </div>
                    <p className="text-xs sm:text-sm text-slate-600 mt-1">
                      Összesített szerviznapló, alkatrészcserék, felülvizsgálatok és eszközállapotok központi listája.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-emerald-800 font-bold text-xs sm:text-sm shrink-0 group-hover:translate-x-1 transition-transform">
                  <span className="hidden sm:inline">Megnyitás</span>
                  <ChevronRight className="w-5 h-5 text-emerald-800" />
                </div>
              </div>
            </div>
          )}

          {/* Section 2: Raktári Pozíciók Menüpont */}
          <div>
            <div className="flex items-center gap-1.5 text-xs sm:text-sm font-bold uppercase tracking-wider text-teal-700 mb-2">
              <MapPin className="w-4 h-4" />
              <span>POZÍCIÓK MENÜPONT</span>
            </div>

            <div
              onClick={() => {
                onClose();
                onOpenPositions();
              }}
              className="p-4 bg-teal-50 hover:bg-teal-100/70 border-2 border-teal-300/80 rounded-2xl flex items-center justify-between gap-3 cursor-pointer transition-all shadow-xs group"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-teal-600 text-white flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                  <MapPin className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-base sm:text-lg font-black text-slate-900 group-hover:text-teal-950">
                      Raktári Pozíciók
                    </span>
                    <span className="px-2.5 py-0.5 text-xs font-bold text-teal-950 bg-teal-200 rounded-full tabular-nums">
                      {totalPositions} db pozíció
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-600 mt-1">
                    Polcok, dobozok, TMK, részlegek és munkaállomások listája, szerkesztése és új pozíciók felvétele.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1 text-teal-700 font-bold text-xs sm:text-sm shrink-0 group-hover:translate-x-1 transition-transform">
                <span className="hidden sm:inline">Megnyitás</span>
                <ChevronRight className="w-5 h-5 text-teal-700" />
              </div>
            </div>
          </div>

          {/* Section 2: Adatkezelés (Import & Export) */}
          <div>
            <div className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-500 mb-2">
              ADATKEZELÉS (IMPORT & EXPORT)
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
              {/* Load CSV */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="p-4 border border-teal-200 rounded-xl hover:border-teal-400 bg-white hover:bg-teal-50/40 transition-all cursor-pointer flex flex-col justify-between group"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-xs">
                    <Upload className="w-5 h-5" />
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-teal-600" />
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-900 mb-1">
                    CSV Betöltése
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Google Drive CSV importálás (4057 sor).
                  </p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.txt"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>

              {/* Export CSV */}
              <div
                onClick={onExportCSV}
                className="p-4 border border-blue-200 rounded-xl hover:border-blue-400 bg-white hover:bg-blue-50/40 transition-all cursor-pointer flex flex-col justify-between group"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
                    <Download className="w-5 h-5" />
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600" />
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-900 mb-1">
                    CSV Exportálás
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Aktuális készlet táblázatként (Excel / Sheets).
                  </p>
                </div>
              </div>

              {/* Export PDF Report */}
              <div
                onClick={() => {
                  onClose();
                  onExportPDF?.();
                }}
                className="p-4 border border-rose-200 rounded-xl hover:border-rose-400 bg-white hover:bg-rose-50/40 transition-all cursor-pointer flex flex-col justify-between group"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shadow-xs">
                    <FileDown className="w-5 h-5" />
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-rose-600" />
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-900 mb-1">
                    PDF Riport Mentése
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Szűrt lista letöltése nyomtatható PDF-ként.
                  </p>
                </div>
              </div>
            </div>

            {/* Reset database */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-700 font-medium">
                <RefreshCw className="w-4 h-4 text-slate-500 shrink-0" />
                <span>Adatbázis visszaállítása az induló mintára</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (window.confirm('Biztosan visszaállítod az induló mintaadatbázist? Minden új elem felülíródik.')) {
                    onResetDB();
                  }
                }}
                className="px-3 py-1.5 text-xs font-bold text-slate-700 hover:text-slate-950 border border-slate-300 rounded-lg hover:bg-white cursor-pointer shadow-2xs"
              >
                Reset
              </button>
            </div>
          </div>

          {/* Section 3: Raktári összegzés */}
          <div>
            <div className="text-xs sm:text-sm font-bold uppercase tracking-wider text-teal-700 mb-2">
              RAKTÁRI ÖSSZEGZÉS
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 text-center">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="text-[11px] font-semibold text-slate-500 mb-0.5">Tételek</div>
                <div className="text-lg sm:text-xl font-black text-slate-900 tabular-nums">
                  {totalItems}
                </div>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="text-[11px] font-semibold text-slate-500 mb-0.5">Kategóriák</div>
                <div className="text-lg sm:text-xl font-black text-teal-600 tabular-nums">
                  {totalCategories}
                </div>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="text-[11px] font-semibold text-slate-500 mb-0.5">Gyártók</div>
                <div className="text-lg sm:text-xl font-black text-blue-600 tabular-nums">
                  {totalManufacturers}
                </div>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="text-[11px] font-semibold text-slate-500 mb-0.5">Alkatrész Hely</div>
                <div className="text-lg sm:text-xl font-black text-teal-600 tabular-nums">
                  {totalLocations}
                </div>
              </div>
              <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl col-span-2 sm:col-span-1">
                <div className="text-[11px] font-semibold text-emerald-800 mb-0.5">Karbantartás</div>
                <div className="text-lg sm:text-xl font-black text-emerald-900 tabular-nums">
                  {totalMaintenance ?? 154}
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: Későbbi beállítások */}
          <div>
            <div className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-500 mb-2">
              KÉSŐBBI BEÁLLÍTÁSOK
            </div>

            <div className="space-y-2.5 text-xs sm:text-sm">
              <div className="p-3.5 bg-white border border-slate-200 rounded-xl flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <ImageIcon className="w-5 h-5 text-slate-400 shrink-0" />
                  <div>
                    <div className="font-bold text-slate-800">Képkezelés és fotók csatolása</div>
                    <div className="text-xs text-slate-400">Google Drive link alapú képmegjelenítés és zoom</div>
                  </div>
                </div>
                <span className="px-2.5 py-1 text-xs font-bold text-teal-800 bg-teal-100 rounded-md shrink-0">
                  Aktív
                </span>
              </div>

              <div className="p-3.5 bg-white border border-slate-200 rounded-xl flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-slate-400 shrink-0" />
                  <div>
                    <div className="font-bold text-slate-800">Alkatrész Helyek és Fiókok kezelése</div>
                    <div className="text-xs text-slate-400">Egyedi raktári polcok, fiókok és zónák konfigurálása</div>
                  </div>
                </div>
                <span className="px-2.5 py-1 text-xs font-bold text-slate-600 bg-slate-100 rounded-md shrink-0">
                  Később
                </span>
              </div>

              <div className="p-3.5 bg-white border border-slate-200 rounded-xl flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-teal-600 shrink-0" />
                  <div>
                    <div className="font-bold text-slate-800">Helyi adatbázis állapota</div>
                    <div className="text-xs text-slate-400">IndexedDB offline tároló aktív és üzemkész</div>
                  </div>
                </div>
                <span className="px-2.5 py-1 text-xs font-bold text-teal-800 bg-teal-100 rounded-md shrink-0">
                  Üzemkész
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-7 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            Bezárás
          </button>
        </div>
      </div>
    </div>
  );
};
