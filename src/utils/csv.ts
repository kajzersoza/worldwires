import { InventoryItem } from '../types/inventory';

export function parseCSV(csvText: string): InventoryItem[] {
  const lines = csvText.split(/\r?\n/);
  if (lines.length < 2) return [];

  const items: InventoryItem[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Parse CSV with quoted strings support
    const row: string[] = [];
    let inQuotes = false;
    let current = '';

    for (let c = 0; c < line.length; c++) {
      const char = line[c];
      if (char === '"') {
        if (inQuotes && line[c + 1] === '"') {
          current += '"';
          c++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        row.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    row.push(current.trim());

    const id = row[0] || '';
    const name = row[1] || '';
    const category = row[4] || '';

    // skip completely empty rows
    if (!id && !name && !category) continue;

    items.push({
      id: id || `AUTO_${Date.now()}_${i}`,
      name: name || '-',
      description: row[2] || '',
      image: row[3] || '',
      category: category || 'Egyéb',
      manufacturer: row[5] || '-',
      feeding: row[6] || '',
      partType: row[7] || '',
      insulationType: row[8] || '',
      factoryCode: row[9] || '',
      insulationGripperType: row[10] || '',
      connectorType: row[11] || '',
      terminalType: row[12] || '',
      date: row[13] || '',
      quality: row[14] || '',
      location: row[15] || '',
      updatedAt: Date.now(),
    });
  }

  return items;
}

export function exportToCSV(items: InventoryItem[]): string {
  const headers = [
    'Termék ID',
    'Termék név',
    'Leírás',
    'Image',
    'Kategória',
    'Gyártó',
    'Adagolás',
    'Alkatrész Típus',
    'Szigelés Típus',
    'Gyári Kód',
    'Szigetelésmegfogó Típusa',
    'Konektor Típusa',
    'Saru Típusa',
    'Date',
    'Minőség',
    'Alkatrész Hely',
  ];

  const escapeCSV = (val?: string) => {
    if (!val) return '';
    if (val.includes(',') || val.includes('"') || val.includes('\n')) {
      return `"${val.replace(/"/g, '""')}"`;
    }
    return val;
  };

  const rows = items.map((item) => [
    escapeCSV(item.id),
    escapeCSV(item.name),
    escapeCSV(item.description),
    escapeCSV(item.image),
    escapeCSV(item.category),
    escapeCSV(item.manufacturer),
    escapeCSV(item.feeding),
    escapeCSV(item.partType),
    escapeCSV(item.insulationType),
    escapeCSV(item.factoryCode),
    escapeCSV(item.insulationGripperType),
    escapeCSV(item.connectorType),
    escapeCSV(item.terminalType),
    escapeCSV(item.date),
    escapeCSV(item.quality),
    escapeCSV(item.location),
  ]);

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}
