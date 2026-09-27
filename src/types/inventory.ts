export interface InventoryItem {
  id: string; // Termék ID
  name: string; // Termék név
  description?: string; // Leírás
  image?: string; // Primary image link or file path or Drive URL
  images?: string[]; // Multiple image URLs / paths / uploads
  category: string; // Kategória
  manufacturer: string; // Gyártó
  feeding?: string; // Adagolás (pl. Hátsó, Oldal)
  partType?: string; // Alkatrész Típus (pl. FIX ÜLLŐ, MOZGÓ ÜLLŐ...)
  insulationType?: string; // Szigelés Típus (pl. Nem Gumis, Gumis)
  factoryCode?: string; // Gyári Kód
  insulationGripperType?: string; // Szigetelésmegfogó Típusa
  connectorType?: string; // Konektor Típusa (pl. Apa, Anya)
  terminalType?: string; // Saru Típusa (pl. F, O, C)
  date?: string; // Date
  quality?: string; // Minőség (pl. Új, Használt)
  location?: string; // Alkatrész Hely (pl. Alkatrész A1, TMK)
  customNotes?: string;
  updatedAt?: number;
}

export interface PositionItem {
  id: string; // e.g. "Alkatrész A1"
  name: string;
  zone?: string;
  shelf?: string;
  description?: string;
  capacity?: number;
}

export interface MaintenanceRecord {
  inspectionId: string; // Belső egyedi kulcs (nem jelenik meg a felületen)
  itemId: string; // Termék ID
  status: string; // Pl. "Pass", "Repair", "Fail"
  description?: string; // Leírás / elvégzett munka
  changeItem?: string; // Kicserélt alkatrész (Change Item) Termék ID
  date: string; // Karbantartás dátuma
  dateNext?: string; // Következő dátum (nem jelenik meg a felületen)
}

export interface ProductRelation {
  relationId: string; // Kapcsolat ID (belső egyedi kulcs)
  itemId1: string; // Termék ID 1
  itemId2: string; // Termék ID 2 (Hasonló termék)
  type?: 'similar' | string; // Kapcsolat típusa, jelenleg 'similar' (Hasonló)
  createdAt?: string;
  notes?: string;
}
