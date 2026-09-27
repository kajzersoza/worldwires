import React from 'react';
import { Cpu, ArrowRight, Trash2, Plus, Cable } from 'lucide-react';
import { InventoryItem, ProductRelation } from '../types/inventory';
import { getDisplayableImageUrl } from '../utils/imageHelpers';

interface ConnectorTerminalCardProps {
  currentItem: InventoryItem;
  relations: ProductRelation[];
  allItems: InventoryItem[];
  onNavigateToItem?: (itemId: string) => void;
  onOpenAddConnectorTerminal?: () => void;
  onDeleteRelation?: (relationId: string) => void;
}

export const ConnectorTerminalCard: React.FC<ConnectorTerminalCardProps> = ({
  currentItem,
  relations,
  allItems,
  onNavigateToItem,
  onOpenAddConnectorTerminal,
  onDeleteRelation,
}) => {
  const currentCleanId = currentItem.id.trim().toLowerCase();

  // Deduplicate relations by related target product ID so each item is displayed only once
  const uniqueRelations = React.useMemo(() => {
    const seen = new Set<string>();
    const result: ProductRelation[] = [];
    for (const rel of relations || []) {
      const otherId =
        rel.itemId1.trim().toLowerCase() === currentCleanId
          ? rel.itemId2.trim().toLowerCase()
          : rel.itemId1.trim().toLowerCase();

      if (!seen.has(otherId) && otherId !== currentCleanId) {
        seen.add(otherId);
        result.push(rel);
      }
    }
    return result;
  }, [relations, currentCleanId]);

  // If no relations exist for this item, DO NOT render the card at all (as requested)
  if (uniqueRelations.length === 0) {
    return null;
  }

  // Create lookup map of all items
  const itemMap = new Map<string, InventoryItem>();
  for (const it of allItems) {
    itemMap.set(it.id.toLowerCase(), it);
    if (it.factoryCode) itemMap.set(it.factoryCode.toLowerCase(), it);
  }

  return (
    <div className="mt-8 rounded-2xl overflow-hidden border-2 border-amber-600 bg-white shadow-md text-slate-800">
      {/* Narancssárga címsor / Header */}
      <div className="bg-gradient-to-r from-amber-700 via-orange-600 to-amber-700 p-4 sm:p-5 border-b-2 border-amber-700 text-white flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-amber-800 border border-amber-400/60 flex items-center justify-center text-amber-100 shadow-inner shrink-0">
            <Cable className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-black tracking-wide text-white uppercase">
                Konnektor & Saru Kapcsolatok
              </h2>
              <span className="text-[11px] font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-900 border border-amber-400 text-amber-100">
                {uniqueRelations.length} tétel
              </span>
            </div>
            <p className="text-xs text-amber-100 mt-0.5">
              A tételhez közvetlenül párosítható Konnektor és Saru alkatrészek listája
            </p>
          </div>
        </div>

        {/* Header Right Action: Hozzáadás gomb */}
        {onOpenAddConnectorTerminal && (
          <button
            type="button"
            onClick={onOpenAddConnectorTerminal}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-300 hover:bg-amber-200 active:scale-95 text-amber-950 font-black text-xs shadow-md transition-all cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Új Konnektor / Saru Hozzáadása</span>
          </button>
        )}
      </div>

      {/* Grid of Linked Items - White background with amber/orange borders */}
      <div className="p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 bg-amber-50/20">
        {uniqueRelations.map((rel, index) => {
          // The other item in this relation
          const otherId =
            rel.itemId1.trim().toLowerCase() === currentCleanId
              ? rel.itemId2
              : rel.itemId1;

          const linkedItem = itemMap.get(otherId.toLowerCase());
          const displayImg = linkedItem?.image ? getDisplayableImageUrl(linkedItem.image) : null;

          return (
            <div
              key={rel.relationId || index}
              className="bg-white border-2 border-amber-200 hover:border-amber-500 rounded-xl p-3.5 flex flex-col justify-between gap-3 transition-all hover:shadow-md group"
            >
              <div className="flex items-start gap-3">
                {/* Thumbnail */}
                <div className="w-14 h-14 rounded-lg bg-amber-50 border border-amber-200 overflow-hidden flex items-center justify-center shrink-0">
                  {displayImg ? (
                    <img
                      src={displayImg}
                      alt={otherId}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  ) : (
                    <Cable className="w-6 h-6 text-amber-400" />
                  )}
                </div>

                {/* Info */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[10px] font-black uppercase tracking-wider text-amber-900 bg-amber-100 border border-amber-300 px-1.5 py-0.2 rounded">
                      {linkedItem?.category || 'Konnektor / Saru'}
                    </span>
                    {onDeleteRelation && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm(`Biztosan törlöd a kapcsolatot a(z) ${otherId} tétellel?`)) {
                            onDeleteRelation(rel.relationId);
                          }
                        }}
                        className="text-slate-300 hover:text-red-600 p-1 rounded hover:bg-red-50 transition-colors cursor-pointer"
                        title="Kapcsolat törlése"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <h4 className="font-mono font-black text-sm text-slate-900 group-hover:text-amber-800 transition-colors truncate mt-1">
                    {otherId}
                  </h4>

                  {linkedItem?.name && (
                    <p className="text-xs text-slate-600 truncate mt-0.5">
                      {linkedItem.name}
                    </p>
                  )}

                  {linkedItem?.factoryCode && (
                    <p className="text-[11px] font-mono text-slate-500 mt-0.5">
                      Gyári kód: <strong className="text-slate-700">{linkedItem.factoryCode}</strong>
                    </p>
                  )}

                  {rel.notes && (
                    <p className="text-[11px] text-amber-900 font-medium italic mt-1 line-clamp-2 bg-amber-50/70 p-1 rounded">
                      „{rel.notes}”
                    </p>
                  )}
                </div>
              </div>

              {/* Bottom Action: Közvetlen átugrás erre a termékre */}
              <button
                type="button"
                onClick={() => onNavigateToItem && onNavigateToItem(otherId)}
                className="w-full mt-1 py-1.5 px-3 rounded-lg bg-amber-50 hover:bg-amber-600 text-amber-950 hover:text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer border border-amber-300 group/btn"
              >
                <span>Termék adatlap megnyitása</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 transition-transform" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
