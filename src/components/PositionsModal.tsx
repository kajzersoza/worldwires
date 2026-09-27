import React, { useState } from 'react';
import {
  X,
  MapPin,
  Search,
  Plus,
  Filter,
  Edit2,
  Trash2,
  Check,
  RotateCcw,
  LayoutList,
  LayoutGrid,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { InventoryItem, PositionItem } from '../types/inventory';
import { naturalCompare } from '../utils/naturalSort';

interface PositionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: InventoryItem[];
  positions: PositionItem[];
  onSelectPosition: (posName: string) => void;
  onSavePosition: (pos: PositionItem) => Promise<void>;
  onDeletePosition: (id: string) => Promise<void>;
  onResetPositions?: () => Promise<void>;
}

export const PositionsModal: React.FC<PositionsModalProps> = ({
  isOpen,
  onClose,
  items,
  positions,
  onSelectPosition,
  onSavePosition,
  onDeletePosition,
  onResetPositions,
}) => {
  // Primary default is 'list' as requested by the user
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [search, setSearch] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newId, setNewId] = useState('');
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');

  // Editing state
  const [editingPosId, setEditingPosId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');

  // Pagination for smooth handling of 950+ positions
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);

  if (!isOpen) return null;

  // Count items assigned to each location
  const itemCountByLoc = new Map<string, number>();
  for (const item of items) {
    const loc = item.location?.trim();
    if (loc) {
      itemCountByLoc.set(loc, (itemCountByLoc.get(loc) || 0) + 1);
    }
  }

  // Filter and sort positions naturally (1, 2, ... 9, 10, ... 100)
  const filteredPositions = positions
    .filter((p) => {
      const q = search.toLowerCase().trim();
      if (!q) return true;
      return (
        p.id.toLowerCase().includes(q) ||
        p.name.toLowerCase().includes(q) ||
        (p.description && p.description.toLowerCase().includes(q))
      );
    })
    .sort((a, b) => naturalCompare(a.id, b.id));

  const totalPages = Math.ceil(filteredPositions.length / pageSize) || 1;
  const startIndex = (page - 1) * pageSize;
  const paginatedPositions = filteredPositions.slice(startIndex, startIndex + pageSize);

  const handleStartAdd = () => {
    setShowAddForm(true);
    setNewId('');
    setNewName('');
    setNewDesc('');
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = newId.trim();
    if (!id) return;
    const name = newName.trim() || id;
    await onSavePosition({
      id,
      name,
      description: newDesc.trim() || undefined,
    });
    setShowAddForm(false);
    setNewId('');
    setNewName('');
    setNewDesc('');
  };

  const handleStartEdit = (pos: PositionItem) => {
    setEditingPosId(pos.id);
    setEditName(pos.name);
    setEditDesc(pos.description || '');
  };

  const handleSaveEdit = async (posId: string) => {
    const existing = positions.find((p) => p.id === posId);
    if (!existing) return;
    await onSavePosition({
      ...existing,
      name: editName.trim() || posId,
      description: editDesc.trim() || undefined,
    });
    setEditingPosId(null);
  };

  const handleDelete = async (posId: string) => {
    if (window.confirm(`Biztosan törölni szeretnéd a(z) "${posId}" pozíciót?`)) {
      await onDeletePosition(posId);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-2 sm:my-6 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-xs shrink-0">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-slate-900">
                  Raktári Pozíciók Kezelése
                </h2>
                <span className="px-2.5 py-0.5 text-xs font-bold text-teal-900 bg-teal-100 rounded-full tabular-nums">
                  {positions.length} db pozíció
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500">
                Polcok, rekeszek, raktári helyszínek és munkaállomások adatbázisa
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

        {/* Toolbar */}
        <div className="p-3 sm:p-4 border-b border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white">
          {/* Search box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Pozíció keresése (pl. A1, Polc 1, Alkatrész A2, TMK, Raktár)..."
              className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-teal-500 focus:bg-white"
            />
          </div>

          {/* Action and view buttons */}
          <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0">
            {/* View Mode Toggle: Lista (default) vs Rács */}
            <div className="inline-flex rounded-xl border border-slate-200 bg-slate-50 p-1 shrink-0">
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                  viewMode === 'list'
                    ? 'bg-teal-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Lista nézet (alapértelmezett)"
              >
                <LayoutList className="w-3.5 h-3.5" />
                <span>Lista</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-teal-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Rács / Kártya nézet"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Rács</span>
              </button>
            </div>

            <button
              type="button"
              onClick={handleStartAdd}
              className="flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-bold text-teal-900 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-xl transition-colors cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Új Pozíció</span>
            </button>

            {onResetPositions && (
              <button
                type="button"
                onClick={async () => {
                  if (window.confirm('Visszaállítod az eredeti 957 pozíciót tartalmazó törzsadatbázist?')) {
                    await onResetPositions();
                  }
                }}
                title="Pozíciók visszaállítása az induló 957 darabos mintára"
                className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* New Position Form */}
        {showAddForm && (
          <form onSubmit={handleAddSubmit} className="p-4 bg-teal-50/80 border-b border-teal-200 space-y-3">
            <div className="text-xs font-bold text-teal-900 uppercase tracking-wider">
              Új Raktári Pozíció Felvétele
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <input
                type="text"
                required
                value={newId}
                onChange={(e) => setNewId(e.target.value)}
                placeholder="Pozíció ID (pl. Raktár Z9)"
                className="px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-teal-500 font-bold"
                autoFocus
              />
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Megnevezés (opcionális)"
                className="px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-teal-500"
              />
              <input
                type="text"
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder="Leírás / megjegyzés"
                className="px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-teal-500"
              />
            </div>
            <div className="flex items-center gap-2 justify-end">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-4 py-1.5 bg-slate-200 text-slate-700 text-xs font-bold rounded-lg hover:bg-slate-300 cursor-pointer"
              >
                Mégse
              </button>
              <button
                type="submit"
                className="px-5 py-1.5 bg-teal-600 text-white text-xs font-bold rounded-lg hover:bg-teal-700 cursor-pointer"
              >
                Hozzáadás
              </button>
            </div>
          </form>
        )}

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto">
          {filteredPositions.length === 0 ? (
            <div className="py-20 text-center text-slate-400 text-sm">
              Nem található a keresésnek megfelelő pozíció.
            </div>
          ) : viewMode === 'list' ? (
            /* LISTA NÉZET (Elsődleges / Alapértelmezett) */
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/90 text-slate-600 font-bold uppercase tracking-wider select-none sticky top-0 z-10">
                    <th className="py-3 px-4 w-32 sm:w-44">POZÍCIÓ ID</th>
                    <th className="py-3 px-4">MEGNEVEZÉS</th>
                    <th className="py-3 px-4 hidden md:table-cell">LEÍRÁS</th>
                    <th className="py-3 px-4 text-center w-28">TÉTELEK</th>
                    <th className="py-3 px-4 text-right w-36">MŰVELETEK</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {paginatedPositions.map((pos) => {
                    const isEditing = editingPosId === pos.id;
                    const assignedCount = itemCountByLoc.get(pos.name) || itemCountByLoc.get(pos.id) || 0;

                    if (isEditing) {
                      return (
                        <tr key={pos.id} className="bg-teal-50/50">
                          <td className="py-2.5 px-4 font-mono font-bold text-teal-800">
                            {pos.id}
                          </td>
                          <td className="py-2.5 px-4">
                            <input
                              type="text"
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              className="w-full px-2.5 py-1 text-xs sm:text-sm bg-white border border-teal-400 rounded-lg focus:outline-none font-bold"
                              autoFocus
                            />
                          </td>
                          <td className="py-2.5 px-4 hidden md:table-cell">
                            <input
                              type="text"
                              value={editDesc}
                              onChange={(e) => setEditDesc(e.target.value)}
                              placeholder="Opcionális leírás"
                              className="w-full px-2.5 py-1 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none"
                            />
                          </td>
                          <td className="py-2.5 px-4 text-center">
                            {assignedCount > 0 ? (
                              <span className="px-2 py-0.5 bg-teal-100 text-teal-900 rounded font-bold text-xs">
                                {assignedCount} db
                              </span>
                            ) : (
                              <span className="text-slate-400">-</span>
                            )}
                          </td>
                          <td className="py-2.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => setEditingPosId(null)}
                                className="px-2.5 py-1 text-xs text-slate-600 hover:bg-slate-200 rounded-lg"
                              >
                                Mégse
                              </button>
                              <button
                                type="button"
                                onClick={() => handleSaveEdit(pos.id)}
                                className="px-3 py-1 text-xs font-bold bg-teal-600 text-white rounded-lg hover:bg-teal-700 flex items-center gap-1"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>Mentés</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    }

                    return (
                      <tr
                        key={pos.id}
                        className="hover:bg-teal-50/30 transition-colors group cursor-pointer"
                        onClick={() => {
                          onSelectPosition(pos.name);
                          onClose();
                        }}
                      >
                        <td className="py-3 px-4 font-mono font-bold text-teal-900 flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                          <span className="font-extrabold">{pos.id}</span>
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-900">
                          <span className="group-hover:text-teal-900 transition-colors">
                            {pos.name}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-500 italic hidden md:table-cell">
                          {pos.description || '-'}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {assignedCount > 0 ? (
                            <span className="px-2 py-0.5 bg-teal-100 text-teal-900 rounded font-bold text-xs tabular-nums">
                              {assignedCount} db
                            </span>
                          ) : (
                            <span className="text-slate-300">-</span>
                          )}
                        </td>
                        <td
                          className="py-3 px-4 text-right"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                onSelectPosition(pos.name);
                                onClose();
                              }}
                              className="px-2 py-1 text-teal-700 hover:bg-teal-50 rounded-lg font-bold inline-flex items-center gap-1 text-xs"
                              title="Szűrés a pozíció tételeire"
                            >
                              <Filter className="w-3 h-3 text-teal-600" />
                              <span>Szűrés</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleStartEdit(pos)}
                              className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg cursor-pointer"
                              title="Szerkesztés"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(pos.id)}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg cursor-pointer"
                              title="Törlés"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            /* RÁCS / KÁRTYA NÉZET */
            <div className="p-3 sm:p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
              {paginatedPositions.map((pos) => {
                const isEditing = editingPosId === pos.id;
                const assignedCount = itemCountByLoc.get(pos.name) || itemCountByLoc.get(pos.id) || 0;

                return (
                  <div
                    key={pos.id}
                    className="p-3 rounded-xl border border-slate-200 hover:border-teal-400 bg-white hover:bg-teal-50/20 transition-all flex flex-col justify-between gap-2 shadow-2xs group"
                  >
                    {isEditing ? (
                      <div className="space-y-2">
                        <div className="text-xs font-mono font-bold text-slate-500">{pos.id}</div>
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          placeholder="Pozíció név"
                          className="w-full px-2 py-1 text-xs bg-white border border-slate-300 rounded focus:outline-none focus:border-teal-500 font-bold"
                          autoFocus
                        />
                        <input
                          type="text"
                          value={editDesc}
                          onChange={(e) => setEditDesc(e.target.value)}
                          placeholder="Leírás"
                          className="w-full px-2 py-1 text-xs bg-white border border-slate-300 rounded focus:outline-none focus:border-teal-500"
                        />
                        <div className="flex items-center gap-1 justify-end pt-1">
                          <button
                            type="button"
                            onClick={() => setEditingPosId(null)}
                            className="p-1 text-xs text-slate-500 hover:bg-slate-100 rounded"
                          >
                            Mégse
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSaveEdit(pos.id)}
                            className="px-2 py-1 text-xs font-bold bg-teal-600 text-white rounded hover:bg-teal-700 flex items-center gap-1"
                          >
                            <Check className="w-3 h-3" />
                            <span>Mentés</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-start justify-between gap-1.5">
                          <div className="flex items-center gap-2 truncate">
                            <MapPin className="w-4 h-4 text-teal-600 shrink-0" />
                            <div className="truncate">
                              <span className="text-sm font-extrabold text-slate-900 group-hover:text-teal-900 block truncate">
                                {pos.name}
                              </span>
                              {pos.name !== pos.id && (
                                <span className="text-[11px] font-mono text-slate-400 block truncate">
                                  ID: {pos.id}
                                </span>
                              )}
                              {pos.description && (
                                <span className="text-[11px] text-slate-500 italic block truncate">
                                  {pos.description}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            {assignedCount > 0 && (
                              <span className="px-2 py-0.5 text-xs font-bold rounded tabular-nums bg-teal-100 text-teal-900">
                                {assignedCount} db
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Action buttons on card hover */}
                        <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-xs">
                          <button
                            type="button"
                            onClick={() => {
                              onSelectPosition(pos.name);
                              onClose();
                            }}
                            className="px-2 py-0.5 rounded font-bold text-teal-700 hover:text-teal-900 hover:bg-teal-100/60 inline-flex items-center gap-1 cursor-pointer transition-colors"
                            title="Szűrés erre a pozícióra"
                          >
                            <Filter className="w-3 h-3 text-teal-600" />
                            <span>Szűrés</span>
                          </button>

                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleStartEdit(pos)}
                              className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded cursor-pointer"
                              title="Pozíció szerkesztése"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(pos.id)}
                              className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded cursor-pointer"
                              title="Pozíció törlése"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer with Pagination */}
        <div className="p-3 sm:p-4 border-t border-slate-100 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs sm:text-sm text-slate-500">
          <div className="flex items-center gap-2">
            <span>Oldalméret:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
              className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-800 font-bold"
            >
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={200}>200</option>
              <option value={1000}>Összes</option>
            </select>
            <span className="text-slate-600 tabular-nums">
              ({startIndex + 1} - {Math.min(startIndex + pageSize, filteredPositions.length)} / {filteredPositions.length})
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-1.5 border border-slate-200 rounded-lg hover:bg-slate-100 disabled:opacity-40 text-slate-700 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 font-bold text-slate-800 tabular-nums text-xs sm:text-sm">
              {page} / {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-1.5 border border-slate-200 rounded-lg hover:bg-slate-100 disabled:opacity-40 text-slate-700 cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={onClose}
              className="ml-2 px-5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl transition-colors cursor-pointer text-xs sm:text-sm"
            >
              Bezárás
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
