import React, { useState } from 'react';
import { X, Search, Check, AlertTriangle, Cable, ArrowRight } from 'lucide-react';
import { InventoryItem, ProductRelation } from '../types/inventory';

interface AddConnectorTerminalModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentItem: InventoryItem;
  allItems: InventoryItem[];
  existingLinkedIds: string[];
  onSave: (relation: ProductRelation) => Promise<void>;
}

export const AddConnectorTerminalModal: React.FC<AddConnectorTerminalModalProps> = ({
  isOpen,
  onClose,
  currentItem,
  allItems,
  existingLinkedIds,
  onSave,
}) => {
  const [selectedTargetId, setSelectedTargetId] = useState('');
  const [search, setSearch] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const cleanCurrentId = currentItem.id.trim().toLowerCase();
  const existingSet = new Set(existingLinkedIds.map((id) => id.trim().toLowerCase()));

  // Filter candidate items: prioritize Konnektor and Saru items (or any relevant items), excluding self and already linked
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
  }).slice(0, 20);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const target = selectedTargetId.trim();
    if (!target) {
      setError('Kérjük, válassz ki egy elemet a listából!');
      return;
    }

    if (target.toLowerCase() === cleanCurrentId) {
      setError('Egy tétel önmagához nem rendelhető hozzá!');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const newRelation: ProductRelation = {
        relationId: Math.random().toString(36).substring(2, 10),
        itemId1: currentItem.id,
        itemId2: target,
        type: 'connector_terminal',
        notes: notes.trim() || undefined,
        createdAt: new Date().toISOString(),
      };

      await onSave(newRelation);
      onClose();
      setSelectedTargetId('');
      setNotes('');
      setSearch('');
    } catch (err) {
      console.error(err);
      setError('Hiba történt a kapcsolat mentése során.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-xl w-full border-2 border-amber-600 shadow-2xl overflow-hidden my-auto animate-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
        {/* Narancssárga Header */}
        <div className="bg-gradient-to-r from-amber-700 via-orange-600 to-amber-700 p-4 sm:p-5 text-white flex items-center justify-between border-b-2 border-amber-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-800/80 border border-amber-400/60 flex items-center justify-center text-amber-100 shrink-0">
              <Cable className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black tracking-wide text-white uppercase">
                Új Konnektor / Saru Kapcsolat
              </h3>
              <p className="text-xs text-amber-100">
                Párosítás a(z) <span className="font-mono font-bold underline">{currentItem.id}</span> tételhez
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-amber-200 hover:text-white hover:bg-amber-800/60 p-1.5 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-semibold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Current product summary box */}
          <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl flex items-center justify-between gap-2">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-900 block">
                Kiinduló Tétel
              </span>
              <span className="font-mono font-black text-sm text-slate-900">
                {currentItem.id}
              </span>
              {currentItem.name && (
                <span className="text-xs text-slate-600 ml-2">
                  ({currentItem.name})
                </span>
              )}
            </div>
            <span className="text-xs font-bold text-amber-900 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded">
              {currentItem.category || 'Tétel'}
            </span>
          </div>

          {/* Search target product */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Keresés és kiválasztás a raktárból *
            </label>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Keress Termék ID, név, gyári kód alapján..."
                className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-amber-500 focus:bg-white transition-all font-medium"
              />
            </div>
          </div>

          {/* List of candidates */}
          <div>
            <div className="text-[11px] font-bold text-slate-500 mb-1.5 flex items-center justify-between">
              <span>Elérhető tételek ({candidateItems.length})</span>
              {selectedTargetId && (
                <span className="text-amber-800 font-bold font-mono">
                  Kiválasztva: {selectedTargetId}
                </span>
              )}
            </div>

            <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100 bg-slate-50/40">
              {candidateItems.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-400">
                  Nincs a keresésnek megfelelő elérhető tétel.
                </div>
              ) : (
                candidateItems.map((c) => {
                  const isSelected = selectedTargetId === c.id;
                  return (
                    <div
                      key={c.id}
                      onClick={() => setSelectedTargetId(c.id)}
                      className={`p-2.5 sm:p-3 flex items-center justify-between gap-2 cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-amber-100/90 border-l-4 border-amber-600'
                          : 'hover:bg-amber-50/50'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-xs sm:text-sm text-slate-900">
                            {c.id}
                          </span>
                          {c.category && (
                            <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-slate-200 text-slate-700 truncate">
                              {c.category}
                            </span>
                          )}
                        </div>
                        {c.name && (
                          <p className="text-xs text-slate-600 truncate mt-0.5">
                            {c.name}
                          </p>
                        )}
                        {c.factoryCode && (
                          <p className="text-[10px] font-mono text-slate-400">
                            Kód: {c.factoryCode}
                          </p>
                        )}
                      </div>

                      <div className="shrink-0">
                        {isSelected ? (
                          <div className="w-6 h-6 rounded-full bg-amber-600 text-white flex items-center justify-center">
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </div>
                        ) : (
                          <div className="w-6 h-6 rounded-full border border-slate-300 hover:border-amber-500" />
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Optional notes */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Megjegyzés a kapcsolathoz (opcionális)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="pl. Párban szerelendő, megfelelő saru / konnektor alkatrész..."
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-amber-500 focus:bg-white transition-all"
            />
          </div>

          {/* Modal Actions */}
          <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Mégse
            </button>
            <button
              type="submit"
              disabled={!selectedTargetId || isSubmitting}
              className="px-5 py-2 text-xs font-black text-white bg-amber-600 hover:bg-amber-700 active:scale-95 disabled:opacity-50 disabled:pointer-events-none rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>{isSubmitting ? 'Mentés...' : 'Kapcsolat Mentése'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
