import React, { useState } from 'react';
import { X, Wrench, Calendar, Check, AlertTriangle, Layers, FileText } from 'lucide-react';
import { InventoryItem, MaintenanceRecord } from '../types/inventory';

interface AddMaintenanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: InventoryItem;
  items: InventoryItem[];
  onSave: (record: MaintenanceRecord) => Promise<void>;
}

export const AddMaintenanceModal: React.FC<AddMaintenanceModalProps> = ({
  isOpen,
  onClose,
  item,
  items,
  onSave,
}) => {
  // Format today's date in 'YYYY. MM. DD.' format
  const getTodayFormatted = () => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}. ${m}. ${d}.`;
  };

  const [date, setDate] = useState<string>(getTodayFormatted());
  const [statusType, setStatusType] = useState<'pass' | 'repair' | 'fail' | 'other'>('pass');
  const [customStatus, setCustomStatus] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [changeItem, setChangeItem] = useState<string>('');
  const [changeItemSearch, setChangeItemSearch] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  // Filter possible change items from system items
  const filteredChangeCandidates = changeItemSearch.trim()
    ? items.filter(
        (i) =>
          i.id.toLowerCase().includes(changeItemSearch.toLowerCase()) ||
          (i.name && i.name.toLowerCase().includes(changeItemSearch.toLowerCase())) ||
          (i.factoryCode && i.factoryCode.toLowerCase().includes(changeItemSearch.toLowerCase()))
      ).slice(0, 8)
    : [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date.trim()) {
      setError('A dátum kitöltése kötelező!');
      return;
    }

    let finalStatus = 'Pass';
    if (statusType === 'repair') {
      finalStatus = 'Repair';
    } else if (statusType === 'fail') {
      finalStatus = 'Fail';
    } else if (statusType === 'other') {
      finalStatus = customStatus.trim() || 'Karbantartás';
    }

    // Auto unique ID
    const randomHex = Math.random().toString(16).substring(2, 10);
    const newRecord: MaintenanceRecord = {
      inspectionId: randomHex,
      itemId: item.id,
      status: finalStatus,
      description: description.trim(),
      changeItem: changeItem.trim(),
      date: date.trim(),
    };

    try {
      setIsSubmitting(true);
      setError(null);
      await onSave(newRecord);
      onClose();
    } catch (err: any) {
      console.error('Failed to add maintenance record:', err);
      setError('Hiba történt a mentés során: ' + (err?.message || err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border-2 border-emerald-800 w-full max-w-lg overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header: Sötétzöld címsor */}
        <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-emerald-950 px-5 py-4 border-b-2 border-emerald-950 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-800 border border-emerald-600/70 flex items-center justify-center text-emerald-200 shrink-0 shadow-inner">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white uppercase tracking-wide">
                Új Karbantartás Rögzítése
              </h2>
              <p className="text-xs text-emerald-200">
                Termék: <strong className="text-white font-mono">{item.id}</strong> {item.name ? `(${item.name})` : ''}
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm font-semibold rounded-xl flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Dátum */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-emerald-700" />
              <span>Dátum</span>
            </label>
            <input
              type="text"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              placeholder="pl. 2026. 09. 27."
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 text-slate-900 font-mono font-bold text-sm outline-hidden transition-all"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Formátum: ÉÉÉÉ. HH. NN. (alapértelmezetten a mai nap)
            </p>
          </div>

          {/* Státusz kiválasztás */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-emerald-700" />
              <span>Státusz / Esemény Típusa</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  setStatusType('pass');
                }}
                className={`p-2.5 rounded-xl border text-xs font-black flex flex-col items-center justify-center gap-1 cursor-pointer transition-all ${
                  statusType === 'pass'
                    ? 'bg-emerald-100 border-emerald-600 text-emerald-950 shadow-xs ring-2 ring-emerald-500/30'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span>Pass (Megfelelt)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setStatusType('repair');
                }}
                className={`p-2.5 rounded-xl border text-xs font-black flex flex-col items-center justify-center gap-1 cursor-pointer transition-all ${
                  statusType === 'repair'
                    ? 'bg-amber-100 border-amber-500 text-amber-950 shadow-xs ring-2 ring-amber-500/30'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span>Alkatrész Csere / Javítás</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setStatusType('fail');
                }}
                className={`p-2.5 rounded-xl border text-xs font-black flex flex-col items-center justify-center gap-1 cursor-pointer transition-all ${
                  statusType === 'fail'
                    ? 'bg-rose-100 border-rose-500 text-rose-950 shadow-xs ring-2 ring-rose-500/30'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                <span>Nem felelt meg (Fail)</span>
              </button>
            </div>
          </div>

          {/* Kicserélt alkatrész (Change Item) */}
          <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-300">
            <label className="block text-xs font-black uppercase tracking-wider text-amber-950 mb-1 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Wrench className="w-3.5 h-3.5 text-amber-600" />
                <span>Kicserélt Alkatrész (Change Item Termék ID)</span>
              </span>
              <span className="text-[10px] font-normal lowercase text-amber-800 italic">
                (opcionális, ha volt csere)
              </span>
            </label>
            <input
              type="text"
              value={changeItem}
              onChange={(e) => {
                setChangeItem(e.target.value);
                setChangeItemSearch(e.target.value);
              }}
              placeholder="pl. ME.911270246, SPC06010B vagy Termék ID"
              className="w-full px-3.5 py-2 rounded-lg border border-amber-300 bg-white focus:border-amber-600 focus:ring-2 focus:ring-amber-500/20 text-slate-900 font-mono font-bold text-sm outline-hidden"
            />

            {/* Quick autocomplete from loaded inventory */}
            {filteredChangeCandidates.length > 0 && changeItemSearch.trim() && (
              <div className="mt-2 bg-white rounded-lg border border-amber-200 p-1.5 divide-y divide-slate-100 max-h-36 overflow-y-auto shadow-xs">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 py-0.5">
                  Gyors választás a raktárból:
                </div>
                {filteredChangeCandidates.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      setChangeItem(c.id);
                      setChangeItemSearch('');
                    }}
                    className="w-full text-left px-2 py-1.5 text-xs hover:bg-amber-100/60 rounded flex items-center justify-between cursor-pointer"
                  >
                    <span className="font-mono font-bold text-amber-900">{c.id}</span>
                    <span className="text-slate-600 truncate max-w-[200px] ml-2 text-[11px]">
                      {c.name || c.factoryCode || ''}
                    </span>
                  </button>
                ))}
              </div>
            )}
            <p className="text-[11px] text-amber-800/80 mt-1">
              Erre rákattintva a munkatársak közvetlenül a beépített alkatrész adatlapjára ugorhatnak.
            </p>
          </div>

          {/* Elvégzett munka / Leírás */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-emerald-700" />
              <span>Elvégzett Munka / Leírás / Megjegyzés</span>
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="pl. Időszakos felülvizsgálat elvégezve, szíj feszesség beállítva, kenés pótolva."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 text-slate-800 text-sm outline-hidden transition-all resize-none"
            />
          </div>

          {/* Buttons */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Mégse
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-5 py-2 text-sm font-black text-white bg-emerald-700 hover:bg-emerald-800 active:scale-95 rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>{isSubmitting ? 'Mentés...' : 'Karbantartás Mentése'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
