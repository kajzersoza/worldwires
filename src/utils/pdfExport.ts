import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { InventoryItem, MaintenanceRecord, ProductRelation } from '../types/inventory';

// Converts ArrayBuffer to Base64 safely
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

// Loads LiberationSans font so all Hungarian accented characters (ő, ű, Á, É, etc.) display cleanly
async function applyHungarianFonts(doc: jsPDF): Promise<string> {
  try {
    const [regResp, boldResp] = await Promise.all([
      fetch('/fonts/LiberationSans-Regular.ttf'),
      fetch('/fonts/LiberationSans-Bold.ttf'),
    ]);

    let loaded = false;
    if (regResp.ok) {
      const regBuf = await regResp.arrayBuffer();
      const regBase64 = arrayBufferToBase64(regBuf);
      doc.addFileToVFS('LiberationSans-Regular.ttf', regBase64);
      doc.addFont('LiberationSans-Regular.ttf', 'LiberationSans', 'normal');
      loaded = true;
    }

    if (boldResp.ok) {
      const boldBuf = await boldResp.arrayBuffer();
      const boldBase64 = arrayBufferToBase64(boldBuf);
      doc.addFileToVFS('LiberationSans-Bold.ttf', boldBase64);
      doc.addFont('LiberationSans-Bold.ttf', 'LiberationSans', 'bold');
      loaded = true;
    }

    if (loaded) {
      doc.setFont('LiberationSans', 'normal');
      return 'LiberationSans';
    }
  } catch (err) {
    console.warn('Fallback to standard font:', err);
  }

  doc.setFont('helvetica', 'normal');
  return 'helvetica';
}

// Convert image URL to Base64 dataURL for PDF embedding
async function getImageDataUrl(url?: string): Promise<{ dataUrl: string; width: number; height: number } | null> {
  if (!url) return null;

  // Direct Data URL
  if (url.startsWith('data:image/')) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        resolve({ dataUrl: url, width: img.naturalWidth || 400, height: img.naturalHeight || 300 });
      };
      img.onerror = () => resolve(null);
      img.src = url;
    });
  }

  // Google Drive thumbnail or direct URL
  let targetUrl = url;
  if (url.includes('drive.google.com/file/d/')) {
    const match = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (match && match[1]) {
      targetUrl = `https://drive.google.com/thumbnail?id=${match[1]}&sz=w800`;
    }
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || 600;
        canvas.height = img.naturalHeight || 450;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
          resolve({ dataUrl, width: canvas.width, height: canvas.height });
          return;
        }
      } catch {
        // CORS restriction on canvas
      }
      resolve(null);
    };
    img.onerror = () => resolve(null);
    img.src = targetUrl;
  });
}

// Helper to draw the official World Wires Kft. dual-circle emblem in vector format
function drawWorldWiresPdfLogo(doc: jsPDF, x: number, y: number, scale = 1.3): void {
  // Left circle (White with dark border)
  const leftCx = x + 5 * scale;
  const leftCy = y + 5 * scale;
  const r = 4.2 * scale;

  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(30, 41, 59);
  doc.setLineWidth(0.35 * scale);
  doc.circle(leftCx, leftCy, r, 'FD');

  // Right circle (Solid Teal)
  const rightCx = x + 11.8 * scale;
  const rightCy = y + 5 * scale;
  doc.setFillColor(13, 148, 136); // #0d9488
  doc.setDrawColor(13, 148, 136);
  doc.circle(rightCx, rightCy, r + 0.2 * scale, 'F');

  // Left W (Dark Charcoal)
  doc.setDrawColor(30, 41, 59);
  doc.setLineWidth(0.48 * scale);
  const lw1x = x + 2.8 * scale;
  const lw1y = y + 3.3 * scale;
  const lw2x = x + 3.9 * scale;
  const lw2y = y + 6.8 * scale;
  const lw3x = x + 5.0 * scale;
  const lw3y = y + 3.8 * scale;
  const lw4x = x + 6.1 * scale;
  const lw4y = y + 6.8 * scale;
  const lw5x = x + 7.2 * scale;
  const lw5y = y + 3.3 * scale;

  doc.line(lw1x, lw1y, lw2x, lw2y);
  doc.line(lw2x, lw2y, lw3x, lw3y);
  doc.line(lw3x, lw3y, lw4x, lw4y);
  doc.line(lw4x, lw4y, lw5x, lw5y);

  // Connecting bridge
  const rw1x = x + 9.6 * scale;
  const rw1y = y + 3.3 * scale;
  doc.line(lw5x, lw5y, rw1x, rw1y);

  // Right W (Pure White)
  doc.setDrawColor(255, 255, 255);
  doc.setLineWidth(0.48 * scale);
  const rw2x = x + 10.7 * scale;
  const rw2y = y + 6.8 * scale;
  const rw3x = x + 11.8 * scale;
  const rw3y = y + 3.8 * scale;
  const rw4x = x + 12.9 * scale;
  const rw4y = y + 6.8 * scale;
  const rw5x = x + 14.0 * scale;
  const rw5y = y + 3.3 * scale;

  doc.line(rw1x, rw1y, rw2x, rw2y);
  doc.line(rw2x, rw2y, rw3x, rw3y);
  doc.line(rw3x, rw3y, rw4x, rw4y);
  doc.line(rw4x, rw4y, rw5x, rw5y);
}

export type SortField = 'id' | 'name' | 'factoryCode' | 'category' | 'manufacturer';

export interface ExportListFilters {
  searchQuery?: string;
  selectedCategory?: string;
  selectedManufacturer?: string;
  selectedLocation?: string;
  sortField?: SortField;
  sortAsc?: boolean;
}

/**
 * 1. Export currently filtered / searched inventory items to a professional PDF report.
 */
export async function exportItemsListToPDF(
  items: InventoryItem[],
  filters: ExportListFilters = {}
): Promise<void> {
  // Landscape A4 for wide table legibility
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const fontName = await applyHungarianFonts(doc);
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Header background banner - bright white
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, pageWidth, 25, 'F');
  doc.setDrawColor(226, 232, 240); // slate-200 border
  doc.setLineWidth(0.3);
  doc.line(0, 25, pageWidth, 25);

  // Draw World Wires Kft. official emblem
  drawWorldWiresPdfLogo(doc, 12, 5.5, 1.4);

  // Brand Name & Title: World Wires Kft.
  doc.setFont(fontName, 'bold');
  doc.setTextColor(15, 23, 42); // slate-900 dark text on white
  doc.setFontSize(14);
  doc.text('WORLD WIRES KFT.', 38, 12);

  doc.setFont(fontName, 'bold');
  doc.setFontSize(10);
  doc.setTextColor(13, 148, 136); // teal-600
  doc.text('—  RAKTÁRKÉSZLET RIPORT', 95, 12);

  doc.setFont(fontName, 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139); // slate-500
  const exportDate = new Date().toLocaleString('hu-HU', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
  doc.text(`Hivatalos raktári nyilvántartás · Generálva: ${exportDate} · Összesen: ${items.length} tétel`, 38, 19);

  // Active filters info bar
  doc.setFillColor(248, 250, 252); // slate-50
  doc.rect(0, 25, pageWidth, 11, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.2);
  doc.line(0, 36, pageWidth, 36);

  const activeFilterTexts: string[] = [];
  if (filters.searchQuery?.trim()) {
    activeFilterTexts.push(`Keresés: "${filters.searchQuery.trim()}"`);
  }
  if (filters.selectedCategory) {
    activeFilterTexts.push(`Kategória: ${filters.selectedCategory}`);
  }
  if (filters.selectedManufacturer) {
    activeFilterTexts.push(`Gyártó: ${filters.selectedManufacturer}`);
  }
  if (filters.selectedLocation) {
    activeFilterTexts.push(`Alkatrész Hely: ${filters.selectedLocation}`);
  }
  if (filters.sortField) {
    const sortFieldNames: Record<string, string> = {
      id: 'Termék ID',
      name: 'Termék Név',
      factoryCode: 'Gyári Kód',
      category: 'Kategória',
      manufacturer: 'Gyártó',
    };
    const fieldName = sortFieldNames[filters.sortField] || filters.sortField;
    const dir = filters.sortAsc !== false ? 'A→Z növekvő' : 'Z→A csökkenő';
    activeFilterTexts.push(`Rendezés: ${fieldName} (${dir})`);
  }

  const filterSummary = activeFilterTexts.length > 0
    ? `Aktív szűrők & sorrend: ${activeFilterTexts.join('  |  ')}`
    : 'Aktív szűrők: Nincs szűrés (teljes lista)';

  doc.setFont(fontName, 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 118, 110); // teal-700
  doc.text(filterSummary, 14, 31);

  // Helper to append sort direction to the active column header
  const getColHeader = (label: string, field: string) => {
    if (filters.sortField === field) {
      return filters.sortAsc !== false ? `${label} (A-Z)` : `${label} (Z-A)`;
    }
    return label;
  };

  // Build table data
  const tableHead = [
    [
      '#',
      getColHeader('Termék ID', 'id'),
      getColHeader('Termék Név', 'name'),
      getColHeader('Kategória', 'category'),
      getColHeader('Gyártó', 'manufacturer'),
      'Alkatrész Hely',
      getColHeader('Gyári Kód', 'factoryCode'),
      'Adagolás / Típus',
    ],
  ];

  const tableBody = items.map((item, idx) => [
    (idx + 1).toString(),
    item.id || '-',
    item.name || '-',
    item.category || '-',
    item.manufacturer || '-',
    item.location || '-',
    item.factoryCode || '-',
    [item.feeding, item.partType].filter(Boolean).join(' / ') || '-',
  ]);

  autoTable(doc, {
    startY: 38,
    head: tableHead,
    body: tableBody,
    styles: {
      font: fontName,
      fontSize: 8.5,
      cellPadding: 2.2,
      textColor: [30, 41, 59],
      lineColor: [226, 232, 240],
      lineWidth: 0.1,
    },
    headStyles: {
      fillColor: [13, 148, 136], // teal-600
      textColor: [255, 255, 255],
      font: fontName,
      fontStyle: 'bold',
      fontSize: 8.5,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252], // slate-50
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 38, fontStyle: 'bold', textColor: [37, 99, 235] }, // blue-600
      2: { cellWidth: 65, fontStyle: 'bold' },
      3: { cellWidth: 38, textColor: [15, 118, 110] }, // teal-700
      4: { cellWidth: 32, textColor: [29, 78, 216] }, // blue-700
      5: { cellWidth: 36, fontStyle: 'bold' },
      6: { cellWidth: 28 },
      7: { cellWidth: 38 },
    },
    margin: { top: 38, bottom: 16, left: 12, right: 12 },
    didDrawPage: (data) => {
      // Footer on every page
      const currentYear = new Date().getFullYear();
      doc.setFont(fontName, 'normal');
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(
        `World Wires Kft. · Raktári Nyilvántartó Rendszer © ${currentYear} · Helyi export`,
        14,
        pageHeight - 6
      );

      const pageStr = `Oldal ${data.pageNumber}`;
      doc.text(pageStr, pageWidth - 14 - doc.getTextWidth(pageStr), pageHeight - 6);
    },
  });

  const dateSlug = new Date().toISOString().slice(0, 10);
  doc.save(`World_Wires_Kft_Raktar_Termeklista_${dateSlug}.pdf`);
}

/**
 * 2. Export single item detailed datasheet to a professional technical PDF sheet.
 */
export async function exportItemDatasheetToPDF(
  item: InventoryItem,
  maintenanceRecords: MaintenanceRecord[] = [],
  similarRelations: ProductRelation[] = [],
  allItems: InventoryItem[] = [],
  connectorTerminalRelations: ProductRelation[] = []
): Promise<void> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const fontName = await applyHungarianFonts(doc);
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Top header banner - bright white
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, pageWidth, 28, 'F');
  doc.setDrawColor(226, 232, 240); // slate-200 border
  doc.setLineWidth(0.3);
  doc.line(0, 28, pageWidth, 28);

  // World Wires Kft. Emblem & Title
  drawWorldWiresPdfLogo(doc, 14, 6.5, 1.5);

  doc.setFont(fontName, 'bold');
  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42); // slate-900
  doc.text('WORLD WIRES KFT.', 44, 14);

  doc.setFont(fontName, 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(13, 148, 136); // teal-600
  doc.text('HIVATALOS TERMÉK ADATLAP · RAKTÁRI NYILVÁNTARTÁS', 44, 21);

  // Right side date/time
  doc.setFont(fontName, 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139); // slate-500
  const dateStr = new Date().toLocaleDateString('hu-HU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const dateWidth = doc.getTextWidth(dateStr);
  doc.text(dateStr, pageWidth - 14 - dateWidth, 16);

  // Product title container
  doc.setFillColor(248, 250, 252); // slate-50
  doc.rect(0, 28, pageWidth, 20, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.line(0, 48, pageWidth, 48);

  doc.setFont(fontName, 'bold');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('TERMÉK AZONOSÍTÓ & MEGNEVEZÉS', 14, 34);

  doc.setFont(fontName, 'bold');
  doc.setFontSize(14);
  doc.setTextColor(37, 99, 235); // blue-600
  doc.text(item.id, 14, 42);

  if (item.name) {
    const idWidth = doc.getTextWidth(item.id);
    doc.setFont(fontName, 'bold');
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42); // slate-900
    doc.text(`—  ${item.name}`, 14 + idWidth + 3, 42);
  }

  let currentY = 54;

  // Try to load primary image
  const primaryImage = (item.images && item.images.length > 0) ? item.images[0] : item.image;
  const imageInfo = await getImageDataUrl(primaryImage);

  if (imageInfo) {
    // Photo box
    const maxImgW = 80;
    const maxImgH = 55;
    const ratio = Math.min(maxImgW / imageInfo.width, maxImgH / imageInfo.height);
    const renderW = imageInfo.width * ratio;
    const renderH = imageInfo.height * ratio;

    doc.setFillColor(241, 245, 249);
    doc.roundedRect(pageWidth - 14 - maxImgW - 6, currentY, maxImgW + 6, maxImgH + 6, 2, 2, 'F');
    doc.addImage(
      imageInfo.dataUrl,
      'JPEG',
      pageWidth - 14 - maxImgW - 3 + (maxImgW - renderW) / 2,
      currentY + 3 + (maxImgH - renderH) / 2,
      renderW,
      renderH
    );

    // Label under photo
    doc.setFont(fontName, 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(
      'Termékfotó / Raktári minta',
      pageWidth - 14 - maxImgW - 3 + maxImgW / 2,
      currentY + maxImgH + 11,
      { align: 'center' }
    );
  }

  // Specifications table data
  const specData = [
    ['Termék ID', item.id || '-'],
    ['Termék név', item.name || '-'],
    ['Kategória', item.category || '-'],
    ['Gyártó', item.manufacturer || '-'],
    ['Alkatrész Hely', item.location || '-'],
    ['Gyári Kód', item.factoryCode || '-'],
    ['Adagolás', item.feeding || '-'],
    ['Szigelés Típus', item.insulationType || '-'],
    ['Alkatrész Típus', item.partType || '-'],
    ['Szigetelésmegfogó Típusa', item.insulationGripperType || '-'],
    ['Konektor Típusa', item.connectorType || '-'],
    ['Saru Típusa', item.terminalType || '-'],
    ['Minőség', item.quality || '-'],
    ['Dátum', item.date || '-'],
  ];

  // Filter out completely empty or '-' entries if desired, but keep standard specs
  const filteredSpecs = specData.filter(([, val]) => val && val !== '-' && val !== 'undefined');

  const tableWidth = imageInfo ? (pageWidth - 28 - 92) : (pageWidth - 28);

  autoTable(doc, {
    startY: currentY,
    body: filteredSpecs,
    theme: 'grid',
    styles: {
      font: fontName,
      fontSize: 9,
      cellPadding: 2.2,
      textColor: [15, 23, 42],
      lineColor: [226, 232, 240],
      lineWidth: 0.15,
    },
    columnStyles: {
      0: {
        cellWidth: 44,
        fontStyle: 'bold',
        fillColor: [248, 250, 252],
        textColor: [71, 85, 105],
      },
      1: {
        cellWidth: tableWidth - 44,
        fontStyle: 'bold',
      },
    },
    margin: { left: 14, right: imageInfo ? (14 + 92) : 14 },
  });

  // @ts-expect-error autoTable adds lastAutoTable to doc
  let nextY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 8 : currentY + 120;
  if (imageInfo && nextY < currentY + 70) {
    nextY = currentY + 70;
  }

  // Description / Notes section
  if (item.description && item.description.trim()) {
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(14, nextY, pageWidth - 28, 26, 2, 2, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(14, nextY, pageWidth - 28, 26, 2, 2, 'S');

    doc.setFont(fontName, 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(15, 118, 110);
    doc.text('LEÍRÁS ÉS MEGJEGYZÉS:', 18, nextY + 7);

    doc.setFont(fontName, 'normal');
    doc.setFontSize(9);
    doc.setTextColor(51, 65, 85);
    const splitDesc = doc.splitTextToSize(item.description, pageWidth - 36);
    doc.text(splitDesc, 18, nextY + 14);

    nextY += 32;
  }

  // Maintenance records section (only printed if maintenance records exist)
  if (maintenanceRecords && maintenanceRecords.length > 0) {
    if (nextY > pageHeight - 55) {
      doc.addPage();
      nextY = 20;
    }

    doc.setFillColor(6, 78, 59); // deep forest green #064e3b
    doc.roundedRect(14, nextY, pageWidth - 28, 8, 1.5, 1.5, 'F');
    doc.setFont(fontName, 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(255, 255, 255);
    doc.text('KARBANTARTÁSI TÖRTÉNET & SZERVIZNAPLÓ', 18, nextY + 5.5);

    const maintHead = [['Dátum', 'Státusz', 'Elvégzett Munka / Leírás', 'Kicserélt Alkatrész']];
    const maintBody = maintenanceRecords.map((m) => [
      m.date || '—',
      (m.changeItem && m.changeItem.trim()) ? 'Alkatrész Csere' : (m.status || 'Pass'),
      m.description || '—',
      m.changeItem || '—',
    ]);

    autoTable(doc, {
      startY: nextY + 10,
      head: maintHead,
      body: maintBody,
      theme: 'grid',
      headStyles: {
        fillColor: [6, 78, 59], // Dark forest green
        textColor: [255, 255, 255],
        font: fontName,
        fontStyle: 'bold',
        fontSize: 8,
      },
      styles: {
        font: fontName,
        fontSize: 8,
        cellPadding: 2,
        textColor: [15, 23, 42],
        lineColor: [209, 250, 229], // emerald-200
      },
      columnStyles: {
        0: { cellWidth: 26, fontStyle: 'bold' },
        1: { cellWidth: 32, fontStyle: 'bold' },
        2: { cellWidth: pageWidth - 28 - 26 - 32 - 42 },
        3: { cellWidth: 42, fontStyle: 'bold' },
      },
      didParseCell: (data) => {
        if (data.section === 'body' && data.column.index === 1) {
          const text = String(data.cell.raw || '');
          if (text.includes('Csere') || text.includes('Repair')) {
            data.cell.styles.textColor = [146, 64, 14]; // amber-800
            data.cell.styles.fillColor = [254, 243, 199]; // amber-100
          } else if (text.includes('Pass')) {
            data.cell.styles.textColor = [4, 120, 87]; // emerald-700
            data.cell.styles.fillColor = [209, 250, 229]; // emerald-100
          }
        }
      },
      margin: { left: 14, right: 14, bottom: 20 },
    });

    const finalMaintY = (doc as any).lastAutoTable?.finalY;
    if (finalMaintY) {
      nextY = finalMaintY + 10;
    } else {
      nextY += 35;
    }
  }

  // Similar products section (rendered only if relations exist for this item)
  if (similarRelations && similarRelations.length > 0) {
    const cleanCurrentId = item.id.trim().toLowerCase();
    
    // Deduplicate relations by related target product ID so each item appears only once
    const seenTarget = new Set<string>();
    const uniqueSimilar: { id: string; name: string; factoryCode: string; notes: string }[] = [];

    // Lookup map of all items
    const itemLookup = new Map<string, InventoryItem>();
    for (const it of allItems) {
      itemLookup.set(it.id.toLowerCase(), it);
      if (it.factoryCode) itemLookup.set(it.factoryCode.toLowerCase(), it);
    }

    for (const rel of similarRelations) {
      const otherId =
        rel.itemId1.trim().toLowerCase() === cleanCurrentId
          ? rel.itemId2
          : rel.itemId1;
      const lowerOther = otherId.trim().toLowerCase();

      if (!seenTarget.has(lowerOther) && lowerOther !== cleanCurrentId) {
        seenTarget.add(lowerOther);
        const match = itemLookup.get(lowerOther);
        uniqueSimilar.push({
          id: otherId,
          name: match?.name || '—',
          factoryCode: match?.factoryCode || '—',
          notes: rel.notes || 'Hasonló / alternatív tétel',
        });
      }
    }

    if (uniqueSimilar.length > 0) {
      if (nextY > pageHeight - 55) {
        doc.addPage();
        nextY = 20;
      }

      // Sötét lila fejrész banner
      doc.setFillColor(59, 7, 100); // deep dark purple #3b0764 (purple-950)
      doc.roundedRect(14, nextY, pageWidth - 28, 8, 1.5, 1.5, 'F');
      doc.setFont(fontName, 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(255, 255, 255);
      doc.text(`KAPCSOLÓDÓ & HASONLÓ TERMÉKEK (${uniqueSimilar.length} db)`, 18, nextY + 5.5);

      const simHead = [['Hasonló Termék ID', 'Megnevezés', 'Gyári Kód', 'Kapcsolat / Megjegyzés']];
      const simBody = uniqueSimilar.map((s) => [
        s.id,
        s.name,
        s.factoryCode,
        s.notes,
      ]);

      autoTable(doc, {
        startY: nextY + 10,
        head: simHead,
        body: simBody,
        theme: 'grid',
        headStyles: {
          fillColor: [88, 28, 135], // Dark purple (purple-900)
          textColor: [255, 255, 255],
          font: fontName,
          fontStyle: 'bold',
          fontSize: 8,
        },
        styles: {
          font: fontName,
          fontSize: 8,
          cellPadding: 2.2,
          textColor: [15, 23, 42],
          lineColor: [233, 213, 255], // purple-200
        },
        columnStyles: {
          0: { cellWidth: 42, fontStyle: 'bold', textColor: [88, 28, 135] },
          1: { cellWidth: 50 },
          2: { cellWidth: 32, fontStyle: 'bold' },
          3: { cellWidth: pageWidth - 28 - 42 - 50 - 32 },
        },
        margin: { left: 14, right: 14, bottom: 20 },
      });

      const finalSimY = (doc as any).lastAutoTable?.finalY;
      if (finalSimY) {
        nextY = finalSimY + 10;
      } else {
        nextY += 35;
      }
    }
  }

  // Connector & Terminal relations section (rendered only if relations exist for this item)
  if (connectorTerminalRelations && connectorTerminalRelations.length > 0) {
    const cleanCurrentId = item.id.trim().toLowerCase();
    
    // Deduplicate relations by related target product ID so each item appears only once
    const seenTargetCT = new Set<string>();
    const uniqueConnectorTerminal: { id: string; name: string; factoryCode: string; category: string; notes: string }[] = [];

    // Lookup map of all items
    const itemLookup = new Map<string, InventoryItem>();
    for (const it of allItems) {
      itemLookup.set(it.id.toLowerCase(), it);
      if (it.factoryCode) itemLookup.set(it.factoryCode.toLowerCase(), it);
    }

    for (const rel of connectorTerminalRelations) {
      const otherId =
        rel.itemId1.trim().toLowerCase() === cleanCurrentId
          ? rel.itemId2
          : rel.itemId1;
      const lowerOther = otherId.trim().toLowerCase();

      if (!seenTargetCT.has(lowerOther) && lowerOther !== cleanCurrentId) {
        seenTargetCT.add(lowerOther);
        const match = itemLookup.get(lowerOther);
        uniqueConnectorTerminal.push({
          id: otherId,
          name: match?.name || '—',
          factoryCode: match?.factoryCode || '—',
          category: match?.category || 'Konnektor / Saru',
          notes: rel.notes || 'Párosított alkatrész',
        });
      }
    }

    if (uniqueConnectorTerminal.length > 0) {
      if (nextY > pageHeight - 55) {
        doc.addPage();
        nextY = 20;
      }

      // Narancssárga fejrész banner
      doc.setFillColor(194, 65, 12); // deep warm orange / amber-700
      doc.roundedRect(14, nextY, pageWidth - 28, 8, 1.5, 1.5, 'F');
      doc.setFont(fontName, 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(255, 255, 255);
      doc.text(`KONNEKTOR & SARU KAPCSOLATOK (${uniqueConnectorTerminal.length} db)`, 18, nextY + 5.5);

      const ctHead = [['Kapcsolt Termék ID', 'Kategória', 'Megnevezés', 'Gyári Kód', 'Megjegyzés']];
      const ctBody = uniqueConnectorTerminal.map((c) => [
        c.id,
        c.category,
        c.name,
        c.factoryCode,
        c.notes,
      ]);

      autoTable(doc, {
        startY: nextY + 10,
        head: ctHead,
        body: ctBody,
        theme: 'grid',
        headStyles: {
          fillColor: [217, 119, 6], // amber-600 / orange
          textColor: [255, 255, 255],
          font: fontName,
          fontStyle: 'bold',
          fontSize: 8,
        },
        styles: {
          font: fontName,
          fontSize: 8,
          cellPadding: 2.2,
          textColor: [15, 23, 42],
          lineColor: [254, 215, 170], // orange-200
        },
        columnStyles: {
          0: { cellWidth: 40, fontStyle: 'bold', textColor: [180, 83, 9] },
          1: { cellWidth: 30, fontStyle: 'bold' },
          2: { cellWidth: 45 },
          3: { cellWidth: 30, fontStyle: 'bold' },
          4: { cellWidth: pageWidth - 28 - 40 - 30 - 45 - 30 },
        },
        margin: { left: 14, right: 14, bottom: 20 },
      });
    }
  }

  // Footer notes & verification sign box
  doc.setDrawColor(226, 232, 240);
  doc.line(14, pageHeight - 22, pageWidth - 14, pageHeight - 22);

  doc.setFont(fontName, 'normal');
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text('World Wires Kft. · Raktári Nyilvántartás · Hivatalos Termék Adatlap', 14, pageHeight - 14);

  const safeFilename = item.id.replace(/[^a-zA-Z0-9_-]/g, '_');
  doc.save(`World_Wires_Kft_Adatlap_${safeFilename}.pdf`);
}
