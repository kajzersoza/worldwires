import React, { useState, useEffect } from 'react';
import { X, Save, Box, Trash2 } from 'lucide-react';
import { InventoryItem } from '../types/inventory';

interface ItemFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: InventoryItem) => void;
  initialItem?: InventoryItem | null;
  categories: string[];
  manufacturers: string[];
  locations: string[];
}

export const ItemFormModal: React.FC<ItemFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialItem,
  categories,
  manufacturers,
  locations,
}) => {
  const isEdit = Boolean(initialItem);

  const [id, setId] = useState(initialItem?.id || '');
  const [name, setName] = useState(initialItem?.name || '');
  const [category, setCategory] = useState(initialItem?.category || 'Saruzófej');
  const [manufacturer, setManufacturer] = useState(initialItem?.manufacturer || 'Mecal');
  const [location, setLocation] = useState(initialItem?.location || 'Alkatrész A1');
  const [factoryCode, setFactoryCode] = useState(initialItem?.factoryCode || '');
  const [feeding, setFeeding] = useState(initialItem?.feeding || '');
  const [insulationType, setInsulationType] = useState(initialItem?.insulationType || '');
  const [quality, setQuality] = useState(initialItem?.quality || 'Új');
  const [description, setDescription] = useState(initialItem?.description || '');
  const [image, setImage] = useState(initialItem?.image || '');
  const [connectorType, setConnectorType] = useState(initialItem?.connectorType || '');
  const [terminalType, setTerminalType] = useState(initialItem?.terminalType || '');
  const [date, setDate] = useState(initialItem?.date || new Date().toLocaleDateString('hu-HU'));

  useEffect(() => {
    if (initialItem) {
      setId(initialItem.id || '');
      setName(initialItem.name || '');
      setCategory(initialItem.category || 'Saruzófej');
      setManufacturer(initialItem.manufacturer || 'Mecal');
      setLocation(initialItem.location || 'Alkatrész A1');
      setFactoryCode(initialItem.factoryCode || '');
      setFeeding(initialItem.feeding || '');
      setInsulationType(initialItem.insulationType || '');
      setQuality(initialItem.quality || 'Új');
      setDescription(initialItem.description || '');
      setImage(initialItem.image || '');
      setConnectorType(initialItem.connectorType || '');
      setTerminalType(initialItem.terminalType || '');
      setDate(initialItem.date || new Date().toLocaleDateString('hu-HU'));
    } else {
      setId('');
      setName('');
      setCategory('Saruzófej');
      setManufacturer('Mecal');
      setLocation('Alkatrész A1');
      setFactoryCode('');
      setFeeding('');
      setInsulationType('');
      setQuality('Új');
      setDescription('');
      setImage('');
      setConnectorType('');
      setTerminalType('');
      setDate(new Date().toLocaleDateString('hu-HU'));
    }
  }, [initialItem, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!id.trim() || !name.trim()) {
      alert('A Termék ID és a Termék név kitöltése kötelező!');
      return;
    }

    const cleanedImage = image.trim();
    const updatedImages = initialItem?.images
      ? initialItem.images.filter((img) => img !== cleanedImage && img !== initialItem.image)
      : [];

    onSave({
      id: id.trim(),
      name: name.trim(),
      category: category.trim() || 'Egyéb',
      manufacturer: manufacturer.trim() || '-',
      location: location.trim(),
      factoryCode: factoryCode.trim(),
      feeding: feeding.trim(),
      insulationType: insulationType.trim(),
      quality: quality.trim(),
      description: description.trim(),
      image: cleanedImage,
      images: cleanedImage ? [cleanedImage, ...updatedImages] : (updatedImages.length > 0 ? updatedImages : []),
      connectorType: connectorType.trim(),
      terminalType: terminalType.trim(),
      date: date.trim(),
      updatedAt: Date.now(),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-4 sm:my-6 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 bg-slate-50/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs shrink-0">
              <Box className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                {isEdit ? 'Tétel Szerkesztése' : 'Új Raktári Tétel Hozzáadása'}
              </h2>
              <p className="text-xs text-slate-500 font-mono">
                {isEdit ? `ID: ${initialItem?.id}` : 'Adj meg minden ismert adatot az új tételhez'}
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto space-y-4 text-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block font-bold text-slate-700 mb-1 text-xs sm:text-sm">
                Termék ID *
              </label>
              <input
                type="text"
                required
                disabled={isEdit}
                value={id}
                onChange={(e) => setId(e.target.value)}
                placeholder="pl. 40101.00.30"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 font-mono text-sm disabled:opacity-60"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1 text-xs sm:text-sm">
                Termék Név *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="pl. N183 vagy FIX ÜLLŐ"
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 font-bold text-sm text-slate-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block font-bold text-teal-700 mb-1 text-xs sm:text-sm">
                Kategória
              </label>
              <input
                type="text"
                list="category-options"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="pl. Saruzófej, Mérődoboz"
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-teal-500 text-sm font-semibold"
              />
              <datalist id="category-options">
                {categories.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>

            <div>
              <label className="block font-bold text-blue-700 mb-1 text-xs sm:text-sm">
                Gyártó
              </label>
              <input
                type="text"
                list="manufacturer-options"
                value={manufacturer}
                onChange={(e) => setManufacturer(e.target.value)}
                placeholder="pl. Mecal, AMP, WorldWires"
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 text-sm font-semibold"
              />
              <datalist id="manufacturer-options">
                {manufacturers.map((m) => (
                  <option key={m} value={m} />
                ))}
              </datalist>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block font-bold text-teal-700 mb-1 text-xs sm:text-sm">
                Alkatrész Helye (Pozíció)
              </label>
              <input
                type="text"
                list="location-options"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="pl. Alkatrész A2, TMK"
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-teal-500 font-bold text-sm text-teal-900"
              />
              <datalist id="location-options">
                {locations.map((l) => (
                  <option key={l} value={l} />
                ))}
              </datalist>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1 text-xs sm:text-sm">
                Gyári Kód
              </label>
              <input
                type="text"
                value={factoryCode}
                onChange={(e) => setFactoryCode(e.target.value)}
                placeholder="pl. 7159 vagy MLS0185-J"
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 font-mono text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div>
              <label className="block font-bold text-slate-700 mb-1 text-xs sm:text-sm">
                Adagolás
              </label>
              <select
                value={feeding}
                onChange={(e) => setFeeding(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 text-sm font-medium"
              >
                <option value="">- Nincs megadva -</option>
                <option value="Hátsó">Hátsó</option>
                <option value="Oldal">Oldal</option>
                <option value="Egyéb">Egyéb</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1 text-xs sm:text-sm">
                Szigelés Típus
              </label>
              <select
                value={insulationType}
                onChange={(e) => setInsulationType(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 text-sm font-medium"
              >
                <option value="">- Nincs megadva -</option>
                <option value="Nem Gumis">Nem Gumis</option>
                <option value="Gumis">Gumis</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1 text-xs sm:text-sm">
                Minőség / Állapot
              </label>
              <select
                value={quality}
                onChange={(e) => setQuality(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 font-bold text-sm"
              >
                <option value="Új">Új</option>
                <option value="Használt">Használt</option>
                <option value="Javítás alatt">Javítás alatt</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div>
              <label className="block font-bold text-slate-700 mb-1 text-xs sm:text-sm">
                Konektor Típusa
              </label>
              <select
                value={connectorType}
                onChange={(e) => setConnectorType(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 text-sm font-medium"
              >
                <option value="">-</option>
                <option value="Apa">Apa</option>
                <option value="Anya">Anya</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1 text-xs sm:text-sm">
                Saru Típusa
              </label>
              <input
                type="text"
                value={terminalType}
                onChange={(e) => setTerminalType(e.target.value)}
                placeholder="pl. F, O, C"
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 text-sm"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1 text-xs sm:text-sm">
                Dátum
              </label>
              <input
                type="text"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                placeholder="pl. 2024. 09. 01."
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 font-mono text-sm"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block font-bold text-slate-700 text-xs sm:text-sm">
                Kép URL vagy Google Drive link
              </label>
              {image && (
                <button
                  type="button"
                  onClick={() => setImage('')}
                  className="text-xs text-red-600 hover:text-red-700 font-bold inline-flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Kép törlése / mező kiürítése</span>
                </button>
              )}
            </div>
            <div className="relative">
              <input
                type="text"
                value={image}
                onChange={(e) => setImage(e.target.value)}
                placeholder="https://drive.google.com/... vagy kép URL"
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 text-sm pr-10"
              />
              {image && (
                <button
                  type="button"
                  onClick={() => setImage('')}
                  className="absolute right-2.5 top-2.5 p-1 text-slate-400 hover:text-red-600 rounded-md hover:bg-slate-100 transition-colors cursor-pointer"
                  title="Kép mező kiürítése"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            {image && (
              <p className="text-[11px] text-slate-500 mt-1">
                A mentés gombra kattintva a megadott kép frissül vagy ha kiüríted, véglegesen törlődik a tételről.
              </p>
            )}
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1 text-xs sm:text-sm">
              Leírás / Megjegyzések
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Egyedi megjegyzések, paraméterek..."
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 text-sm"
            />
          </div>

          {/* Footer buttons */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors cursor-pointer text-sm"
            >
              Mégse
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-xs transition-colors cursor-pointer text-sm"
            >
              <Save className="w-4 h-4" />
              <span>Mentés</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
