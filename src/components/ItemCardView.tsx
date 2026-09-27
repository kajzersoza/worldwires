import React, { useState } from 'react';
import { InventoryItem } from '../types/inventory';
import { naturalCompare } from '../utils/naturalSort';
import { MapPin, Image as ImageIcon, Filter, ArrowUp, ArrowDown } from 'lucide-react';
import { getDisplayableImageUrl } from '../utils/imageHelpers';

interface ItemCardViewProps {
  items: InventoryItem[];
  onSelectItem: (item: InventoryItem) => void;
  onSelectCategory?: (category: string) => void;
  onSelectManufacturer?: (manufacturer: string) => void;
}

export const ItemCardView: React.FC<ItemCardViewProps> = ({
  items,
  onSelectItem,
  onSelectCategory,
  onSelectManufacturer,
}) => {
  const [sortAsc, setSortAsc] = useState(true);

  if (items.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400 text-sm">
        Nincs megjeleníthető tétel a megadott szűrési feltételekkel.
      </div>
    );
  }

  // Natural alphanumeric sort
  const sortedItems = [...items].sort((a, b) => {
    const res = naturalCompare(a.id, b.id);
    return sortAsc ? res : -res;
  });

  return (
    <div className="space-y-4">
      {/* Quick sort info bar */}
      <div className="flex items-center justify-between px-1 text-xs sm:text-sm font-semibold text-slate-600">
        <span>Kártyás megjelenítés ({sortedItems.length} db elem)</span>
        <button
          type="button"
          onClick={() => setSortAsc(!sortAsc)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer text-slate-700 font-bold"
        >
          <span>Termék ID sorrend ({sortAsc ? '1→100' : '100→1'})</span>
          {sortAsc ? <ArrowUp className="w-4 h-4 text-blue-600" /> : <ArrowDown className="w-4 h-4 text-blue-600" />}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {sortedItems.map((item) => (
          <div
            key={item.id}
            className="bg-white rounded-xl border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all overflow-hidden flex flex-col group"
          >
            {/* Top thumbnail or placeholder */}
            <div
              onClick={() => onSelectItem(item)}
              className="h-40 bg-slate-100 flex items-center justify-center relative overflow-hidden border-b border-slate-100 cursor-pointer"
            >
              {item.image ? (
                <img
                  src={getDisplayableImageUrl(item.image)}
                  alt={item.name}
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                    e.currentTarget.parentElement?.classList.add('image-fallback');
                  }}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-slate-300">
                  <ImageIcon className="w-9 h-9 stroke-1 mb-1.5" />
                  <span className="text-xs text-slate-400 font-medium">Nincs kép</span>
                </div>
              )}
              {item.quality && (
                <span className={`absolute top-2.5 right-2.5 px-2.5 py-0.5 text-xs font-bold rounded shadow-xs ${
                  item.quality === 'Új' ? 'bg-emerald-600 text-white' : 'bg-amber-600 text-white'
                }`}>
                  {item.quality}
                </span>
              )}
            </div>

            {/* Content */}
            <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
              <div>
                <button
                  type="button"
                  onClick={() => onSelectItem(item)}
                  className="text-left group/btn w-full focus:outline-none"
                >
                  <div className="text-base font-mono font-black text-blue-600 group-hover/btn:text-blue-700 transition-colors mb-1">
                    {item.id}
                  </div>
                  <h4 className="text-base sm:text-lg font-bold text-slate-900 group-hover/btn:text-blue-700 transition-colors line-clamp-1 mb-3">
                    {item.name}
                  </h4>
                </button>

                <div className="space-y-2 text-xs sm:text-sm">
                  <div className="flex items-center justify-between text-slate-500">
                    <span>Kategória:</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectCategory?.(item.category);
                      }}
                      className="font-bold text-teal-700 hover:text-teal-900 hover:bg-teal-50 px-2 py-0.5 rounded-md transition-colors cursor-pointer"
                      title={`Szűrés a(z) ${item.category} kategóriára`}
                    >
                      <span>{item.category}</span>
                    </button>
                  </div>

                  <div className="flex items-center justify-between text-slate-500">
                    <span>Gyártó:</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectManufacturer?.(item.manufacturer);
                      }}
                      className="font-bold text-blue-700 hover:text-blue-900 hover:bg-blue-50 px-2 py-0.5 rounded-md transition-colors cursor-pointer"
                      title={`Szűrés a(z) ${item.manufacturer} gyártóra`}
                    >
                      <span>{item.manufacturer}</span>
                    </button>
                  </div>

                  {item.factoryCode && item.factoryCode !== '-' && (
                    <div className="flex items-center justify-between text-slate-500">
                      <span>Gyári kód:</span>
                      <span className="font-mono font-medium text-slate-800">{item.factoryCode}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Location badge */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs sm:text-sm font-semibold">
                {item.location ? (
                  <div className="flex items-center gap-1.5 text-teal-800 truncate">
                    <MapPin className="w-4 h-4 text-teal-600 shrink-0" />
                    <span className="truncate">{item.location}</span>
                  </div>
                ) : (
                  <span className="text-slate-400 italic">Nincs megadva hely</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
