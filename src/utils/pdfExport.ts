import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { BuildingInputs, CalculatedValues, MaterialRow } from '../types';

// Beräkna totalpris för en materialrad
function calculateTotalPrice(m: MaterialRow): number {
  const mangdMedSpill = m.mangd * (1 + m.spillPct / 100);
  const inkopMedSpill = mangdMedSpill * m.inkopspris;
  return inkopMedSpill * (1 + m.paslagPct / 100);
}

// Beräkna inköpstotal (inkl spill)
function calculateInkopTotal(m: MaterialRow): number {
  const mangdMedSpill = m.mangd * (1 + m.spillPct / 100);
  return mangdMedSpill * m.inkopspris;
}

function formatNumber(num: number, decimals: number = 1): string {
  return num.toLocaleString('sv-SE', { 
    minimumFractionDigits: decimals, 
    maximumFractionDigits: decimals 
  });
}

function formatCurrency(num: number): string {
  return num.toLocaleString('sv-SE', { 
    minimumFractionDigits: 0, 
    maximumFractionDigits: 0 
  }) + ' kr';
}

function formatTime(hours: number): string {
  if (hours === 0) return '0min';
  const totalMinutes = Math.round(hours * 60);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (h === 0) return `${m}min`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}min`;
}

export async function exportToPDF(
  projektNamn: string,
  inputs: BuildingInputs,
  calculated: CalculatedValues,
  materials: MaterialRow[]
): Promise<void> {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Ladda loggan
  let logoLoaded = false;
  try {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    await new Promise<void>((resolve, reject) => {
      img.onload = () => {
        doc.addImage(img, 'PNG', 14, 10, 40, 20);
        logoLoaded = true;
        resolve();
      };
      img.onerror = () => resolve(); // Fortsätt även om loggan inte kan laddas
      img.src = '/logo.png';
    });
  } catch {
    // Ignorera fel vid laddning av logga
  }

  const startY = logoLoaded ? 35 : 20;
  
  // Rubrik
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('OFFERT', pageWidth - 14, 20, { align: 'right' });
  
  // Projektnamn med label - beräkna positioner från höger
  const projektText = projektNamn || 'Timmerhusprojekt';
  const rightMargin = 14;
  
  // Mät projektnamnet
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  const projektWidth = doc.getTextWidth(projektText);
  
  // Mät labeln
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  const labelText = 'Projekt:';
  const labelWidth = doc.getTextWidth(labelText);
  
  // Rita labeln (grå)
  const labelX = pageWidth - rightMargin - projektWidth - 6 - labelWidth;
  doc.setTextColor(100);
  doc.text(labelText, labelX, 28);
  
  // Rita projektnamnet (svart, fetstil)
  doc.setTextColor(0);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(projektText, pageWidth - rightMargin, 28, { align: 'right' });
  
  // Datum
  doc.setFontSize(10);
  doc.setTextColor(100);
  const datum = new Date().toLocaleDateString('sv-SE');
  doc.text(`Datum: ${datum}`, pageWidth - 14, 35, { align: 'right' });
  doc.setTextColor(0);

  // Linje under header
  doc.setDrawColor(200);
  doc.line(14, startY + 5, pageWidth - 14, startY + 5);

  // Byggspecifikation
  let yPos = startY + 15;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Byggspecifikation', 14, yPos);
  
  yPos += 8;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  const specs = [
    [`Typ: ${inputs.roofType === 'sadeltak' ? 'Sadeltak' : 'Pulpettak'}`, `Mått: ${formatNumber(inputs.length, 1)} × ${formatNumber(inputs.width, 1)} m`],
    [`Vägghöjd: ${formatNumber(inputs.wallHeight, 2)} m`, `Total höjd: ${formatNumber(calculated.totalHeight, 2)} m`],
    [`Golvyta: ${formatNumber(calculated.innerArea, 1)} m²`, `Takarea: ${formatNumber(calculated.roofArea, 1)} m²`],
    [`Väggyta: ${formatNumber(calculated.vaggAreaNetto, 1)} m²`, `Timmerlängd: ${formatNumber(calculated.totalLoggNetto, 1)} m`],
  ];

  specs.forEach(row => {
    doc.text(row[0], 14, yPos);
    doc.text(row[1], pageWidth / 2, yPos);
    yPos += 5;
  });

  yPos += 5;

  // Materiallista
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Materiallista', 14, yPos);
  yPos += 5;

  const activeMaterials = materials.filter(m => m.taMed && m.mangd > 0);
  
  // Gruppera per kategori
  const grouped: Record<string, MaterialRow[]> = {};
  activeMaterials.forEach(m => {
    if (!grouped[m.kategori]) grouped[m.kategori] = [];
    grouped[m.kategori].push(m);
  });

  const tableData: (string | number)[][] = [];
  Object.entries(grouped).forEach(([kategori, items]) => {
    // Kategori-rad
    tableData.push([{ content: kategori, colSpan: 4, styles: { fontStyle: 'bold', fillColor: [240, 240, 240] } } as any]);
    items.forEach(m => {
      // Mängd inkl spill
      const mangdMedSpill = m.mangd * (1 + m.spillPct / 100);
      // À-pris med påslag (försäljningspris per enhet)
      const aPrisMedPaslag = m.inkopspris * (1 + m.paslagPct / 100);
      // Totalpris
      const totalPris = mangdMedSpill * aPrisMedPaslag;
      
      tableData.push([
        m.artikel,
        `${formatNumber(mangdMedSpill, 1)} ${m.enhet}`,
        formatCurrency(aPrisMedPaslag) + '/' + m.enhet,
        formatCurrency(totalPris)
      ]);
    });
  });

  autoTable(doc, {
    startY: yPos,
    head: [[
      { content: 'Artikel', styles: { halign: 'left' } },
      { content: 'Mängd (inkl. spill)', styles: { halign: 'right' } },
      { content: 'À-pris', styles: { halign: 'right' } },
      { content: 'Summa', styles: { halign: 'right' } }
    ]],
    body: tableData,
    theme: 'striped',
    headStyles: { 
      fillColor: [66, 139, 139], 
      textColor: 255
    },
    styles: { fontSize: 9, cellPadding: 2 },
    columnStyles: {
      0: { cellWidth: 70, halign: 'left' },
      1: { cellWidth: 40, halign: 'right' },
      2: { cellWidth: 30, halign: 'right' },
      3: { cellWidth: 35, halign: 'right' },
    },
  });

  // @ts-ignore - autoTable adds this property
  yPos = doc.lastAutoTable.finalY + 10;

  // Kontrollera om vi behöver ny sida
  if (yPos > 250) {
    doc.addPage();
    yPos = 20;
  }

  // Summering
  const totMatInkop = activeMaterials.reduce((sum, m) => sum + calculateInkopTotal(m), 0);
  const totMatFors = activeMaterials.reduce((sum, m) => sum + calculateTotalPrice(m), 0);
  const totalTid = activeMaterials.reduce((sum, m) => sum + m.mangd * m.enhetstid, 0);
  const arbetskostnad = totalTid * inputs.timkostnad;
  const offertExMoms = totMatFors + arbetskostnad;
  const moms = offertExMoms * inputs.momsPct / 100;
  const offertInklMoms = offertExMoms + moms;

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Sammanställning', 14, yPos);
  yPos += 8;

  const summaryData = [
    ['Material (försäljning)', formatCurrency(totMatFors)],
    [`Arbete (${formatTime(totalTid)} × ${formatCurrency(inputs.timkostnad)}/h)`, formatCurrency(arbetskostnad)],
    ['Summa exkl. moms', formatCurrency(offertExMoms)],
    [`Moms (${inputs.momsPct}%)`, formatCurrency(moms)],
  ];

  autoTable(doc, {
    startY: yPos,
    body: summaryData,
    theme: 'plain',
    styles: { fontSize: 10, cellPadding: 2 },
    columnStyles: {
      0: { cellWidth: 100 },
      1: { cellWidth: 50, halign: 'right' },
    },
  });

  // @ts-ignore
  yPos = doc.lastAutoTable.finalY + 5;

  // Total ruta
  doc.setFillColor(66, 139, 139);
  doc.rect(pageWidth - 80, yPos, 66, 15, 'F');
  doc.setTextColor(255);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('TOTALT INKL. MOMS', pageWidth - 77, yPos + 6);
  doc.setFontSize(14);
  doc.text(formatCurrency(offertInklMoms), pageWidth - 17, yPos + 12, { align: 'right' });
  doc.setTextColor(0);

  // Footer
  yPos = doc.internal.pageSize.getHeight() - 20;
  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.text('Bruksstugan - timmer • hyvleri • snickeri', 14, yPos);
  doc.text(`Genererad ${datum}`, pageWidth - 14, yPos, { align: 'right' });

  // Spara PDF
  const filename = projektNamn 
    ? `Offert_${projektNamn.replace(/[^a-zA-Z0-9åäöÅÄÖ]/g, '_')}_${datum}.pdf`
    : `Offert_${datum}.pdf`;
  doc.save(filename);
}

