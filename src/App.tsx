import React, { useState, useEffect, useMemo } from 'react';
import { InventoryItem, PositionItem } from './types/inventory';
import { warehouseDB } from './db/indexedDb';
import { parseCSV, exportToCSV } from './utils/csv';
import { naturalCompare } from './utils/naturalSort';
import { exportItemsListToPDF } from './utils/pdfExport';
import { Navbar } from './components/Navbar';
import { FilterBar } from './components/FilterBar';
import { ItemTableView, SortField } from './components/ItemTableView';
import { ItemCardView } from './components/ItemCardView';
import { ItemDetailView } from './components/ItemDetailView';
import { SystemMenuModal } from './components/SystemMenuModal';
import { PositionsModal } from './components/PositionsModal';
import { ItemFormModal } from './components/ItemFormModal';
import { MaintenanceModal } from './components/MaintenanceModal';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { MaintenanceRecord } from './types/inventory';

export default function App() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [positions, setPositions] = useState<PositionItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // View state
  const [viewMode, setViewMode] = useState<'list' | 'cards'>('list');
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedManufacturer, setSelectedManufacturer] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');

  // Modals
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isPositionsOpen, setIsPositionsOpen] = useState(false);
  const [isMaintenanceOpen, setIsMaintenanceOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [maintenanceRecords, setMaintenanceRecords] = useState<MaintenanceRecord[]>([]);
  const [maintenanceCount, setMaintenanceCount] = useState<number>(0);

  // Toast
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Initial load from IndexedDB or CSV
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        let stored = await warehouseDB.getAllItems();
        if (!stored || stored.length === 0) {
          // Attempt to fetch sample CSV
          try {
            const resp = await fetch('/sample_warehouse_data.csv');
            if (resp.ok) {
              const text = await resp.text();
              const parsed = parseCSV(text);
              if (parsed.length > 0) {
                await warehouseDB.bulkSaveItems(parsed);
                stored = parsed;
              }
            }
          } catch {
            // fallback to initial seed
            stored = await warehouseDB.resetToInitialSeed();
          }
        }
        setItems(stored || []);

        // Load positions from IndexedDB
        const loadedPositions = await warehouseDB.getAllPositions();
        setPositions(loadedPositions);

        // Load maintenance records from IndexedDB
        const loadedMaint = await warehouseDB.getAllMaintenanceRecords();
        setMaintenanceRecords(loadedMaint);
        setMaintenanceCount(loadedMaint.length);
      } catch (err) {
        console.error('Failed to load database from IndexedDB:', err);
        showToast('Hiba történt az adatbázis betöltésekor', 'error');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  const reloadMaintenance = async () => {
    try {
      const loaded = await warehouseDB.getAllMaintenanceRecords();
      setMaintenanceRecords(loaded);
      setMaintenanceCount(loaded.length);
    } catch (err) {
      console.error('Failed to reload maintenance records:', err);
    }
  };

  // Filter options extraction
  const categories = useMemo(() => {
    const set = new Set<string>();
    items.forEach((i) => {
      if (i.category?.trim()) set.add(i.category.trim());
    });
    return Array.from(set).sort();
  }, [items]);

  const manufacturers = useMemo(() => {
    const set = new Set<string>();
    items.forEach((i) => {
      if (i.manufacturer?.trim() && i.manufacturer !== '-') set.add(i.manufacturer.trim());
    });
    return Array.from(set).sort();
  }, [items]);

  const locations = useMemo(() => {
    const set = new Set<string>();
    // Include locations actually used on products
    items.forEach((i) => {
      if (i.location?.trim()) set.add(i.location.trim());
    });
    return Array.from(set).sort();
  }, [items]);

  // Filtered items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // Category filter
      if (selectedCategory && item.category !== selectedCategory) {
        return false;
      }
      // Manufacturer filter
      if (selectedManufacturer && item.manufacturer !== selectedManufacturer) {
        return false;
      }
      // Location filter
      if (selectedLocation && item.location !== selectedLocation) {
        return false;
      }
      // Search query (ID, name, factoryCode, location, description)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matches =
          (item.id && item.id.toLowerCase().includes(q)) ||
          (item.name && item.name.toLowerCase().includes(q)) ||
          (item.factoryCode && item.factoryCode.toLowerCase().includes(q)) ||
          (item.location && item.location.toLowerCase().includes(q)) ||
          (item.description && item.description.toLowerCase().includes(q)) ||
          (item.manufacturer && item.manufacturer.toLowerCase().includes(q)) ||
          (item.category && item.category.toLowerCase().includes(q));
        if (!matches) return false;
      }
      return true;
    });
  }, [items, selectedCategory, selectedManufacturer, selectedLocation, searchQuery]);

  // Sorting state
  const [sortField, setSortField] = useState<SortField>('id');
  const [sortAsc, setSortAsc] = useState<boolean>(true);

  const handleSortChange = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  // Sorted and filtered items matching the user's active sort
  const sortedFilteredItems = useMemo(() => {
    return [...filteredItems].sort((a, b) => {
      const valA = (a[sortField] as string | undefined) || '';
      const valB = (b[sortField] as string | undefined) || '';
      const comparison = naturalCompare(valA, valB);
      return sortAsc ? comparison : -comparison;
    });
  }, [filteredItems, sortField, sortAsc]);

  // Filter by category click handler
  const handleSelectCategory = (cat: string) => {
    setSelectedCategory(cat);
    setSelectedItem(null); // return to filtered list view
    showToast(`Szűrés beállítva: ${cat} kategória`);
  };

  // Filter by manufacturer click handler
  const handleSelectManufacturer = (mfg: string) => {
    setSelectedManufacturer(mfg);
    setSelectedItem(null); // return to filtered list view
    showToast(`Szűrés beállítva: ${mfg} gyártó`);
  };

  // Handlers for Items
  const handleSaveItem = async (item: InventoryItem) => {
    try {
      await warehouseDB.saveItem(item);
      const updated = await warehouseDB.getAllItems();
      setItems(updated);
      if (selectedItem?.id === item.id) {
        setSelectedItem(item);
      }
      showToast(`A(z) ${item.id} tétel sikeresen elmentve.`);
    } catch {
      showToast('Nem sikerült menteni a tételt', 'error');
    }
  };

  const handleDeleteItem = async (id: string) => {
    try {
      await warehouseDB.deleteItem(id);
      const updated = await warehouseDB.getAllItems();
      setItems(updated);
      if (selectedItem?.id === id) {
        setSelectedItem(null);
      }
      showToast(`A(z) ${id} tétel törölve.`);
    } catch {
      showToast('Hiba a törlés során', 'error');
    }
  };

  const handleUpdateImage = async (id: string, newImage: string) => {
    const item = items.find((i) => i.id === id);
    if (!item) return;
    const updatedItem: InventoryItem = { ...item, image: newImage };
    await handleSaveItem(updatedItem);
  };

  const handleUpdateImages = async (id: string, newImages: string[]) => {
    const item = items.find((i) => i.id === id);
    if (!item) return;
    const updatedItem: InventoryItem = {
      ...item,
      image: newImages.length > 0 ? newImages[0] : '',
      images: newImages,
    };
    await handleSaveItem(updatedItem);
  };

  // Handlers for Positions (CRUD)
  const handleSavePosition = async (pos: PositionItem) => {
    try {
      await warehouseDB.savePosition(pos);
      const updated = await warehouseDB.getAllPositions();
      setPositions(updated);
      showToast(`Pozíció sikeresen mentve: ${pos.name}`);
    } catch {
      showToast('Nem sikerült menteni a pozíciót', 'error');
    }
  };

  const handleDeletePosition = async (id: string) => {
    try {
      await warehouseDB.deletePosition(id);
      const updated = await warehouseDB.getAllPositions();
      setPositions(updated);
      showToast(`Pozíció törölve: ${id}`);
    } catch {
      showToast('Nem sikerült törölni a pozíciót', 'error');
    }
  };

  const handleResetPositions = async () => {
    try {
      const reset = await warehouseDB.resetPositionsToInitialSeed();
      setPositions(reset);
      showToast(`Pozíciók visszaállítva az eredeti mintára (${reset.length} db).`);
    } catch {
      showToast('Hiba a pozíciók visszaállításakor', 'error');
    }
  };

  const handleImportCSV = async (csvText: string) => {
    try {
      const parsed = parseCSV(csvText);
      if (parsed.length === 0) {
        showToast('Nem sikerült érvényes tételeket találni a CSV fájlban.', 'error');
        return;
      }
      await warehouseDB.bulkSaveItems(parsed);
      const updated = await warehouseDB.getAllItems();
      setItems(updated);
      showToast(`Sikeres importálás: ${parsed.length} tétel betöltve a helyi adatbázisba!`);
      setIsMenuOpen(false);
    } catch (err) {
      console.error(err);
      showToast('Hiba történt a CSV importálásakor.', 'error');
    }
  };

  const handleExportCSV = () => {
    try {
      const csv = exportToCSV(items);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `WorldWires_Raktarkeszlet_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast('CSV fájl sikeresen letöltve!');
    } catch {
      showToast('Nem sikerült az exportálás', 'error');
    }
  };

  const handleExportPDF = async () => {
    try {
      showToast('PDF dokumentum generálása folyamatban...', 'info');
      await exportItemsListToPDF(sortedFilteredItems, {
        searchQuery,
        selectedCategory,
        selectedManufacturer,
        selectedLocation,
        sortField,
        sortAsc,
      });
      showToast(`A lista sikeresen letöltve PDF formátumban (${sortedFilteredItems.length} tétel).`);
    } catch (err) {
      console.error('PDF export failed:', err);
      showToast('Nem sikerült létrehozni a PDF dokumentumot.', 'error');
    }
  };

  const handleResetDB = async () => {
    try {
      try {
        const resp = await fetch('/sample_warehouse_data.csv');
        if (resp.ok) {
          const text = await resp.text();
          const parsed = parseCSV(text);
          if (parsed.length > 0) {
            await warehouseDB.clearAllItems();
            await warehouseDB.bulkSaveItems(parsed);
            await warehouseDB.resetRelationsToInitialSeed();
            setItems(parsed);
            showToast(`Adatbázis visszaállítva a mintaállapotra (${parsed.length} tétel).`);
            setIsMenuOpen(false);
            return;
          }
        }
      } catch {
        // fallback
      }
      const seeded = await warehouseDB.resetToInitialSeed();
      await warehouseDB.resetRelationsToInitialSeed();
      setItems(seeded);
      showToast(`Adatbázis visszaállítva (${seeded.length} tétel).`);
      setIsMenuOpen(false);
    } catch {
      showToast('Hiba történt a visszaállításkor', 'error');
    }
  };

  // Direct in-place navigation to another item when Change Item is clicked
  const handleNavigateToItem = async (targetId: string) => {
    const cleanTarget = targetId.trim();
    if (!cleanTarget) return;

    // Search in loaded items by ID or Factory Code (case-insensitive)
    let target = items.find(
      (i) => i.id.toLowerCase() === cleanTarget.toLowerCase() ||
             (i.factoryCode && i.factoryCode.toLowerCase() === cleanTarget.toLowerCase())
    );

    if (!target) {
      target = await warehouseDB.getItem(cleanTarget);
    }

    if (target) {
      setSelectedItem(target);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      showToast(`Megnyitva: ${target.id} (${target.name || 'Alkatrész'})`, 'info');
    } else {
      showToast(`A(z) "${cleanTarget}" alkatrész még nem szerepel önálló tételként a raktárban.`, 'info');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
      {/* Top Navbar */}
      <Navbar
        totalCount={items.length}
        filteredCount={sortedFilteredItems.length}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onOpenNewItem={() => {
          setEditingItem(null);
          setIsFormOpen(true);
        }}
        onOpenPositions={() => setIsPositionsOpen(true)}
        onOpenMaintenance={() => setIsMaintenanceOpen(true)}
        onOpenMenu={() => setIsMenuOpen(true)}
        positionsCount={positions.length}
        maintenanceCount={maintenanceCount}
      />

      {/* Main Container */}
      <main className="max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 flex-1 space-y-4 sm:space-y-5">
        {selectedItem ? (
          /* Item Detail View (Image 2) */
          <ItemDetailView
            item={selectedItem}
            allItems={items}
            onBack={() => setSelectedItem(null)}
            onEdit={(it) => {
              setEditingItem(it);
              setIsFormOpen(true);
            }}
            onDelete={handleDeleteItem}
            onUpdateImage={handleUpdateImage}
            onUpdateImages={handleUpdateImages}
            onFilterByLocation={(loc) => {
              setSelectedLocation(loc);
              setSelectedItem(null);
            }}
            onFilterByCategory={handleSelectCategory}
            onFilterByManufacturer={handleSelectManufacturer}
            onNavigateToItem={handleNavigateToItem}
            onMaintenanceAdded={async () => {
              await reloadMaintenance();
              showToast('Új karbantartás sikeresen rögzítve!', 'success');
            }}
            onRelationChanged={() => {
              showToast('Termékkapcsolat sikeresen frissítve!', 'success');
            }}
          />
        ) : (
          /* Main Database View (Image 1) */
          <>
            {/* Search and Filters */}
            <FilterBar
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              selectedCategory={selectedCategory}
              onCategoryChange={setSelectedCategory}
              categories={categories}
              selectedManufacturer={selectedManufacturer}
              onManufacturerChange={setSelectedManufacturer}
              manufacturers={manufacturers}
              selectedLocation={selectedLocation}
              onLocationChange={setSelectedLocation}
              locations={locations}
              resultsCount={sortedFilteredItems.length}
              onExportPDF={handleExportPDF}
            />

            {/* List or Cards View */}
            {isLoading ? (
              <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-500">
                <div className="animate-spin w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full mx-auto mb-3" />
                <span className="text-base font-semibold">Adatok betöltése a helyi IndexedDB adatbázisból...</span>
              </div>
            ) : viewMode === 'list' ? (
              <ItemTableView
                items={sortedFilteredItems}
                onSelectItem={(item) => setSelectedItem(item)}
                onSelectCategory={handleSelectCategory}
                onSelectManufacturer={handleSelectManufacturer}
                sortField={sortField}
                sortAsc={sortAsc}
                onSortChange={handleSortChange}
              />
            ) : (
              <ItemCardView
                items={sortedFilteredItems}
                onSelectItem={(item) => setSelectedItem(item)}
                onSelectCategory={handleSelectCategory}
                onSelectManufacturer={handleSelectManufacturer}
              />
            )}
          </>
        )}
      </main>

      {/* Footer with World Wires Kft. Branding */}
      <footer className="border-t border-slate-200 bg-white py-6 px-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <img src="/ww_logo.svg" alt="World Wires Kft." className="w-6 h-6 object-contain" />
            <span className="font-bold text-slate-800 text-sm">
              World Wires Kft.
            </span>
            <span className="text-slate-400">·</span>
            <span>Raktárkészlet és Alkatrész Nyilvántartás</span>
          </div>

          <div className="flex items-center gap-3 text-slate-400">
            <span>© {new Date().getFullYear()} World Wires Kft.</span>
            <span>·</span>
            <span className="tabular-nums font-medium text-slate-600">
              {items.length} tétel a rendszerben
            </span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <SystemMenuModal
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        onOpenPositions={() => setIsPositionsOpen(true)}
        onOpenMaintenance={() => setIsMaintenanceOpen(true)}
        onImportCSV={handleImportCSV}
        onExportCSV={handleExportCSV}
        onExportPDF={handleExportPDF}
        onResetDB={handleResetDB}
        totalItems={items.length}
        totalCategories={categories.length}
        totalManufacturers={manufacturers.length}
        totalLocations={locations.length}
        totalPositions={positions.length}
        totalMaintenance={maintenanceCount}
      />

      <MaintenanceModal
        isOpen={isMaintenanceOpen}
        onClose={() => setIsMaintenanceOpen(false)}
        maintenanceRecords={maintenanceRecords}
        items={items}
        onSelectRecordItem={handleNavigateToItem}
      />

      <PositionsModal
        isOpen={isPositionsOpen}
        onClose={() => setIsPositionsOpen(false)}
        items={items}
        positions={positions}
        onSelectPosition={(posName) => {
          setSelectedLocation(posName);
          setSelectedItem(null);
        }}
        onSavePosition={handleSavePosition}
        onDeletePosition={handleDeletePosition}
        onResetPositions={handleResetPositions}
      />

      <ItemFormModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingItem(null);
        }}
        onSave={handleSaveItem}
        initialItem={editingItem}
        categories={categories}
        manufacturers={manufacturers}
        locations={positions.map(p => p.name)}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-50 flex items-center gap-3 px-4 py-3 bg-slate-900 text-white rounded-xl shadow-xl border border-slate-800 text-sm font-bold animate-in fade-in slide-in-from-bottom-2 duration-200">
          {toastMessage.type === 'error' ? (
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
          ) : (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}
    </div>
  );
}
