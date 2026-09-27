import React, { useState, useMemo, useEffect, useRef } from 'react';
import { InventoryItem, MaintenanceRecord, ProductRelation } from '../types/inventory';
import { warehouseDB } from '../db/indexedDb';
import { MaintenanceHistorySection } from './MaintenanceHistorySection';
import { AddMaintenanceModal } from './AddMaintenanceModal';
import { SimilarProductsCard } from './SimilarProductsCard';
import { AddSimilarModal } from './AddSimilarModal';
import { ConnectorTerminalCard } from './ConnectorTerminalCard';
import { AddConnectorTerminalModal } from './AddConnectorTerminalModal';
import {
  ArrowLeft,
  Edit,
  Trash2,
  Plus,
  Image as ImageIcon,
  MapPin,
  ExternalLink,
  ZoomIn,
  ChevronLeft,
  ChevronRight,
  FileDown,
  Wrench,
  Network,
  ChevronDown,
  Link2,
  Cable,
  Star
} from 'lucide-react';
import { ImageLightboxModal } from './ImageLightboxModal';
import { exportItemDatasheetToPDF } from '../utils/pdfExport';

interface ItemDetailViewProps {
  item: InventoryItem;
  allItems?: InventoryItem[];
  onBack: () => void;
  onEdit: (item: InventoryItem) => void;
  onDelete: (id: string) => void;
  onUpdateImage: (id: string, newImageUrl: string) => void;
  onUpdateImages?: (id: string, newImages: string[]) => void;
  onFilterByLocation?: (loc: string) => void;
  onFilterByCategory?: (cat: string) => void;
  onFilterByManufacturer?: (mfg: string) => void;
  maintenanceRecords?: MaintenanceRecord[];
  onNavigateToItem?: (itemId: string) => void;
  onMaintenanceAdded?: () => void;
  onRelationChanged?: () => void;
}

export const ItemDetailView: React.FC<ItemDetailViewProps> = ({
  item,
  allItems = [],
  onBack,
  onEdit,
  onDelete,
  onUpdateImage,
  onUpdateImages,
  onFilterByLocation,
  onFilterByCategory,
  onFilterByManufacturer,
  maintenanceRecords,
  onNavigateToItem,
  onMaintenanceAdded,
  onRelationChanged,
}) => {
  const [showImagePrompt, setShowImagePrompt] = useState(false);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [localMaintenance, setLocalMaintenance] = useState<MaintenanceRecord[]>([]);
  const [isAddMaintenanceOpen, setIsAddMaintenanceOpen] = useState(false);

  // Relations state (Kapcsolat / Hasonló)
  const [relations, setRelations] = useState<ProductRelation[]>([]);
  const [isAddSimilarOpen, setIsAddSimilarOpen] = useState(false);

  // Konnektor & Saru relations state
  const [connectorTerminalRelations, setConnectorTerminalRelations] = useState<ProductRelation[]>([]);
  const [isAddConnectorTerminalOpen, setIsAddConnectorTerminalOpen] = useState(false);

  const [isKapcsolatMenuOpen, setIsKapcsolatMenuOpen] = useState(false);
  const kapcsolatMenuRef = useRef<HTMLDivElement>(null);

  // Check if current item belongs to "Konnektor" or "Saru" category (case-insensitive check)
  const isConnectorOrTerminalItem = useMemo(() => {
    if (!item.category) return false;
    const cat = item.category.trim().toLowerCase();
    return (
      cat === 'konnektor' ||
      cat === 'konektor' ||
      cat === 'saru' ||
      cat === 'saruk' ||
      cat === 'konnektorok' ||
      cat.startsWith('konnektor') ||
      cat.startsWith('saru')
    );
  }, [item.category]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (kapcsolatMenuRef.current && !kapcsolatMenuRef.current.contains(event.target as Node)) {
        setIsKapcsolatMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadMaintenance = async () => {
    try {
      const recs = await warehouseDB.getMaintenanceRecordsForItem(item.id);
      setLocalMaintenance(recs);
    } catch (err) {
      console.error('Failed to load item maintenance records:', err);
    }
  };

  const loadRelations = async () => {
    try {
      const rels = await warehouseDB.getSimilarItemsFor(item.id);
      setRelations(rels);

      const ctRels = await warehouseDB.getConnectorTerminalRelationsFor(item.id);
      setConnectorTerminalRelations(ctRels);
    } catch (err) {
      console.error('Failed to load relations:', err);
    }
  };

  useEffect(() => {
    loadMaintenance();
    loadRelations();
  }, [item.id]);

  const handleSaveMaintenanceRecord = async (record: MaintenanceRecord) => {
    await warehouseDB.saveMaintenanceRecord(record);
    await loadMaintenance();
    onMaintenanceAdded?.();
  };

  const handleSaveSimilarRelation = async (relation: ProductRelation) => {
    await warehouseDB.saveProductRelation(relation);
    await loadRelations();
    onRelationChanged?.();
  };

  const handleSaveConnectorTerminalRelation = async (relation: ProductRelation) => {
    await warehouseDB.saveProductRelation(relation);
    await loadRelations();
    onRelationChanged?.();
  };

  const handleDeleteRelation = async (relationId: string) => {
    await warehouseDB.deleteProductRelation(relationId);
    await loadRelations();
    onRelationChanged?.();
  };

  const effectiveRecords = maintenanceRecords && maintenanceRecords.length > 0 ? maintenanceRecords : localMaintenance;

  const handleExportPDF = async () => {
    try {
      setIsExportingPDF(true);
      await exportItemDatasheetToPDF(item, effectiveRecords, relations, allItems, connectorTerminalRelations);
    } catch (err) {
      console.error('Error exporting datasheet PDF:', err);
    } finally {
      setIsExportingPDF(false);
    }
  };

  // Convert Google Drive share link to direct image viewing URL if applicable
  const getDisplayableImageUrl = (url?: string) => {
    if (!url) return '';
    if (url.includes('drive.google.com/file/d/')) {
      const match = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
      if (match && match[1]) {
        return `https://drive.google.com/thumbnail?id=${match[1]}&sz=w1200`;
      }
    }
    return url;
  };

  // Compile all images (preserving primary image at index 0 and allowing seamless primary selection / deletion)
  const allImages = useMemo(() => {
    const list: string[] = [];
    if (item.image && item.image.trim()) {
      list.push(item.image.trim());
    }
    if (item.images && Array.isArray(item.images)) {
      item.images.forEach((img) => {
        if (img && img.trim() && !list.includes(img.trim())) {
          list.push(img.trim());
        }
      });
    }
    return list;
  }, [item.image, item.images]);

  // Ensure index is within bounds
  const safeIndex = selectedImageIndex < allImages.length ? selectedImageIndex : 0;
  const currentImageUrl = allImages[safeIndex] || '';
  const currentDisplayImage = getDisplayableImageUrl(currentImageUrl);

  // Handler to add a new image
  const handleAddImage = (newUrl: string) => {
    const trimmed = newUrl.trim();
    if (!trimmed) return;
    const updated = [...allImages, trimmed];
    if (onUpdateImages) {
      onUpdateImages(item.id, updated);
    } else {
      onUpdateImage(item.id, updated[0]);
    }
    setSelectedImageIndex(updated.length - 1);
    setShowImagePrompt(false);
    setImageUrlInput('');
  };

  const handleSaveImageForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (imageUrlInput.trim()) {
      handleAddImage(imageUrlInput);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        handleAddImage(dataUrl);
      }
    };
    reader.readAsDataURL(file);
  };

  // Handler to set a chosen image as the PRIMARY (main/borítókép) photo of the item
  const handleSetPrimaryImage = (indexToMakePrimary: number) => {
    if (indexToMakePrimary < 0 || indexToMakePrimary >= allImages.length) return;
    const targetImg = allImages[indexToMakePrimary];
    // Put targetImg at index 0, followed by the rest
    const remaining = allImages.filter((_, idx) => idx !== indexToMakePrimary);
    const updated = [targetImg, ...remaining];

    if (onUpdateImages) {
      onUpdateImages(item.id, updated);
    } else {
      onUpdateImage(item.id, targetImg);
    }
    setSelectedImageIndex(0);
  };

  // Handler to delete a specific image
  const handleDeleteSpecificImage = (indexToDelete: number) => {
    if (indexToDelete < 0 || indexToDelete >= allImages.length) return;
    if (window.confirm('Biztosan törölni szeretnéd ezt a képet a galériából?')) {
      const updated = allImages.filter((_, idx) => idx !== indexToDelete);
      if (onUpdateImages) {
        onUpdateImages(item.id, updated);
      } else {
        onUpdateImage(item.id, updated[0] || '');
      }
      setSelectedImageIndex((prev) => Math.max(0, Math.min(prev, Math.max(0, updated.length - 1))));
    }
  };

  // Helper: check if a field has a valid, non-empty value
  const hasValue = (val: string | undefined | null): boolean => {
    if (!val) return false;
    const trimmed = val.trim();
    return trimmed !== '' && trimmed !== '-' && trimmed !== 'undefined' && trimmed !== 'null';
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 sm:p-8">
      {/* Top action row */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
          <span>Vissza a listához</span>
        </button>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleExportPDF}
            disabled={isExportingPDF}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-bold text-slate-800 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg shadow-2xs transition-colors cursor-pointer disabled:opacity-60"
            title="A termék hivatalos adatlapjának mentése PDF dokumentumként"
          >
            <FileDown className="w-4 h-4 text-red-600" />
            <span>{isExportingPDF ? 'PDF készítése...' : 'Adatlap mentése PDF-be'}</span>
          </button>

          <button
            type="button"
            onClick={() => onEdit(item)}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <Edit className="w-4 h-4" />
            <span>Szerkesztés</span>
          </button>

          {/* Karbantartás hozzáadás gomb közvetlenül a Szerkesztés gomb mellett */}
          <button
            type="button"
            onClick={() => setIsAddMaintenanceOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-bold text-emerald-950 bg-emerald-50 hover:bg-emerald-100 border-2 border-emerald-300 hover:border-emerald-500 rounded-lg shadow-2xs transition-all cursor-pointer"
            title="Új szerviznapló vagy alkatrészcsere rögzítése ehhez a termékhez"
          >
            <Wrench className="w-4 h-4 text-emerald-700" />
            <span>Karbantartás</span>
            {effectiveRecords.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-emerald-700 text-white tabular-nums">
                {effectiveRecords.length}
              </span>
            )}
          </button>

          {/* Kapcsolat Dropdown Menu */}
          <div className="relative" ref={kapcsolatMenuRef}>
            <button
              type="button"
              onClick={() => setIsKapcsolatMenuOpen(!isKapcsolatMenuOpen)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-bold text-slate-800 bg-slate-50 hover:bg-slate-100 border-2 border-slate-300 hover:border-slate-500 rounded-lg shadow-2xs transition-all cursor-pointer"
              title="Termékkapcsolatok kezelése"
            >
              <Network className="w-4 h-4 text-slate-700" />
              <span>Kapcsolat</span>
              {(relations.length > 0 || (isConnectorOrTerminalItem && connectorTerminalRelations.length > 0)) && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-purple-700 text-white tabular-nums">
                  {relations.length + (isConnectorOrTerminalItem ? connectorTerminalRelations.length : 0)}
                </span>
              )}
              <ChevronDown className={`w-3.5 h-3.5 text-slate-700 transition-transform ${isKapcsolatMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu Options */}
            {isKapcsolatMenuOpen && (
              <div className="absolute right-0 mt-1.5 w-64 bg-white rounded-xl shadow-xl border-2 border-slate-700 py-1.5 z-30 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-3 py-1.5 border-b border-slate-100 text-[10px] font-black uppercase tracking-wider text-slate-600">
                  Kapcsolat Típusok
                </div>

                {/* 1. Hasonló kapcsolat (minden terméknél elérhető) */}
                <button
                  type="button"
                  onClick={() => {
                    setIsKapcsolatMenuOpen(false);
                    setIsAddSimilarOpen(true);
                  }}
                  className="w-full text-left px-3.5 py-2.5 text-xs font-bold text-slate-800 hover:bg-purple-50 hover:text-purple-950 flex items-center justify-between gap-2 transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-purple-600 group-hover:scale-125 transition-transform" />
                    <span>Hasonló</span>
                  </div>
                  <span className="text-[10px] font-mono text-purple-800 font-bold bg-purple-100 px-1.5 py-0.5 rounded">
                    + Hozzáadás
                  </span>
                </button>

                {/* 2. Konnektor & Saru kapcsolat (CSAK a Konnektor és a Saru kategóriájú termékeknél) */}
                {isConnectorOrTerminalItem && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsKapcsolatMenuOpen(false);
                      setIsAddConnectorTerminalOpen(true);
                    }}
                    className="w-full text-left px-3.5 py-2.5 text-xs font-bold text-slate-800 hover:bg-amber-50 hover:text-amber-950 flex items-center justify-between gap-2 transition-colors cursor-pointer group border-t border-slate-100"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500 group-hover:scale-125 transition-transform" />
                      <span>Konnektor & Saru</span>
                    </div>
                    <span className="text-[10px] font-mono text-amber-900 font-bold bg-amber-100 px-1.5 py-0.5 rounded border border-amber-300">
                      + Hozzáadás
                    </span>
                  </button>
                )}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => {
              if (window.confirm(`Biztosan törölni szeretnéd a(z) ${item.id} tételt?`)) {
                onDelete(item.id);
              }
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-red-600 hover:text-red-700 bg-white hover:bg-red-50 border border-red-200 rounded-lg transition-colors cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            <span>Törlés</span>
          </button>
        </div>
      </div>

      {/* Main Title section */}
      <div className="mb-6">
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <img src="/ww_logo.svg" alt="World Wires Kft." className="w-5 h-5 object-contain" />
          <span className="text-xs font-black tracking-wider uppercase text-teal-700 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded">
            World Wires Kft.
          </span>
          <span className="text-xs font-bold tracking-wider uppercase text-slate-400">
            · Hivatalos Adatlap
          </span>
          {effectiveRecords.length > 0 && (
            <span className="text-xs font-bold text-emerald-900 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded flex items-center gap-1">
              <Wrench className="w-3 h-3 text-emerald-800" />
              <span>Karbantartva ({effectiveRecords.length})</span>
            </span>
          )}
          {relations.length > 0 && (
            <span className="text-xs font-bold text-purple-950 bg-purple-100 border border-purple-300 px-2 py-0.5 rounded flex items-center gap-1">
              <Network className="w-3 h-3 text-purple-700" />
              <span>Hasonló ({relations.length})</span>
            </span>
          )}
          {isConnectorOrTerminalItem && connectorTerminalRelations.length > 0 && (
            <span className="text-xs font-bold text-amber-950 bg-amber-100 border border-amber-400 px-2 py-0.5 rounded flex items-center gap-1">
              <Cable className="w-3 h-3 text-amber-700" />
              <span>Konnektor / Saru ({connectorTerminalRelations.length})</span>
            </span>
          )}
        </div>
        <div className="text-xs font-bold tracking-wider uppercase text-slate-500 mt-2">
          TERMÉK ID
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-mono mt-0.5">
          {item.id}
        </h1>
        {hasValue(item.name) && (
          <div className="text-lg sm:text-xl font-bold text-blue-600 mt-1">
            {item.name}
          </div>
        )}
      </div>

      {/* Product Photos & Images Card with Multiple Images & Thumbnails */}
      <div className="border border-slate-200 rounded-xl p-4 sm:p-5 mb-6 bg-white shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2 text-sm sm:text-base font-bold text-slate-900">
            <ImageIcon className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
            <span>Termék Fotók & Képek</span>
            {allImages.length > 0 && (
              <span className="ml-1 px-2 py-0.5 text-xs font-bold rounded-full bg-slate-100 text-slate-700 tabular-nums">
                {allImages.length} db kép
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={() => setShowImagePrompt(!showImagePrompt)}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 text-xs sm:text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>+ Kép hozzáadása (Drive link / Fájl)</span>
          </button>
        </div>

        {/* Image input panel */}
        {showImagePrompt && (
          <div className="mb-4 p-4 bg-slate-50 border border-slate-200 rounded-xl">
            <form onSubmit={handleSaveImageForm} className="space-y-3">
              <div>
                <label className="block text-xs sm:text-sm font-bold text-slate-700 mb-1">
                  Google Drive kép link vagy nyilvános kép URL:
                </label>
                <input
                  type="text"
                  value={imageUrlInput}
                  onChange={(e) => setImageUrlInput(e.target.value)}
                  placeholder="https://drive.google.com/file/d/... vagy közvetlen kép link"
                  className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <label className="text-xs sm:text-sm font-semibold text-slate-600">Vagy fájl feltöltése:</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white text-xs sm:text-sm font-bold rounded-lg hover:bg-blue-700 cursor-pointer"
                >
                  Hozzáadás a galériához
                </button>
                <button
                  type="button"
                  onClick={() => setShowImagePrompt(false)}
                  className="px-4 py-2 bg-slate-200 text-slate-700 text-xs sm:text-sm font-semibold rounded-lg hover:bg-slate-300 cursor-pointer"
                >
                  Mégse
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Display image or dashed placeholder */}
        {allImages.length > 0 && currentDisplayImage ? (
          <div className="space-y-3">
            {/* Featured Image Box */}
            <div className="relative rounded-xl border border-slate-200 overflow-hidden bg-slate-50 min-h-64 sm:min-h-80 max-h-[500px] flex items-center justify-center p-3 group">
              <img
                src={currentDisplayImage}
                alt={`${item.name} (${safeIndex + 1})`}
                referrerPolicy="no-referrer"
                onClick={() => setIsLightboxOpen(true)}
                className="max-h-[460px] max-w-full object-contain rounded-lg shadow-xs cursor-zoom-in group-hover:scale-[1.01] transition-transform duration-200"
                title="Kattints a kép megnyitásához és nagyításához (Zoom)"
              />

              {/* Prev / Next arrows over main image if multiple */}
              {allImages.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedImageIndex((prev) => (prev - 1 + allImages.length) % allImages.length);
                    }}
                    className="absolute left-3 p-2.5 rounded-full bg-black/50 hover:bg-black/80 text-white transition-opacity opacity-75 group-hover:opacity-100 cursor-pointer"
                    title="Előző kép"
                  >
                    <ChevronLeft className="w-5 h-5 stroke-[2.5]" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedImageIndex((prev) => (prev + 1) % allImages.length);
                    }}
                    className="absolute right-3 p-2.5 rounded-full bg-black/50 hover:bg-black/80 text-white transition-opacity opacity-75 group-hover:opacity-100 cursor-pointer"
                    title="Következő kép"
                  >
                    <ChevronRight className="w-5 h-5 stroke-[2.5]" />
                  </button>
                </>
              )}

              {/* Bottom Action Bar over Image */}
              <div className="absolute bottom-3 right-3 flex flex-wrap items-center gap-2">
                {/* Ha nem az 1. kép (index 0), akkor egy gombbal beállítható fő/borító képként */}
                {safeIndex !== 0 ? (
                  <button
                    type="button"
                    onClick={() => handleSetPrimaryImage(safeIndex)}
                    className="px-3 py-1.5 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white rounded-lg shadow-sm inline-flex items-center gap-1.5 cursor-pointer transition-colors"
                    title="Ez a fotó legyen a termék főképje (borítóképe)"
                  >
                    <Star className="w-3.5 h-3.5 fill-white" />
                    <span>Beállítás Főképként</span>
                  </button>
                ) : (
                  <span className="px-2.5 py-1 text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300 rounded-lg inline-flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                    <span>Főkép (Borítókép)</span>
                  </span>
                )}

                <button
                  type="button"
                  onClick={() => setIsLightboxOpen(true)}
                  className="px-3 py-1.5 text-xs font-bold bg-white/95 hover:bg-white text-slate-800 border border-slate-200 rounded-lg shadow-xs inline-flex items-center gap-1.5 cursor-pointer"
                  title="Megnyitás nagy képernyőn és zoomolás"
                >
                  <ZoomIn className="w-3.5 h-3.5 text-blue-600" />
                  <span>Megnyitás & Zoom</span>
                </button>

                {currentImageUrl.startsWith('http') && (
                  <a
                    href={currentImageUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 text-xs font-bold bg-white/95 hover:bg-white text-slate-800 border border-slate-200 rounded-lg shadow-xs inline-flex items-center gap-1.5 hidden sm:inline-flex"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Eredeti</span>
                  </a>
                )}

                <button
                  type="button"
                  onClick={() => handleDeleteSpecificImage(safeIndex)}
                  className="px-3 py-1.5 text-xs font-bold bg-white/95 hover:bg-red-50 text-red-600 border border-red-200 rounded-lg shadow-xs cursor-pointer inline-flex items-center gap-1"
                  title="Ez a fotó törlése a galériából"
                >
                  <Trash2 className="w-3.5 h-3.5 text-red-600" />
                  <span>Kép törlése</span>
                </button>
              </div>

              {/* Image counter pill */}
              {allImages.length > 1 && (
                <div className="absolute top-3 left-3 px-2.5 py-1 text-xs font-bold bg-black/60 text-white rounded-lg backdrop-blur-xs tabular-nums flex items-center gap-1.5">
                  <span>{safeIndex + 1} / {allImages.length}</span>
                  {safeIndex === 0 && (
                    <span className="text-[10px] text-amber-300 font-black uppercase">· FŐKÉP</span>
                  )}
                </div>
              )}
            </div>

            {/* Thumbnails (Miniatűrök) bar when there are multiple pictures */}
            {allImages.length > 1 && (
              <div className="pt-2 border-t border-slate-100">
                <div className="text-[11px] font-bold text-slate-500 mb-1.5 flex items-center justify-between">
                  <span>Galéria miniatűrök ({allImages.length} db)</span>
                  <span className="text-[10px] text-slate-400">
                    Kattints a csillag ikonra a főkép megváltoztatásához
                  </span>
                </div>
                <div className="flex items-center gap-2.5 overflow-x-auto pb-2 pt-1">
                  {allImages.map((img, idx) => {
                    const thumbUrl = getDisplayableImageUrl(img);
                    const isActive = idx === safeIndex;
                    const isPrimary = idx === 0;
                    return (
                      <div
                        key={idx}
                        className={`relative group/thumb shrink-0 rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                          isActive
                            ? 'border-blue-600 shadow-md ring-2 ring-blue-500/30'
                            : 'border-slate-200 opacity-80 hover:opacity-100 hover:border-slate-400'
                        }`}
                        style={{ width: '78px', height: '78px' }}
                        onClick={() => setSelectedImageIndex(idx)}
                      >
                        <img
                          src={thumbUrl}
                          alt={`Miniatűr ${idx + 1}`}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />

                        {/* Primary Badge or Set-as-primary Star button */}
                        {isPrimary ? (
                          <div
                            className="absolute top-1 left-1 px-1 py-0.5 bg-amber-500 text-white text-[9px] font-black rounded shadow-xs flex items-center gap-0.5"
                            title="Ez a termék jelenlegi főképe (borítóképe)"
                          >
                            <Star className="w-2.5 h-2.5 fill-white" />
                            <span>FŐ</span>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSetPrimaryImage(idx);
                            }}
                            className="absolute top-1 left-1 p-1 bg-black/60 hover:bg-amber-500 text-white rounded opacity-0 group-hover/thumb:opacity-100 transition-opacity cursor-pointer"
                            title="Beállítás főképként"
                          >
                            <Star className="w-3 h-3 hover:fill-white" />
                          </button>
                        )}

                        {/* Quick delete overlay on thumbnail */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteSpecificImage(idx);
                          }}
                          className="absolute top-1 right-1 p-1 bg-black/70 hover:bg-red-600 text-white rounded opacity-0 group-hover/thumb:opacity-100 transition-opacity cursor-pointer"
                          title="Fotó törlése"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    );
                  })}

                  {/* Add more button thumbnail */}
                  <button
                    type="button"
                    onClick={() => setShowImagePrompt(true)}
                    className="shrink-0 rounded-xl border-2 border-dashed border-slate-300 hover:border-blue-500 hover:bg-blue-50/40 text-slate-500 hover:text-blue-600 flex flex-col items-center justify-center transition-colors cursor-pointer"
                    style={{ width: '78px', height: '78px' }}
                    title="További kép hozzáadása"
                  >
                    <Plus className="w-5 h-5 mb-0.5" />
                    <span className="text-[10px] font-bold">+ Kép</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="border border-dashed border-slate-300 rounded-lg p-8 sm:p-12 text-center flex flex-col items-center justify-center bg-white">
            <div className="w-12 h-12 rounded-lg flex items-center justify-center text-slate-300 mb-2">
              <ImageIcon className="w-9 h-9 stroke-1 text-slate-400" />
            </div>
            <p className="text-xs sm:text-sm font-bold text-slate-700">
              Még nincs feltöltve kép ehhez a tételhez.
            </p>
            <p className="text-[11px] sm:text-xs text-slate-400 max-w-md mt-1 leading-relaxed">
              A Google Drive-on megosztott képed linkjét egyszerűen beillesztheted ide a „+ Kép hozzáadása” gombbal, vagy tallózhatsz a gépedről.
            </p>
          </div>
        )}
      </div>

      {/* Key-Value Details Table matching ww02.png with column divider, only showing non-empty fields */}
      <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs bg-white">
        <table className="w-full text-left text-xs sm:text-sm border-collapse">
          <tbody className="divide-y divide-slate-200">
            {/* TERMÉK ID (Mandatory) */}
            {hasValue(item.id) && (
              <tr className="hover:bg-slate-50/40 transition-colors">
                <td className="w-1/3 sm:w-1/4 p-3 sm:p-4 font-bold uppercase tracking-wider text-slate-600 border-r border-slate-200 bg-white">
                  TERMÉK ID
                </td>
                <td className="p-3 sm:p-4 font-mono font-bold text-slate-900 bg-white">
                  {item.id}
                </td>
              </tr>
            )}

            {/* TERMÉK NÉV */}
            {hasValue(item.name) && (
              <tr className="hover:bg-slate-50/40 transition-colors">
                <td className="w-1/3 sm:w-1/4 p-3 sm:p-4 font-bold uppercase tracking-wider text-slate-600 border-r border-slate-200 bg-white">
                  TERMÉK NÉV
                </td>
                <td className="p-3 sm:p-4 font-bold text-slate-900 bg-white">
                  {item.name}
                </td>
              </tr>
            )}

            {/* KATEGÓRIA */}
            {hasValue(item.category) && (
              <tr className="hover:bg-slate-50/40 transition-colors">
                <td className="w-1/3 sm:w-1/4 p-3 sm:p-4 font-bold uppercase tracking-wider text-slate-600 border-r border-slate-200 bg-white">
                  KATEGÓRIA
                </td>
                <td className="p-3 sm:p-4 bg-white">
                  <button
                    type="button"
                    onClick={() => onFilterByCategory?.(item.category)}
                    className="font-extrabold text-teal-700 hover:text-teal-900 hover:bg-teal-50 px-2.5 py-1 -ml-1 rounded-lg transition-colors cursor-pointer"
                    title={`Szűrés erre a kategóriára: ${item.category}`}
                  >
                    <span>{item.category}</span>
                  </button>
                </td>
              </tr>
            )}

            {/* GYÁRTÓ */}
            {hasValue(item.manufacturer) && (
              <tr className="hover:bg-slate-50/40 transition-colors">
                <td className="w-1/3 sm:w-1/4 p-3 sm:p-4 font-bold uppercase tracking-wider text-slate-600 border-r border-slate-200 bg-white">
                  GYÁRTÓ
                </td>
                <td className="p-3 sm:p-4 bg-white">
                  <button
                    type="button"
                    onClick={() => onFilterByManufacturer?.(item.manufacturer)}
                    className="font-extrabold text-blue-700 hover:text-blue-900 hover:bg-blue-50 px-2.5 py-1 -ml-1 rounded-lg transition-colors cursor-pointer"
                    title={`Szűrés erre a gyártóra: ${item.manufacturer}`}
                  >
                    <span>{item.manufacturer}</span>
                  </button>
                </td>
              </tr>
            )}

            {/* ALKATRÉSZ HELY */}
            {hasValue(item.location) && (
              <tr className="hover:bg-slate-50/40 transition-colors">
                <td className="w-1/3 sm:w-1/4 p-3 sm:p-4 font-bold uppercase tracking-wider text-slate-600 border-r border-slate-200 bg-white">
                  ALKATRÉSZ HELY
                </td>
                <td className="p-3 sm:p-4 bg-white">
                  <button
                    type="button"
                    onClick={() => onFilterByLocation?.(item.location || '')}
                    className="inline-flex items-center gap-1.5 font-bold text-teal-700 hover:text-teal-900 hover:bg-teal-50 px-2.5 py-1 -ml-1 rounded-lg transition-colors cursor-pointer"
                    title={`Szűrés erre a pozícióra: ${item.location}`}
                  >
                    <MapPin className="w-4 h-4 text-teal-600" />
                    <span>{item.location}</span>
                  </button>
                </td>
              </tr>
            )}

            {/* GYÁRI KÓD */}
            {hasValue(item.factoryCode) && (
              <tr className="hover:bg-slate-50/40 transition-colors">
                <td className="w-1/3 sm:w-1/4 p-3 sm:p-4 font-bold uppercase tracking-wider text-slate-600 border-r border-slate-200 bg-white">
                  GYÁRI KÓD
                </td>
                <td className="p-3 sm:p-4 font-mono font-medium text-slate-900 bg-white">
                  {item.factoryCode}
                </td>
              </tr>
            )}

            {/* ADAGOLÁS */}
            {hasValue(item.feeding) && (
              <tr className="hover:bg-slate-50/40 transition-colors">
                <td className="w-1/3 sm:w-1/4 p-3 sm:p-4 font-bold uppercase tracking-wider text-slate-600 border-r border-slate-200 bg-white">
                  ADAGOLÁS
                </td>
                <td className="p-3 sm:p-4 font-bold text-slate-900 bg-white">
                  {item.feeding}
                </td>
              </tr>
            )}

            {/* SZIGELÉS TÍPUS */}
            {hasValue(item.insulationType) && (
              <tr className="hover:bg-slate-50/40 transition-colors">
                <td className="w-1/3 sm:w-1/4 p-3 sm:p-4 font-bold uppercase tracking-wider text-slate-600 border-r border-slate-200 bg-white">
                  SZIGELÉS TÍPUS
                </td>
                <td className="p-3 sm:p-4 font-bold text-slate-900 bg-white">
                  {item.insulationType}
                </td>
              </tr>
            )}

            {/* ALKATRÉSZ TÍPUS */}
            {hasValue(item.partType) && (
              <tr className="hover:bg-slate-50/40 transition-colors">
                <td className="w-1/3 sm:w-1/4 p-3 sm:p-4 font-bold uppercase tracking-wider text-slate-600 border-r border-slate-200 bg-white">
                  ALKATRÉSZ TÍPUS
                </td>
                <td className="p-3 sm:p-4 font-bold text-slate-900 bg-white">
                  {item.partType}
                </td>
              </tr>
            )}

            {/* SZIGETELÉSMEGFOGÓ TÍPUSA */}
            {hasValue(item.insulationGripperType) && (
              <tr className="hover:bg-slate-50/40 transition-colors">
                <td className="w-1/3 sm:w-1/4 p-3 sm:p-4 font-bold uppercase tracking-wider text-slate-600 border-r border-slate-200 bg-white">
                  SZIGETELÉSMEGFOGÓ TÍPUSA
                </td>
                <td className="p-3 sm:p-4 font-mono font-bold text-slate-900 bg-white">
                  {item.insulationGripperType}
                </td>
              </tr>
            )}

            {/* KONEKTOR TÍPUSA */}
            {hasValue(item.connectorType) && (
              <tr className="hover:bg-slate-50/40 transition-colors">
                <td className="w-1/3 sm:w-1/4 p-3 sm:p-4 font-bold uppercase tracking-wider text-slate-600 border-r border-slate-200 bg-white">
                  KONEKTOR TÍPUSA
                </td>
                <td className="p-3 sm:p-4 font-bold text-blue-700 bg-white">
                  {item.connectorType}
                </td>
              </tr>
            )}

            {/* SARU TÍPUSA */}
            {hasValue(item.terminalType) && (
              <tr className="hover:bg-slate-50/40 transition-colors">
                <td className="w-1/3 sm:w-1/4 p-3 sm:p-4 font-bold uppercase tracking-wider text-slate-600 border-r border-slate-200 bg-white">
                  SARU TÍPUSA
                </td>
                <td className="p-3 sm:p-4 font-bold text-purple-700 bg-white">
                  {item.terminalType}
                </td>
              </tr>
            )}

            {/* MINŐSÉG */}
            {hasValue(item.quality) && (
              <tr className="hover:bg-slate-50/40 transition-colors">
                <td className="w-1/3 sm:w-1/4 p-3 sm:p-4 font-bold uppercase tracking-wider text-slate-600 border-r border-slate-200 bg-white">
                  MINŐSÉG
                </td>
                <td className="p-3 sm:p-4 bg-white">
                  <span className={`px-2.5 py-0.5 font-bold rounded text-xs ${
                    item.quality === 'Új' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {item.quality}
                  </span>
                </td>
              </tr>
            )}

            {/* DÁTUM */}
            {hasValue(item.date) && (
              <tr className="hover:bg-slate-50/40 transition-colors">
                <td className="w-1/3 sm:w-1/4 p-3 sm:p-4 font-bold uppercase tracking-wider text-slate-600 border-r border-slate-200 bg-white">
                  DÁTUM
                </td>
                <td className="p-3 sm:p-4 text-slate-700 font-mono font-medium bg-white">
                  {item.date}
                </td>
              </tr>
            )}

            {/* LEÍRÁS */}
            {hasValue(item.description) && (
              <tr className="hover:bg-slate-50/40 transition-colors">
                <td className="w-1/3 sm:w-1/4 p-3 sm:p-4 font-bold uppercase tracking-wider text-slate-600 border-r border-slate-200 bg-white">
                  LEÍRÁS
                </td>
                <td className="p-3 sm:p-4 text-slate-800 italic bg-white font-medium">
                  {item.description}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Similar Products Card (Hasonló Termékek) - SÖTÉT LILA kártya, CSAK akkor jelenik meg, ha van kapcsolat */}
      {relations.length > 0 && (
        <SimilarProductsCard
          currentItem={item}
          relations={relations}
          allItems={allItems}
          onNavigateToItem={onNavigateToItem}
          onOpenAddSimilar={() => setIsAddSimilarOpen(true)}
          onDeleteRelation={handleDeleteRelation}
        />
      )}

      {/* Modal for adding a similar item to this product */}
      <AddSimilarModal
        isOpen={isAddSimilarOpen}
        onClose={() => setIsAddSimilarOpen(false)}
        currentItem={item}
        allItems={allItems}
        existingSimilarIds={relations.map((r) =>
          r.itemId1.trim().toLowerCase() === item.id.trim().toLowerCase()
            ? r.itemId2
            : r.itemId1
        )}
        onSave={handleSaveSimilarRelation}
      />

      {/* Connector & Terminal Card (Konnektor & Saru Kapcsolatok) - NARANCSSÁRGA kártya, CSAK a Konnektor és a Saru kategóriájú termékeknél, ha van kapcsolt adat */}
      {isConnectorOrTerminalItem && connectorTerminalRelations.length > 0 && (
        <ConnectorTerminalCard
          currentItem={item}
          relations={connectorTerminalRelations}
          allItems={allItems}
          onNavigateToItem={onNavigateToItem}
          onOpenAddConnectorTerminal={() => setIsAddConnectorTerminalOpen(true)}
          onDeleteRelation={handleDeleteRelation}
        />
      )}

      {/* Modal for adding a connector/terminal item to this product */}
      {isConnectorOrTerminalItem && (
        <AddConnectorTerminalModal
          isOpen={isAddConnectorTerminalOpen}
          onClose={() => setIsAddConnectorTerminalOpen(false)}
          currentItem={item}
          allItems={allItems}
          existingLinkedIds={connectorTerminalRelations.map((r) =>
            r.itemId1.trim().toLowerCase() === item.id.trim().toLowerCase()
              ? r.itemId2
              : r.itemId1
          )}
          onSave={handleSaveConnectorTerminalRelation}
        />
      )}

      {/* Maintenance History section - CSAK akkor szerepel, ha van adat */}
      {effectiveRecords.length > 0 && (
        <MaintenanceHistorySection
          records={effectiveRecords}
          onNavigateToItem={onNavigateToItem}
          onAddMaintenance={() => setIsAddMaintenanceOpen(true)}
        />
      )}

      {/* Modal for adding new maintenance entry to this item */}
      <AddMaintenanceModal
        isOpen={isAddMaintenanceOpen}
        onClose={() => setIsAddMaintenanceOpen(false)}
        item={item}
        items={allItems}
        onSave={handleSaveMaintenanceRecord}
      />

      {/* In-App Lightbox Modal with Zoom, Pan, Thumbnails, and Keyboard Navigation */}
      <ImageLightboxModal
        isOpen={isLightboxOpen}
        onClose={() => setIsLightboxOpen(false)}
        images={allImages.map((img) => getDisplayableImageUrl(img))}
        initialIndex={safeIndex}
        itemId={item.id}
        itemName={item.name}
      />
    </div>
  );
};
