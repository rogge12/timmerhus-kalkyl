// Script för att läsa nuvarande Excel-fil och skriva ut innehållet
import * as XLSX from 'xlsx';
import { readFileSync } from 'fs';

const fileBuffer = readFileSync('public/material_prislista.xlsx');
const workbook = XLSX.read(fileBuffer, { type: 'buffer' });

console.log('=== MATERIAL FLIK ===\n');
const materialSheet = workbook.Sheets[workbook.SheetNames[0]];
const materialData = XLSX.utils.sheet_to_json(materialSheet);
console.log(JSON.stringify(materialData, null, 2));

console.log('\n\n=== EKONOMI FLIK ===\n');
const ekonomiSheetName = workbook.SheetNames.find(name => name.toLowerCase() === 'ekonomi');
if (ekonomiSheetName) {
  const ekonomiSheet = workbook.Sheets[ekonomiSheetName];
  const ekonomiData = XLSX.utils.sheet_to_json(ekonomiSheet);
  console.log(JSON.stringify(ekonomiData, null, 2));
} else {
  console.log('Ingen Ekonomi-flik hittades');
}

