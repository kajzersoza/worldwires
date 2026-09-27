import { InventoryItem, PositionItem, MaintenanceRecord, ProductRelation } from '../types/inventory';
import { initialSeedData } from '../data/seedData';
import { initialWarehousePositions } from '../data/initialPositions';
import { initialMaintenanceRecords } from '../data/initialMaintenanceData';
import { initialProductRelations, initialConnectorTerminalRelations } from '../data/initialRelationsData';

const DB_NAME = 'WorldWiresWarehouseDB';
const DB_VERSION = 3;
const STORE_ITEMS = 'inventory_items';
const STORE_POSITIONS = 'positions';
const STORE_MAINTENANCE = 'maintenance_records';
const STORE_RELATIONS = 'product_relations';

export class WarehouseDB {
  private dbPromise: Promise<IDBDatabase>;

  constructor() {
    this.dbPromise = this.initDB();
  }

  private initDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_ITEMS)) {
          const store = db.createObjectStore(STORE_ITEMS, { keyPath: 'id' });
          store.createIndex('category', 'category', { unique: false });
          store.createIndex('manufacturer', 'manufacturer', { unique: false });
          store.createIndex('location', 'location', { unique: false });
        }
        if (!db.objectStoreNames.contains(STORE_POSITIONS)) {
          db.createObjectStore(STORE_POSITIONS, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(STORE_MAINTENANCE)) {
          const mStore = db.createObjectStore(STORE_MAINTENANCE, { keyPath: 'inspectionId' });
          mStore.createIndex('itemId', 'itemId', { unique: false });
        }
        if (!db.objectStoreNames.contains(STORE_RELATIONS)) {
          const rStore = db.createObjectStore(STORE_RELATIONS, { keyPath: 'relationId' });
          rStore.createIndex('itemId1', 'itemId1', { unique: false });
          rStore.createIndex('itemId2', 'itemId2', { unique: false });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getAllItems(): Promise<InventoryItem[]> {
    const db = await this.dbPromise;
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_ITEMS, 'readonly');
      const store = tx.objectStore(STORE_ITEMS);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  }

  async getItem(id: string): Promise<InventoryItem | undefined> {
    const db = await this.dbPromise;
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_ITEMS, 'readonly');
      const store = tx.objectStore(STORE_ITEMS);
      const req = store.get(id);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async saveItem(item: InventoryItem): Promise<void> {
    const db = await this.dbPromise;
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_ITEMS, 'readwrite');
      const store = tx.objectStore(STORE_ITEMS);
      const req = store.put({ ...item, updatedAt: Date.now() });
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  async bulkSaveItems(items: InventoryItem[]): Promise<void> {
    const db = await this.dbPromise;
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_ITEMS, 'readwrite');
      const store = tx.objectStore(STORE_ITEMS);
      for (const item of items) {
        store.put(item);
      }
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async deleteItem(id: string): Promise<void> {
    const db = await this.dbPromise;
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_ITEMS, 'readwrite');
      const store = tx.objectStore(STORE_ITEMS);
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  async clearAllItems(): Promise<void> {
    const db = await this.dbPromise;
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_ITEMS, 'readwrite');
      const store = tx.objectStore(STORE_ITEMS);
      const req = store.clear();
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  async getAllPositions(): Promise<PositionItem[]> {
    const db = await this.dbPromise;
    let positions = await new Promise<PositionItem[]>((resolve, reject) => {
      const tx = db.transaction(STORE_POSITIONS, 'readonly');
      const store = tx.objectStore(STORE_POSITIONS);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });

    // If positions store is empty on first run, initialize with all 957 positions
    if (!positions || positions.length === 0) {
      await this.bulkSavePositions(initialWarehousePositions);
      positions = initialWarehousePositions;
    }

    return positions;
  }

  async savePosition(pos: PositionItem): Promise<void> {
    const db = await this.dbPromise;
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_POSITIONS, 'readwrite');
      const store = tx.objectStore(STORE_POSITIONS);
      const req = store.put(pos);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  async bulkSavePositions(positions: PositionItem[]): Promise<void> {
    const db = await this.dbPromise;
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_POSITIONS, 'readwrite');
      const store = tx.objectStore(STORE_POSITIONS);
      for (const pos of positions) {
        store.put(pos);
      }
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async deletePosition(id: string): Promise<void> {
    const db = await this.dbPromise;
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_POSITIONS, 'readwrite');
      const store = tx.objectStore(STORE_POSITIONS);
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  async clearAllPositions(): Promise<void> {
    const db = await this.dbPromise;
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_POSITIONS, 'readwrite');
      const store = tx.objectStore(STORE_POSITIONS);
      const req = store.clear();
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  async resetPositionsToInitialSeed(): Promise<PositionItem[]> {
    await this.clearAllPositions();
    await this.bulkSavePositions(initialWarehousePositions);
    return initialWarehousePositions;
  }

  async getAllMaintenanceRecords(): Promise<MaintenanceRecord[]> {
    const db = await this.dbPromise;
    let records = await new Promise<MaintenanceRecord[]>((resolve, reject) => {
      const tx = db.transaction(STORE_MAINTENANCE, 'readonly');
      const store = tx.objectStore(STORE_MAINTENANCE);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });

    // Auto-seed with provided initial maintenance data if empty
    if (!records || records.length === 0) {
      await this.bulkSaveMaintenanceRecords(initialMaintenanceRecords);
      records = initialMaintenanceRecords;
    }

    return records;
  }

  async getMaintenanceRecordsForItem(itemId: string): Promise<MaintenanceRecord[]> {
    const all = await this.getAllMaintenanceRecords();
    const cleanId = itemId.trim().toLowerCase();
    return all.filter((r) => r.itemId.trim().toLowerCase() === cleanId);
  }

  async saveMaintenanceRecord(record: MaintenanceRecord): Promise<void> {
    const db = await this.dbPromise;
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_MAINTENANCE, 'readwrite');
      const store = tx.objectStore(STORE_MAINTENANCE);
      const req = store.put(record);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  async bulkSaveMaintenanceRecords(records: MaintenanceRecord[]): Promise<void> {
    const db = await this.dbPromise;
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_MAINTENANCE, 'readwrite');
      const store = tx.objectStore(STORE_MAINTENANCE);
      for (const rec of records) {
        store.put(rec);
      }
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async deleteMaintenanceRecord(inspectionId: string): Promise<void> {
    const db = await this.dbPromise;
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_MAINTENANCE, 'readwrite');
      const store = tx.objectStore(STORE_MAINTENANCE);
      const req = store.delete(inspectionId);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  async clearAllMaintenanceRecords(): Promise<void> {
    const db = await this.dbPromise;
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_MAINTENANCE, 'readwrite');
      const store = tx.objectStore(STORE_MAINTENANCE);
      const req = store.clear();
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  async resetMaintenanceToInitialSeed(): Promise<MaintenanceRecord[]> {
    await this.clearAllMaintenanceRecords();
    await this.bulkSaveMaintenanceRecords(initialMaintenanceRecords);
    return initialMaintenanceRecords;
  }

  // --- PRODUCT RELATIONS (KAPCSOLAT / HASONLÓ TERMÉKEK) ---
  async getAllProductRelations(): Promise<ProductRelation[]> {
    const db = await this.dbPromise;
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_RELATIONS, 'readonly');
      const store = tx.objectStore(STORE_RELATIONS);
      const req = store.getAll();
      req.onsuccess = async () => {
        let relations: ProductRelation[] = req.result || [];
        if (relations.length === 0) {
          // Auto-seed initial relations if empty (both similar and connector_terminal)
          const allSeeds = [...initialProductRelations, ...initialConnectorTerminalRelations];
          await this.bulkSaveProductRelations(allSeeds);
          relations = allSeeds;
        } else {
          // Check if connector_terminal relations need to be merged into existing DB
          const hasConnectorTerminal = relations.some((r) => r.type === 'connector_terminal');
          if (!hasConnectorTerminal) {
            await this.bulkSaveProductRelations(initialConnectorTerminalRelations);
            relations = [...relations, ...initialConnectorTerminalRelations];
          }

          // If previous version had duplicate inverse pairs (e.g. A->B and B->A), clean them up
          const seenPairs = new Set<string>();
          const deduped: ProductRelation[] = [];
          let hasDuplicates = false;

          for (const r of relations) {
            const idA = r.itemId1.trim().toLowerCase();
            const idB = r.itemId2.trim().toLowerCase();
            const rType = r.type || 'similar';
            const pairKey = idA < idB ? `${rType}|${idA}|${idB}` : `${rType}|${idB}|${idA}`;

            if (!seenPairs.has(pairKey)) {
              seenPairs.add(pairKey);
              deduped.push(r);
            } else {
              hasDuplicates = true;
            }
          }

          if (hasDuplicates) {
            // Clean up the store
            await this.clearAllProductRelations();
            await this.bulkSaveProductRelations(deduped);
            relations = deduped;
          }
        }
        resolve(relations);
      };
      req.onerror = () => reject(req.error);
    });
  }

  async getSimilarItemsFor(itemId: string): Promise<ProductRelation[]> {
    const all = await this.getAllProductRelations();
    const clean = itemId.trim().toLowerCase();
    
    // Find all 'similar' relations involving this item in either itemId1 or itemId2
    const matching = all.filter(
      (r) =>
        (r.type === 'similar' || !r.type) &&
        (r.itemId1.trim().toLowerCase() === clean ||
         r.itemId2.trim().toLowerCase() === clean)
    );

    // Deduplicate by the "other" item's ID so that even if the database has both (A->B and B->A),
    // the target item only appears once!
    const seenOtherIds = new Set<string>();
    const uniqueRelations: ProductRelation[] = [];

    for (const rel of matching) {
      const otherId =
        rel.itemId1.trim().toLowerCase() === clean
          ? rel.itemId2.trim().toLowerCase()
          : rel.itemId1.trim().toLowerCase();

      if (!seenOtherIds.has(otherId) && otherId !== clean) {
        seenOtherIds.add(otherId);
        uniqueRelations.push(rel);
      }
    }

    return uniqueRelations;
  }

  async getConnectorTerminalRelationsFor(itemId: string): Promise<ProductRelation[]> {
    const all = await this.getAllProductRelations();
    const clean = itemId.trim().toLowerCase();
    
    // Find all 'connector_terminal' relations involving this item in either itemId1 or itemId2
    const matching = all.filter(
      (r) =>
        r.type === 'connector_terminal' &&
        (r.itemId1.trim().toLowerCase() === clean ||
         r.itemId2.trim().toLowerCase() === clean)
    );

    // Deduplicate by the "other" item's ID so that even if the database has both (A->B and B->A),
    // the target item only appears once!
    const seenOtherIds = new Set<string>();
    const uniqueRelations: ProductRelation[] = [];

    for (const rel of matching) {
      const otherId =
        rel.itemId1.trim().toLowerCase() === clean
          ? rel.itemId2.trim().toLowerCase()
          : rel.itemId1.trim().toLowerCase();

      if (!seenOtherIds.has(otherId) && otherId !== clean) {
        seenOtherIds.add(otherId);
        uniqueRelations.push(rel);
      }
    }

    return uniqueRelations;
  }

  async saveProductRelation(relation: ProductRelation): Promise<void> {
    const db = await this.dbPromise;
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_RELATIONS, 'readwrite');
      const store = tx.objectStore(STORE_RELATIONS);
      const req = store.put(relation);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  async bulkSaveProductRelations(relations: ProductRelation[]): Promise<void> {
    const db = await this.dbPromise;
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_RELATIONS, 'readwrite');
      const store = tx.objectStore(STORE_RELATIONS);
      for (const rel of relations) {
        store.put(rel);
      }
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async deleteProductRelation(relationId: string): Promise<void> {
    const db = await this.dbPromise;
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_RELATIONS, 'readwrite');
      const store = tx.objectStore(STORE_RELATIONS);
      const req = store.delete(relationId);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  async clearAllProductRelations(): Promise<void> {
    const db = await this.dbPromise;
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_RELATIONS, 'readwrite');
      const store = tx.objectStore(STORE_RELATIONS);
      const req = store.clear();
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  async resetRelationsToInitialSeed(): Promise<ProductRelation[]> {
    await this.clearAllProductRelations();
    const allSeeds = [...initialProductRelations, ...initialConnectorTerminalRelations];
    await this.bulkSaveProductRelations(allSeeds);
    return allSeeds;
  }

  async resetToInitialSeed(): Promise<InventoryItem[]> {
    await this.clearAllItems();
    await this.bulkSaveItems(initialSeedData);
    return initialSeedData;
  }
}

export const warehouseDB = new WarehouseDB();
