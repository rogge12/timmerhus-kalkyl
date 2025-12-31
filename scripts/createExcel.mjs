// Script för att skapa Excel-fil med Material och Ekonomi-flikar
import * as XLSX from 'xlsx';

// Material data (uppdaterad med SpillPct och PaslagPct istället för Forsaljningspris)
const materialData = [
  { Kategori: "Golv", Artikel: "Golvreglar 45x145-220", Enhet: "lm", MangdPerM2: 1.67, Enhetstid: 0.2, Inkopspris: 45, SpillPct: 10, PaslagPct: 30, TaMed: true, Notering: "Impregnerad" },
  { Kategori: "Golv", Artikel: "Stödregel 45x45", Enhet: "lm", MangdPerM2: 1, Enhetstid: 0.06, Inkopspris: 12, SpillPct: 10, PaslagPct: 30, TaMed: true, Notering: "Impregnerad" },
  { Kategori: "Golv", Artikel: "Trallgolv", Enhet: "m2", MangdPerM2: 1, Enhetstid: 0.15, Inkopspris: 195, SpillPct: 10, PaslagPct: 30, TaMed: true, Notering: "Beräknas på golvyta" },
  { Kategori: "Golv", Artikel: "Trossbottenskiva", Enhet: "st", MangdPerM2: 1.389, Enhetstid: 0.15, Inkopspris: 85, SpillPct: 5, PaslagPct: 30, TaMed: true, Notering: "0.72 m²/skiva, avrundas uppåt" },
  { Kategori: "Golv", Artikel: "Trossbottenpapp", Enhet: "m2", MangdPerM2: 1, Enhetstid: 0.05, Inkopspris: 25, SpillPct: 5, PaslagPct: 30, TaMed: true, Notering: "Beräknas på golvyta" },
  { Kategori: "Golv", Artikel: "Spånskivegolv", Enhet: "m2", MangdPerM2: 1, Enhetstid: 0.3, Inkopspris: 95, SpillPct: 10, PaslagPct: 30, TaMed: true, Notering: "Beräknas på golvyta" },
  { Kategori: "Golv", Artikel: "Isolering golv", Enhet: "m2", MangdPerM2: 1, Enhetstid: 0.18, Inkopspris: 75, SpillPct: 5, PaslagPct: 30, TaMed: true, Notering: "Beräknas på golvyta" },
  { Kategori: "Golv", Artikel: "Bärlina 45x95", Enhet: "lm", MangdPerM2: 0, Enhetstid: 0.1, Inkopspris: 25, SpillPct: 10, PaslagPct: 30, TaMed: true, Notering: "Stommens bredd, för betongstensgrund" },
  
  { Kategori: "Stomme", Artikel: "Timmer (tillverkning)", Enhet: "m2", MangdPerM2: 1, Enhetstid: 0, Inkopspris: 458, SpillPct: 0, PaslagPct: 86, TaMed: true, Notering: "Pris inkl. tillverkning (~27min/m²)" },
  { Kategori: "Stomme", Artikel: "Montering stomme", Enhet: "m2", MangdPerM2: 1, Enhetstid: 0.4, Inkopspris: 0, SpillPct: 0, PaslagPct: 0, TaMed: true, Notering: "Endast arbetstid" },
  { Kategori: "Stomme", Artikel: "Syllvirke 45x95", Enhet: "lm", MangdPerM2: 0, Enhetstid: 0.1, Inkopspris: 25, SpillPct: 10, PaslagPct: 30, TaMed: true, Notering: "Syllomkrets" },
  { Kategori: "Stomme", Artikel: "Dragstång", Enhet: "st", MangdPerM2: 0, Enhetstid: 0.15, Inkopspris: 90, SpillPct: 0, PaslagPct: 15, TaMed: true, Notering: "Fast antal: 6 st" },
  
  { Kategori: "Tak", Artikel: "Takåsar", Enhet: "lm", MangdPerM2: 0, Enhetstid: 0.15, Inkopspris: 85, SpillPct: 10, PaslagPct: 30, TaMed: true, Notering: "Antal × taklängd" },
  { Kategori: "Tak", Artikel: "Råspont", Enhet: "m2", MangdPerM2: 1, Enhetstid: 0.2, Inkopspris: 95, SpillPct: 10, PaslagPct: 30, TaMed: true, Notering: "" },
  { Kategori: "Tak", Artikel: "Underlagspapp", Enhet: "m2", MangdPerM2: 1, Enhetstid: 0.08, Inkopspris: 35, SpillPct: 5, PaslagPct: 30, TaMed: true, Notering: "" },
  { Kategori: "Tak", Artikel: "Ströläkt 12x50", Enhet: "lm", MangdPerM2: 2, Enhetstid: 0.05, Inkopspris: 8, SpillPct: 10, PaslagPct: 30, TaMed: true, Notering: "c/c 0.6" },
  { Kategori: "Tak", Artikel: "Bärläkt 28x70", Enhet: "lm", MangdPerM2: 1.67, Enhetstid: 0.1, Inkopspris: 12, SpillPct: 10, PaslagPct: 30, TaMed: true, Notering: "c/c 0.5" },
  { Kategori: "Tak", Artikel: "Takplåt", Enhet: "m2", MangdPerM2: 1, Enhetstid: 0.3, Inkopspris: 120, SpillPct: 5, PaslagPct: 30, TaMed: true, Notering: "" },
  { Kategori: "Tak", Artikel: "Fotplåt", Enhet: "st", MangdPerM2: 1.9, Enhetstid: 0.12, Inkopspris: 45, SpillPct: 5, PaslagPct: 30, TaMed: true, Notering: "Täcker 1.9m/st (sadeltak: 2 sidor, pulpet: 1 sida)" },
  { Kategori: "Tak", Artikel: "Vindskivor 22x145", Enhet: "lm", MangdPerM2: 2, Enhetstid: 0.15, Inkopspris: 55, SpillPct: 10, PaslagPct: 30, TaMed: true, Notering: "2 brädor/takfall (sadeltak: 4×2=8, pulpet: 2×2=4)" },
  { Kategori: "Tak", Artikel: "Vindskiveplåt", Enhet: "st", MangdPerM2: 1.9, Enhetstid: 0.25, Inkopspris: 85, SpillPct: 5, PaslagPct: 30, TaMed: true, Notering: "Täcker 1.9m/st (sadeltak: 4 takfall, pulpet: 2)" },
  { Kategori: "Tak", Artikel: "Takfotsbräda 22x145", Enhet: "lm", MangdPerM2: 0, Enhetstid: 0.15, Inkopspris: 25, SpillPct: 10, PaslagPct: 30, TaMed: true, Notering: "2 × taklängd" },
  { Kategori: "Tak", Artikel: "Regnvattensystem", Enhet: "lm", MangdPerM2: 0, Enhetstid: 0.2, Inkopspris: 85, SpillPct: 5, PaslagPct: 30, TaMed: true, Notering: "2 × taklängd" },
  { Kategori: "Tak", Artikel: "Nockplåt", Enhet: "lm", MangdPerM2: 0, Enhetstid: 0.25, Inkopspris: 65, SpillPct: 5, PaslagPct: 30, TaMed: true, Notering: "Taklängd" },
  
  { Kategori: "Grund", Artikel: "Plintar", Enhet: "st", MangdPerM2: 0, Enhetstid: 0.15, Inkopspris: 150, SpillPct: 0, PaslagPct: 30, TaMed: true, Notering: "20cm höga, c/c baserat på golvreglar" },
  { Kategori: "Grund", Artikel: "Betongsten 40x40x10", Enhet: "st", MangdPerM2: 0, Enhetstid: 0.1, Inkopspris: 150, SpillPct: 0, PaslagPct: 30, TaMed: true, Notering: "2 st staplade = 20cm höjd" },
];

// Ekonomi data (uppdaterad från nuvarande Excel-fil)
const ekonomiData = [
  { Parameter: "PrisTimmerIn", Värde: 458, Beskrivning: "Inköpspris timmer (kr/m²)" },
  { Parameter: "PrisTimmerUt", Värde: 850, Beskrivning: "Försäljningspris timmer (kr/m²)" },
  { Parameter: "Timkostnad", Värde: 550, Beskrivning: "Timkostnad (kr/h)" },
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
