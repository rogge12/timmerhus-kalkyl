// Script för att skapa Excel-fil med Material och Ekonomi-flikar
import * as XLSX from 'xlsx';
import { writeFileSync } from 'fs';

// Material data
const materialData = [
  { Kategori: "Golv", Artikel: "Golvreglar 45x145-220", Enhet: "lm", MangdPerM2: 1.67, Enhetstid: 0.20, Inkopspris: 45, Forsaljningspris: 85, TaMed: true, Notering: "Impregnerad" },
  { Kategori: "Golv", Artikel: "Stödregel 45x45", Enhet: "lm", MangdPerM2: 0.41, Enhetstid: 0.06, Inkopspris: 15, Forsaljningspris: 30, TaMed: true, Notering: "Impregnerad" },
  { Kategori: "Golv", Artikel: "Trallgolv 120mm", Enhet: "lm", MangdPerM2: 8.4, Enhetstid: 0.035, Inkopspris: 25, Forsaljningspris: 45, TaMed: true, Notering: "9.52 lm/m²" },
  
  { Kategori: "Stomme", Artikel: "Timmer (tillverkning)", Enhet: "m2", MangdPerM2: 1.0, Enhetstid: 1.50, Inkopspris: 60, Forsaljningspris: 120, TaMed: true, Notering: "Väggarea m² × pris/m" },
  { Kategori: "Stomme", Artikel: "Montering stomme", Enhet: "m2", MangdPerM2: 1.0, Enhetstid: 0.80, Inkopspris: 0, Forsaljningspris: 0, TaMed: true, Notering: "Endast arbetstid" },
  { Kategori: "Stomme", Artikel: "Syllvirke 45x95", Enhet: "lm", MangdPerM2: 0.0, Enhetstid: 0.10, Inkopspris: 25, Forsaljningspris: 45, TaMed: true, Notering: "Syllomkrets" },
  
  { Kategori: "Tak", Artikel: "Takåsar", Enhet: "lm", MangdPerM2: 0.0, Enhetstid: 0.15, Inkopspris: 85, Forsaljningspris: 150, TaMed: true, Notering: "Antal × taklängd" },
  { Kategori: "Tak", Artikel: "Råspont", Enhet: "m2", MangdPerM2: 1.0, Enhetstid: 0.20, Inkopspris: 95, Forsaljningspris: 165, TaMed: true, Notering: "" },
  { Kategori: "Tak", Artikel: "Underlagspapp", Enhet: "m2", MangdPerM2: 1.0, Enhetstid: 0.05, Inkopspris: 35, Forsaljningspris: 55, TaMed: true, Notering: "" },
  { Kategori: "Tak", Artikel: "Ströläkt 12x50", Enhet: "lm", MangdPerM2: 2.0, Enhetstid: 0.04, Inkopspris: 8, Forsaljningspris: 15, TaMed: true, Notering: "c/c 0.6" },
  { Kategori: "Tak", Artikel: "Bärläkt 28x70", Enhet: "lm", MangdPerM2: 1.67, Enhetstid: 0.08, Inkopspris: 12, Forsaljningspris: 22, TaMed: true, Notering: "c/c 0.35" },
  { Kategori: "Tak", Artikel: "Takplåt", Enhet: "m2", MangdPerM2: 1.0, Enhetstid: 0.25, Inkopspris: 120, Forsaljningspris: 195, TaMed: true, Notering: "" },
  { Kategori: "Tak", Artikel: "Fotplåt", Enhet: "lm", MangdPerM2: 0.0, Enhetstid: 0.12, Inkopspris: 45, Forsaljningspris: 75, TaMed: true, Notering: "2 × taklängd" },
  { Kategori: "Tak", Artikel: "Vindskivor 22x145", Enhet: "lm", MangdPerM2: 0.0, Enhetstid: 0.40, Inkopspris: 55, Forsaljningspris: 95, TaMed: true, Notering: "4 × takfall" },
  { Kategori: "Tak", Artikel: "Takfotsbräda 22x145", Enhet: "lm", MangdPerM2: 0.0, Enhetstid: 0.15, Inkopspris: 25, Forsaljningspris: 45, TaMed: true, Notering: "2 × taklängd" },
  { Kategori: "Tak", Artikel: "Regnvattensystem", Enhet: "lm", MangdPerM2: 0.0, Enhetstid: 0.20, Inkopspris: 85, Forsaljningspris: 145, TaMed: true, Notering: "2 × taklängd" },
  { Kategori: "Tak", Artikel: "Nockplåt", Enhet: "lm", MangdPerM2: 0.0, Enhetstid: 0.10, Inkopspris: 65, Forsaljningspris: 110, TaMed: true, Notering: "Taklängd" },
];

// Ekonomi data
const ekonomiData = [
  { Parameter: "PrisTimmerIn", Värde: 60, Beskrivning: "Inköpspris timmer (kr/m)" },
  { Parameter: "PrisTimmerUt", Värde: 120, Beskrivning: "Försäljningspris timmer (kr/m)" },
  { Parameter: "Timkostnad", Värde: 450, Beskrivning: "Timkostnad (kr/h)" },
  { Parameter: "MomsPct", Värde: 25, Beskrivning: "Moms (%)" },
];

// Skapa workbook
const workbook = XLSX.utils.book_new();

// Lägg till Material-flik
const materialSheet = XLSX.utils.json_to_sheet(materialData);
XLSX.utils.book_append_sheet(workbook, materialSheet, 'Material');

// Lägg till Ekonomi-flik
const ekonomiSheet = XLSX.utils.json_to_sheet(ekonomiData);
XLSX.utils.book_append_sheet(workbook, ekonomiSheet, 'Ekonomi');

// Skriv fil
XLSX.writeFile(workbook, 'public/material_prislista.xlsx');

console.log('✅ Excel-fil skapad: public/material_prislista.xlsx');
console.log('   - Material-flik med', materialData.length, 'artiklar');
console.log('   - Ekonomi-flik med', ekonomiData.length, 'parametrar');

