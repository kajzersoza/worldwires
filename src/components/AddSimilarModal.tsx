import React, { useState } from 'react';
import { X, Network, Link2, Search, Check, AlertTriangle, ArrowRight, Layers } from 'lucide-react';
import { InventoryItem, ProductRelation } from '../types/inventory';

interface AddSimilarModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentItem: InventoryItem;
  allItems: InventoryItem[];
  existingSimilarIds: string[];
  onSave: (relation: ProductRelation) => Promise<void>;
}

export const AddSimilarModal: React.FC<AddSimilarModalProps> = ({
  isOpen,
  onClose,
  currentItem,
  allItems,
  existingSimilarIds,
  onSave,
}) => {
  const [selectedTargetId, setSelectedTargetId] = useState('');
  const [search, setSearch] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const cleanCurrentId = currentItem.id.trim().toLowerCase();
  const existingSet = new Set(existingSimilarIds.map((id) => id.trim().toLowerCase()));

  // Filter possible candidate items (excluding self and already linked items)
  const candidateItems = allItems.filter((i) => {
    const itId = i.id.trim().toLowerCase();
    if (itId === cleanCurrentId) return false;
    if (existingSet.has(itId)) return false;

    if (!search.trim()) return true;
    const q = search.trim().toLowerCase();
    return (
      itId.includes(q) ||
      (i.name && i.name.toLowerCase().includes(q)) ||
      (i.factoryCode && i.factoryCode.toLowerCase().includes(q)) ||
      (i.category && i.category.toLowerCase().includes(q))
    );
  }).slice(0, 15);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const target = selectedTargetId.trim();
    if (!target) {
      setError('Kérjük, válassz ki egy hasonló terméket a listából!');
      return;
    }

    if (target.toLowerCase() === cleanCurrentId) {
      setError('Egy termék önmagához nem adható hozzá hasonlóként!');
      return;
    }

    const randomHex = Math.random().toString(16).substring(2, 10);
    const newRelation: ProductRelation = {
      relationId: randomHex,
      itemId1: currentItem.id,
      itemId2: target,
      type: 'similar',
      notes: notes.trim(),
      createdAt: new Date().toISOString(),
    };

    try {
      setIsSubmitting(true);
      setError(null);
      await onSave(newRelation);
      onClose();
    } catch (err: any) {
      console.error('Failed to save similar item relation:', err);
      setError('Hiba történt a mentéskor: ' + (err?.message || err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border-2 border-purple-900 w-full max-w-lg overflow-hidden flex flex-col max-h-[92vh]">
        {/* Sötét lila címsor / Header */}
        <div className="bg-gradient-to-r from-purple-950 via-purple-900 to-purple-950 px-5 py-4 border-b-2 border-purple-950 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-800 border border-purple-600/70 flex items-center justify-center text-purple-200 shrink-0 shadow-inner">
              <Network className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-white uppercase tracking-wide">
                  Hasonló Termék Hozzáadása
                </h2>
              </div>
              <p className="text-xs text-purple-200 mt-0.5">
                Kapcsolat létrehozása: <strong className="font-mono text-white">{currentItem.id}</strong>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-purple-300 hover:text-white hover:bg-purple-800/80 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm font-semibold rounded-xl flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Current product indicator */}
          <div className="p-3 rounded-xl bg-purple-50/70 border border-purple-200 flex items-center gap-3">
            <div className="text-xs text-purple-900 font-bold uppercase tracking-wider">
              Kijelölt tétel:
            </div>
            <div className="font-mono font-black text-purple-950 text-sm">
              {currentItem.id}
            </div>
            {currentItem.name && (
              <div className="text-xs text-slate-600 truncate max-w-[200px]">
                ({currentItem.name})
              </div>
            )}
          </div>

          {/* Search for similar target product */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Search className="w-3.5 h-3.5 text-purple-700" />
              <span>Hasonló Termék kiválasztása a raktárból</span>
            </label>
            <div className="relative mb-2">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Keresés Termék ID, név vagy gyári kód szerint..."
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-purple-600 focus:ring-2 focus:ring-purple-500/20 text-slate-900 text-sm outline-hidden transition-all"
              />
            </div>

            {/* Candidate list */}
            <div className="border border-purple-200 rounded-xl max-h-48 overflow-y-auto divide-y divide-purple-100 bg-white">
              {candidateItems.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-500 italic">
                  Nem található hozzáadható termék a keresésre.
                </div>
              ) : (
                candidateItems.map((item) => {
                  const isSelected = selectedTargetId === item.id;
                  return (
                    <div
                      key={item.id}
                      onClick={() => setSelectedTargetId(item.id)}
                      className={`p-2.5 flex items-center justify-between gap-2 cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-purple-100/90 text-purple-950 font-bold'
                          : 'hover:bg-purple-50/60 text-slate-800'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-xs text-purple-950">
                            {item.id}
                          </span>
                          {item.factoryCode && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-mono">
                              {item.factoryCode}
                            </span>
                          )}
                        </div>
                        {item.name && (
                          <div className="text-[11px] text-slate-600 truncate mt-0.5">
                            {item.name}
                          </div>
                        )}
                      </div>

                      <div className="shrink-0 flex items-center">
                        {isSelected ? (
                          <span className="w-5 h-5 rounded-full bg-purple-700 text-white flex items-center justify-center shadow-xs">
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </span>
                        ) : (
                          <span className="w-5 h-5 rounded-full border border-slate-300 flex items-center justify-center text-transparent hover:border-purple-500">
                            ✓
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Selected target preview */}
          {selectedTargetId && (
            <div className="p-3 bg-purple-950 text-white rounded-xl flex items-center justify-between text-xs shadow-xs">
              <span className="text-purple-300 font-bold uppercase tracking-wider">Kiválasztott kapcsolat:</span>
              <span className="font-mono font-black text-amber-300 text-sm">{selectedTargetId}</span>
            </div>
          )}

          {/* Megjegyzés / Notes */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-purple-700" />
              <span>Megjegyzés a hasonlósághoz (opcionális)</span>
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="pl. Funkcionálisan azonos, eltérő széria / alternatív kód"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-purple-600 focus:ring-2 focus:ring-purple-500/20 text-slate-900 text-xs sm:text-sm outline-hidden transition-all"
            />
          </div>

          {/* Action buttons */}
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
              disabled={isSubmitting || !selectedTargetId}
              className="inline-flex items-center gap-2 px-5 py-2 text-sm font-black text-white bg-purple-800 hover:bg-purple-900 active:scale-95 rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>{isSubmitting ? 'Mentés...' : 'Kapcsolat Rögzítése'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
