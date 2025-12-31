import * as XLSX from 'xlsx';
import type { PrislistaMaterial, EkonomiSettings } from '../types';

export interface ExcelData {
  materials: PrislistaMaterial[];
  ekonomi: EkonomiSettings;
}

export async function loadPrislistaFromFile(file: File): Promise<ExcelData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Läs material från första fliken
        const materialSheet = workbook.Sheets[workbook.SheetNames[0]];
        const materialData = XLSX.utils.sheet_to_json(materialSheet);
        const materials = parsePrislista(materialData);
        
        // Läs ekonomi från "Ekonomi" fliken om den finns
        const ekonomi = parseEkonomiSheet(workbook);
        
        resolve({ materials, ekonomi });
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsArrayBuffer(file);
  });
}

export async function loadDefaultPrislista(): Promise<ExcelData> {
  try {
    const response = await fetch('/material_prislista.xlsx');
    const arrayBuffer = await response.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    
    // Läs material från första fliken
    const materialSheet = workbook.Sheets[workbook.SheetNames[0]];
    const materialData = XLSX.utils.sheet_to_json(materialSheet);
    const materials = parsePrislista(materialData);
    
    // Läs ekonomi från "Ekonomi" fliken om den finns
    const ekonomi = parseEkonomiSheet(workbook);
    
    return { materials, ekonomi };
  } catch (error) {
    console.error('Could not load default prislista:', error);
    return { 
      materials: getHardcodedDefaults(),
      ekonomi: getDefaultEkonomi()
    };
  }
}

function parseEkonomiSheet(workbook: XLSX.WorkBook): EkonomiSettings {
  // Försök hitta "Ekonomi" fliken (case-insensitive)
  const ekonomiSheetName = workbook.SheetNames.find(
    name => name.toLowerCase() === 'ekonomi'
  );
  
  if (!ekonomiSheetName) {
    console.log('Ingen "Ekonomi" flik hittades, använder standardvärden');
    return getDefaultEkonomi();
  }
  
  const sheet = workbook.Sheets[ekonomiSheetName];
  const data = XLSX.utils.sheet_to_json(sheet);
  
  // Ekonomi-fliken kan vara i två format:
  // 1. Nyckel-värde par i kolumn A och B
  // 2. En rad med kolumnrubriker
  
  const ekonomi = getDefaultEkonomi();
  
  data.forEach((row: unknown) => {
    const r = row as Record<string, unknown>;
    
    // Format 1: Nyckel i första kolumnen, värde i andra
    const key = String(r['Parameter'] || r['Namn'] || r['Nyckel'] || '').toLowerCase();
    const value = Number(r['Värde'] || r['Value'] || r['Varde'] || 0);
    
    if (key.includes('timmer') && key.includes('inköp') || key.includes('pristimmerin')) {
      ekonomi.prisTimmerIn = value;
    } else if (key.includes('timmer') && key.includes('försälj') || key.includes('pristimmerut')) {
      ekonomi.prisTimmerUt = value;
    } else if (key.includes('timkostnad') || key.includes('timkost')) {
      ekonomi.timkostnad = value;
    } else if (key.includes('moms')) {
      ekonomi.momsPct = value;
    }
    
    // Format 2: Direkt kolumnnamn
    if (r['PrisTimmerIn'] !== undefined) ekonomi.prisTimmerIn = Number(r['PrisTimmerIn']);
    if (r['PrisTimmerUt'] !== undefined) ekonomi.prisTimmerUt = Number(r['PrisTimmerUt']);
    if (r['Timkostnad'] !== undefined) ekonomi.timkostnad = Number(r['Timkostnad']);
    if (r['MomsPct'] !== undefined || r['Moms'] !== undefined) {
      ekonomi.momsPct = Number(r['MomsPct'] || r['Moms']);
    }
  });
  
  return ekonomi;
}

function getDefaultEkonomi(): EkonomiSettings {
  return {
    prisTimmerIn: 458,
    prisTimmerUt: 850,
    timkostnad: 550,
    momsPct: 25,
  };
}

function parsePrislista(data: unknown[]): PrislistaMaterial[] {
  return data.map((row: unknown) => {
    const r = row as Record<string, unknown>;
    return {
      kategori: String(r['Kategori'] || r['kategori'] || ''),
      artikel: String(r['Artikel'] || r['artikel'] || ''),
      enhet: String(r['Enhet'] || r['enhet'] || ''),
      mangdPerM2: Number(r['MangdPerM2'] || r['mangdPerM2'] || r['Mängd/m2'] || 0),
      enhetstid: Number(r['Enhetstid'] || r['enhetstid'] || 0),
      inkopspris: Number(r['Inkopspris'] || r['inkopspris'] || r['Inköpspris'] || 0),
      spillPct: Number(r['SpillPct'] || r['spillPct'] || r['Spill%'] || 10),  // Default 10%
      paslagPct: Number(r['PaslagPct'] || r['paslagPct'] || r['Påslag%'] || 30),  // Default 30%
      taMed: r['TaMed'] === true || r['TaMed'] === 'TRUE' || r['TaMed'] === 1 || r['taMed'] === true,
      notering: String(r['Notering'] || r['notering'] || ''),
    };
  });
}

// Fallback if Excel can't be loaded
function getHardcodedDefaults(): PrislistaMaterial[] {
  return [
    // GOLV
    { kategori: "Golv", artikel: "Golvreglar 45x145-220", enhet: "lm", mangdPerM2: 1.67, enhetstid: 0.20, inkopspris: 45, spillPct: 10, paslagPct: 30, taMed: true, notering: "Impregnerad" },
    { kategori: "Golv", artikel: "Stödregel 45x45", enhet: "lm", mangdPerM2: 0.41, enhetstid: 0.06, inkopspris: 15, spillPct: 10, paslagPct: 30, taMed: true, notering: "Impregnerad" },
    { kategori: "Golv", artikel: "Trallgolv 120mm", enhet: "lm", mangdPerM2: 8.4, enhetstid: 0.035, inkopspris: 25, spillPct: 10, paslagPct: 30, taMed: true, notering: "9.52 lm/m²" },
    { kategori: "Golv", artikel: "Bärlina 45x95", enhet: "lm", mangdPerM2: 0, enhetstid: 0.1, inkopspris: 25, spillPct: 10, paslagPct: 30, taMed: true, notering: "Stommens bredd, för betongstensgrund" },
    
    // STOMME
    { kategori: "Stomme", artikel: "Timmerväggar", enhet: "m2", mangdPerM2: 1.0, enhetstid: 1.50, inkopspris: 450, spillPct: 0, paslagPct: 30, taMed: true, notering: "Väggarea" },
    { kategori: "Stomme", artikel: "Syllvirke 45x95", enhet: "lm", mangdPerM2: 0.0, enhetstid: 0.10, inkopspris: 25, spillPct: 10, paslagPct: 30, taMed: true, notering: "Perimeter" },
    { kategori: "Stomme", artikel: "Dragstång", enhet: "st", mangdPerM2: 0, enhetstid: 0.15, inkopspris: 90, spillPct: 0, paslagPct: 15, taMed: true, notering: "Fast antal: 6 st" },
    
    // TAK
    { kategori: "Tak", artikel: "Takåsar", enhet: "lm", mangdPerM2: 0.0, enhetstid: 0.15, inkopspris: 85, spillPct: 10, paslagPct: 30, taMed: true, notering: "Antal × taklängd" },
    { kategori: "Tak", artikel: "Råspont", enhet: "m2", mangdPerM2: 1.0, enhetstid: 0.20, inkopspris: 95, spillPct: 10, paslagPct: 30, taMed: true, notering: "" },
    { kategori: "Tak", artikel: "Underlagspapp", enhet: "m2", mangdPerM2: 1.0, enhetstid: 0.05, inkopspris: 35, spillPct: 5, paslagPct: 30, taMed: true, notering: "" },
    { kategori: "Tak", artikel: "Ströläkt 12x50", enhet: "lm", mangdPerM2: 2.0, enhetstid: 0.04, inkopspris: 8, spillPct: 10, paslagPct: 30, taMed: true, notering: "c/c 0.6" },
    { kategori: "Tak", artikel: "Bärläkt 28x70", enhet: "lm", mangdPerM2: 1.67, enhetstid: 0.08, inkopspris: 12, spillPct: 10, paslagPct: 30, taMed: true, notering: "c/c 0.35" },
    { kategori: "Tak", artikel: "Takplåt", enhet: "m2", mangdPerM2: 1.0, enhetstid: 0.25, inkopspris: 120, spillPct: 5, paslagPct: 30, taMed: true, notering: "" },
    { kategori: "Tak", artikel: "Fotplåt", enhet: "lm", mangdPerM2: 0.0, enhetstid: 0.12, inkopspris: 45, spillPct: 5, paslagPct: 30, taMed: true, notering: "2 × taklängd" },
    { kategori: "Tak", artikel: "Vindskivor 22x145", enhet: "lm", mangdPerM2: 0.0, enhetstid: 0.40, inkopspris: 55, spillPct: 10, paslagPct: 30, taMed: true, notering: "4 × takfall" },
    { kategori: "Tak", artikel: "Takfotsbräda 22x145", enhet: "lm", mangdPerM2: 0.0, enhetstid: 0.15, inkopspris: 25, spillPct: 10, paslagPct: 30, taMed: true, notering: "2 × taklängd" },
    { kategori: "Tak", artikel: "Regnvattensystem", enhet: "lm", mangdPerM2: 0.0, enhetstid: 0.20, inkopspris: 85, spillPct: 5, paslagPct: 30, taMed: true, notering: "2 × taklängd" },
    
    // GRUND
    { kategori: "Grund", artikel: "Plintar", enhet: "st", mangdPerM2: 0, enhetstid: 0.15, inkopspris: 150, spillPct: 0, paslagPct: 30, taMed: true, notering: "20cm höga, c/c baserat på golvreglar" },
    { kategori: "Grund", artikel: "Betongsten 40x40x10", enhet: "st", mangdPerM2: 0, enhetstid: 0.1, inkopspris: 150, spillPct: 0, paslagPct: 30, taMed: true, notering: "2 st staplade = 20cm höjd" },
  ];
}

