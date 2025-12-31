import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  ImageRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  BorderStyle,
  PageBreak,
  Footer,
  VerticalAlign,
  convertInchesToTwip,
} from 'docx';
import { saveAs } from 'file-saver';
import type { MaterialRow, BuildingInputs, CalculatedValues } from '../types';

interface OffertData {
  projektNamn: string;
  kundNamn: string;
  kundAdress: string;
  kundPostort: string;
  materials: MaterialRow[];
  inputs: BuildingInputs;
  calculated: CalculatedValues;
  totalPris: number;
  totalMoms: number;
}

// Hämta material grupperade efter kategori
function getMaterialsByCategory(materials: MaterialRow[]): Record<string, MaterialRow[]> {
  const groups: Record<string, MaterialRow[]> = {};
  materials
    .filter(m => m.taMed && m.mangd > 0)
    .forEach(m => {
      if (!groups[m.kategori]) groups[m.kategori] = [];
      groups[m.kategori].push(m);
    });
  return groups;
}

// Skapa beskrivning för en kategori baserat på valda material
function getCategoryDescription(kategori: string, materials: MaterialRow[], inputs: BuildingInputs, calculated: CalculatedValues): string {
  const artiklar = materials.map(m => m.artikel).join(', ');
  
  switch (kategori) {
    case 'Grund':
      if (inputs.grundTyp === 'plintar') {
        return `Plintar som grund, totalt ${calculated.antalGrundElement} st.`;
      } else if (inputs.grundTyp === 'betongsten') {
        return `Marksten 400x400x100 i 2-lager, totalt ${calculated.antalGrundElement} st.`;
      }
      return 'Ingen grund ingår.';
    
    case 'Golv':
      return `Isolerat regelgolv. ${artiklar}.`;
    
    case 'Stomme':
      const timmerTjocklek = Math.round(inputs.timmerThickness * 1000);
      return `Knutat ${timmerTjocklek}mm planktimmer i furu. ${artiklar}.`;
    
    case 'Tak':
      return `${artiklar}.`;
    
    case 'Vägg':
      return artiklar || '-';
    
    default:
      return artiklar || '-';
  }
}

// Ladda logotyp
async function loadLogo(): Promise<ArrayBuffer | null> {
  try {
    const response = await fetch('/logo.png');
    if (!response.ok) return null;
    return await response.arrayBuffer();
  } catch {
    return null;
  }
}

// Skapa osynliga tabellkanter
const noBorders = {
  top: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
  bottom: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
  left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
  right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
};

// Konstanter för styling (matchar PDF)
const FONT = 'Helvetica';  // Samma som PDF
const PRIMARY_COLOR = '428B8B';  // RGB(66, 139, 139)
const GRAY_COLOR = '666666';
const LIGHT_GRAY = 'CCCCCC';

export async function exportToDocx(data: OffertData): Promise<void> {
  const { projektNamn, kundNamn, kundAdress, kundPostort, materials, inputs, calculated, totalPris, totalMoms } = data;
  
  const today = new Date();
  const dateStr = today.toLocaleDateString('sv-SE');
  
  const groupedMaterials = getMaterialsByCategory(materials);
  
  // Ladda logotyp
  const logoData = await loadLogo();
  
  // Bygg dokumentinnehåll
  const children: (Paragraph | Table)[] = [];
  
  // === HEADER: Logo till vänster, OFFERT + info till höger (som PDF) ===
  const headerTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: noBorders,
    rows: [
      new TableRow({
        children: [
          // Vänster cell: Logo (samma storlek som PDF: 40x20 skalat)
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            borders: noBorders,
            children: logoData ? [
              new Paragraph({
                children: [
                  new ImageRun({
                    data: logoData,
                    transformation: { width: 120, height: 60 },  // PDF: 40x20, skalat 3x
                    type: 'png',
                  }),
                ],
              }),
            ] : [new Paragraph({ children: [] })],
            verticalAlign: VerticalAlign.TOP,
          }),
          // Höger cell: OFFERT, Projekt, Datum
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            borders: noBorders,
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: 'OFFERT',
                    bold: true,
                    size: 44,  // 22pt i PDF
                    font: FONT,
                  }),
                ],
                alignment: AlignmentType.RIGHT,
              }),
              new Paragraph({
                children: [
                  new TextRun({ text: 'Projekt: ', size: 22, color: GRAY_COLOR, font: FONT }),
                  new TextRun({ text: projektNamn || '[Projektnamn]', bold: true, size: 28, font: FONT }),
                ],
                alignment: AlignmentType.RIGHT,
                spacing: { before: 100 },
              }),
              new Paragraph({
                children: [
                  new TextRun({ text: `Datum: ${dateStr}`, size: 20, color: GRAY_COLOR, font: FONT }),
                ],
                alignment: AlignmentType.RIGHT,
                spacing: { before: 50 },
              }),
            ],
            verticalAlign: VerticalAlign.TOP,
          }),
        ],
      }),
    ],
  });
  
  children.push(headerTable);
  
  // Linje under header (som PDF)
  children.push(
    new Paragraph({
      children: [],
      border: {
        bottom: { style: BorderStyle.SINGLE, size: 8, color: LIGHT_GRAY },
      },
      spacing: { before: 200, after: 300 },
    })
  );
  
  // === KUNDINFO ===
  children.push(
    new Paragraph({
      children: [
        new TextRun({ text: kundNamn || '[Kundens namn]', size: 24, font: FONT }),
      ],
      spacing: { before: 100 },
    }),
    new Paragraph({
      children: [
        new TextRun({ text: kundAdress || '[Adress]', size: 24, font: FONT }),
      ],
    }),
    new Paragraph({
      children: [
        new TextRun({ text: kundPostort || '[Postnummer Ort]', size: 24, font: FONT }),
      ],
      spacing: { after: 300 },
    })
  );
  
  // === INTRO ===
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: 'Vi tackar för er förfrågan och erbjuder följande:',
          size: 24,
          font: FONT,
        }),
      ],
      spacing: { before: 100, after: 200 },
    })
  );
  
  // === PRODUKTBESKRIVNING (teal bakgrund som PDF) ===
  const lengthMm = Math.round(inputs.length * 1000);  // Millimeter
  const widthMm = Math.round(inputs.width * 1000);    // Millimeter
  const timmerMm = Math.round(inputs.timmerThickness * 1000);
  const takTyp = inputs.roofType === 'sadeltak' ? 'sadeltak' : 'pulpettak';
  
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: `1 st. Attefallshus ${lengthMm}x${widthMm}mm i ${timmerMm}mm planktimmer`,
          bold: true,
          size: 28,  // Större text
          font: FONT,
          color: 'FFFFFF',
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { before: 150, after: 0 },
      shading: { fill: PRIMARY_COLOR },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `med ${takTyp}, fullt färdigställt.`,
          bold: true,
          size: 28,  // Större text
          font: FONT,
          color: 'FFFFFF',
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 150 },
      shading: { fill: PRIMARY_COLOR },
    })
  );
  
  // Mellanrum
  children.push(new Paragraph({ children: [], spacing: { after: 200 } }));
  
  // === KATEGORIER (med tabell för perfekt justering) ===
  const categoryOrder = ['Grund', 'Golv', 'Stomme', 'Tak', 'Invändigt'];
  const categoryLabels: Record<string, string> = {
    'Grund': 'GRUND:',
    'Golv': 'GOLV:',
    'Stomme': 'VÄGG:',
    'Tak': 'YTTERTAK:',
    'Invändigt': 'INNERTAK:',
  };
  
  // Hjälpfunktion för att skapa en kategori-rad med tabell
  const createCategoryRow = (label: string, description: string): Table => {
    return new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: noBorders,
      rows: [
        new TableRow({
          children: [
            // Label-kolumn (fast bredd)
            new TableCell({
              width: { size: 1800, type: WidthType.DXA },  // ~1.25 inch
              borders: noBorders,
              children: [
                new Paragraph({
                  children: [
                    new TextRun({ text: label, bold: true, size: 24, font: FONT }),
                  ],
                }),
              ],
              verticalAlign: VerticalAlign.TOP,
            }),
            // Beskrivning-kolumn (resten av bredden)
            new TableCell({
              borders: noBorders,
              children: [
                new Paragraph({
                  children: [
                    new TextRun({ text: description, size: 24, font: FONT }),
                  ],
                }),
              ],
              verticalAlign: VerticalAlign.TOP,
            }),
          ],
        }),
      ],
    });
  };
  
  for (const kategori of categoryOrder) {
    const mats = groupedMaterials[kategori];
    const label = categoryLabels[kategori] || `${kategori.toUpperCase()}:`;
    
    if (mats && mats.length > 0) {
      const description = getCategoryDescription(kategori, mats, inputs, calculated);
      children.push(createCategoryRow(label, description));
      children.push(new Paragraph({ children: [], spacing: { after: 100 } }));
    } else if (kategori === 'Grund' && inputs.grundTyp === 'ingen') {
      children.push(createCategoryRow(label, 'Ingen grund ingår i denna offert.'));
      children.push(new Paragraph({ children: [], spacing: { after: 100 } }));
    } else if (kategori === 'Invändigt') {
      children.push(createCategoryRow('INNERTAK:', '-'));
      children.push(new Paragraph({ children: [], spacing: { after: 100 } }));
    }
  }
  
  // Extra kategorier
  children.push(createCategoryRow('FÖNSTER:', '-'));
  children.push(new Paragraph({ children: [], spacing: { after: 100 } }));
  
  children.push(createCategoryRow('YTTERDÖRR:', '-'));
  children.push(new Paragraph({ children: [], spacing: { after: 100 } }));
  
  children.push(createCategoryRow('LISTVERK:', 'Golv, taklist samt fönster/dörrfoder levereras och monteras obehandlat.'));
  children.push(new Paragraph({ children: [], spacing: { after: 200 } }));
  
  // === SIDBRYTNING ===
  children.push(
    new Paragraph({
      children: [new PageBreak()],
    })
  );
  
  // === SIDA 2: RESERVATIONER ===
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: 'RESERVATIONER: i offerten ingår inte:',
          bold: true,
          size: 24,
          font: FONT,
        }),
      ],
      spacing: { before: 200, after: 150 },
    })
  );
  
  const reservationer = [
    'Byggström för arbetets utförande tillhandahålls av byggherren.',
    'Myndighetskostnader och eventuella besiktningskostnader.',
    'Farbar väg för kranbil fram till byggplats förutsätts.',
    'Tillgång till rum för matplats tillhandahålls av byggherren.',
    'Utsättning på tomt utförs och ansvaras av byggherre.',
    'Byggplats förutsätts vara fri från träd och större vegetation.',
    'Inga markarbeten ingår i denna offert.',
    'Lås och trycken till dörrar införskaffas o betalas av byggherren.',
  ];
  
  for (const res of reservationer) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({ text: '\t' + res, size: 22, font: FONT }),
        ],
        spacing: { after: 40 },
      })
    );
  }
  
  // === BETALNINGSPLAN ===
  children.push(
    new Paragraph({
      children: [
        new TextRun({ text: 'BETALNINGSPLAN:', bold: true, size: 24, font: FONT }),
      ],
      spacing: { before: 300, after: 100 },
    }),
    new Paragraph({
      children: [new TextRun({ text: '\t25% av totalsumman innan tillverkning startas.', size: 22, font: FONT })],
    }),
    new Paragraph({
      children: [new TextRun({ text: '\t25% innan leverans.', size: 22, font: FONT })],
    }),
    new Paragraph({
      children: [new TextRun({ text: '\t40% vid färdigställt attefallshus.', size: 22, font: FONT })],
    }),
    new Paragraph({
      children: [new TextRun({ text: '\t10% efter godkännande av beställare (30 dagar).', size: 22, font: FONT })],
      spacing: { after: 200 },
    })
  );
  
  // === RITNINGSDATUM ===
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: `Offerten baserad på ritning daterad ${dateStr}`,
          size: 22,
          italics: true,
          font: FONT,
        }),
      ],
      spacing: { before: 150, after: 300 },
    })
  );
  
  // === PRIS (som PDF - teal box) ===
  const totalInklMoms = totalPris + totalMoms;
  const formattedPrice = Math.round(totalInklMoms).toLocaleString('sv-SE');
  
  // Pris-tabell för bättre kontroll
  const prisTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: noBorders,
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 60, type: WidthType.PERCENTAGE },
            borders: noBorders,
            children: [new Paragraph({ children: [] })],
          }),
          new TableCell({
            width: { size: 40, type: WidthType.PERCENTAGE },
            borders: noBorders,
            shading: { fill: PRIMARY_COLOR },
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: 'TOTALT INKL. MOMS', bold: true, size: 22, font: FONT, color: 'FFFFFF' }),
                ],
                alignment: AlignmentType.CENTER,
                spacing: { before: 100 },
              }),
              new Paragraph({
                children: [
                  new TextRun({ text: `${formattedPrice} kr`, bold: true, size: 32, font: FONT, color: 'FFFFFF' }),
                ],
                alignment: AlignmentType.CENTER,
                spacing: { after: 100 },
              }),
            ],
          }),
        ],
      }),
    ],
  });
  
  children.push(prisTable);
  
  // === TILLÄGGSINFO ===
  const timkostnadInklMoms = inputs.timkostnad * (1 + inputs.momsPct / 100);
  
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: `Tillkommande arbeten debiteras med ${timkostnadInklMoms.toFixed(0)} kr på löpande räkning.`,
          size: 22,
          font: FONT,
        }),
      ],
      spacing: { before: 300 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: 'Material utöver denna offert debiteras med ett påslag på 14%, efter våra rabatter.',
          size: 22,
          font: FONT,
        }),
      ],
      spacing: { after: 150 },
    })
  );
  
  // === GILTIGHET OCH INFO ===
  children.push(
    new Paragraph({
      children: [new TextRun({ text: 'Offerten giltig i 30 dagar.', size: 22, font: FONT })],
      spacing: { before: 150 },
    }),
    new Paragraph({
      children: [new TextRun({ text: 'Byggstart: omgående.', size: 22, font: FONT })],
    }),
    new Paragraph({
      children: [new TextRun({ text: 'Frakt ingår i offerten.', size: 22, font: FONT })],
      spacing: { after: 150 },
    })
  );
  
  // === AVSÄNDARE ===
  children.push(
    new Paragraph({
      children: [new TextRun({ text: 'Mvh Roger Wagenius', size: 22, font: FONT })],
      spacing: { before: 150, after: 300 },
    })
  );
  
  // === GODKÄNNANDE ===
  children.push(
    new Paragraph({
      children: [
        new TextRun({ text: 'Godkännande:', bold: true, size: 26, font: FONT }),
      ],
      spacing: { before: 200, after: 80 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: 'Genom underskrift nedan godkänner beställaren denna offert och dess villkor.',
          size: 22,
          font: FONT,
        }),
      ],
      spacing: { after: 200 },
    }),
    new Paragraph({
      children: [new TextRun({ text: 'Ort och datum: _________________________', size: 22, font: FONT })],
      spacing: { before: 150, after: 150 },
    }),
    new Paragraph({
      children: [new TextRun({ text: 'Beställarens namnförtydligande: _________________________', size: 22, font: FONT })],
      spacing: { after: 150 },
    }),
    new Paragraph({
      children: [new TextRun({ text: 'Beställarens underskrift: _________________________', size: 22, font: FONT })],
      spacing: { after: 150 },
    })
  );
  
  // === SKAPA DOKUMENT ===
  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: convertInchesToTwip(0.5),
              right: convertInchesToTwip(0.5),
              bottom: convertInchesToTwip(0.75),
              left: convertInchesToTwip(0.5),
            },
          },
        },
        footers: {
          default: new Footer({
            children: [
              // Linje ovanför sidfoten
              new Paragraph({
                children: [],
                border: {
                  top: { style: BorderStyle.SINGLE, size: 8, color: LIGHT_GRAY },
                },
                spacing: { after: 150 },
              }),
              // Footer som 3-kolumns tabell
              new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                borders: noBorders,
                rows: [
                  new TableRow({
                    children: [
                      // Vänster kolumn
                      new TableCell({
                        width: { size: 33, type: WidthType.PERCENTAGE },
                        borders: noBorders,
                        children: [
                          new Paragraph({
                            children: [new TextRun({ text: 'Byggit i Ljusnedal Ab', size: 18, color: GRAY_COLOR, font: FONT })],
                          }),
                          new Paragraph({
                            children: [new TextRun({ text: 'Herrgårdsvägen 9', size: 18, color: GRAY_COLOR, font: FONT })],
                          }),
                          new Paragraph({
                            children: [new TextRun({ text: '846 96 Ljusnedal', size: 18, color: GRAY_COLOR, font: FONT })],
                          }),
                        ],
                      }),
                      // Mitten kolumn
                      new TableCell({
                        width: { size: 34, type: WidthType.PERCENTAGE },
                        borders: noBorders,
                        children: [
                          new Paragraph({
                            children: [new TextRun({ text: 'Tel 070-3071454', size: 18, color: GRAY_COLOR, font: FONT })],
                            alignment: AlignmentType.CENTER,
                          }),
                          new Paragraph({
                            children: [new TextRun({ text: 'mail:info@bruksstugan.se', size: 18, color: GRAY_COLOR, font: FONT })],
                            alignment: AlignmentType.CENTER,
                          }),
                        ],
                      }),
                      // Höger kolumn
                      new TableCell({
                        width: { size: 33, type: WidthType.PERCENTAGE },
                        borders: noBorders,
                        children: [
                          new Paragraph({
                            children: [new TextRun({ text: 'innehar F-skatt', size: 18, color: GRAY_COLOR, font: FONT })],
                            alignment: AlignmentType.RIGHT,
                          }),
                        ],
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),
        },
        children: children,
      },
    ],
  });
  
  // Spara dokumentet
  const blob = await Packer.toBlob(doc);
  const filename = `Offert_${projektNamn.replace(/\s+/g, '_') || 'Projekt'}_${dateStr}.docx`;
  saveAs(blob, filename);
}
