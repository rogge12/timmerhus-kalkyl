import React, { useMemo, useState } from 'react';
import type { BuildingInputs, CalculatedValues, MaterialRow } from '../../types';
import { formatNumber, formatCurrency, formatTime } from '../../utils/calculations';
import { exportToPDF } from '../../utils/pdfExport';
import { exportToDocx } from '../../utils/docxExport';

interface Props {
  inputs: BuildingInputs;
  calculated: CalculatedValues;
  materials: MaterialRow[];
  projektNamn: string;
}

// Beräkna totalpris för en materialrad: Mängd × (1 + Spill%) × Inköp × (1 + Påslag%)
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

export function TimeQuoteTab({ inputs, calculated, materials, projektNamn }: Props) {
  const { timkostnad, momsPct } = inputs;
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [isExportingDocx, setIsExportingDocx] = useState(false);
  
  // Kundinfo för offert
  const [kundNamn, setKundNamn] = useState('');
  const [kundAdress, setKundAdress] = useState('');
  const [kundPostort, setKundPostort] = useState('');

  const handleExportPDF = async () => {
    setIsExportingPDF(true);
    try {
      await exportToPDF(projektNamn, inputs, calculated, materials);
    } catch (error) {
      console.error('PDF export failed:', error);
      alert('Kunde inte skapa PDF. Försök igen.');
    } finally {
      setIsExportingPDF(false);
    }
  };

  const handleExportDocx = async (totalPris: number, totalMoms: number) => {
    setIsExportingDocx(true);
    try {
      await exportToDocx({
        projektNamn,
        kundNamn,
        kundAdress,
        kundPostort,
        materials,
        inputs,
        calculated,
        totalPris,
        totalMoms,
      });
    } catch (error) {
      console.error('DOCX export failed:', error);
      alert('Kunde inte skapa offert. Försök igen.');
    } finally {
      setIsExportingDocx(false);
    }
  };

  // Calculate totals from materials
  const { totalTid, totMatInkop, totMatFors, arbetskostnad, offertExMoms, moms, offertInklMoms, avans } = useMemo(() => {
    const activeMaterials = materials.filter(m => m.taMed);
    
    const totalTid = activeMaterials.reduce((sum, m) => sum + m.mangd * m.enhetstid, 0);
    const totMatInkop = activeMaterials.reduce((sum, m) => sum + calculateInkopTotal(m), 0);
    const totMatFors = activeMaterials.reduce((sum, m) => sum + calculateTotalPrice(m), 0);
    
    const arbetskostnad = totalTid * timkostnad;
    const offertExMoms = totMatFors + arbetskostnad;
    const moms = offertExMoms * momsPct / 100;
    const offertInklMoms = offertExMoms + moms;
    const avans = totMatFors - totMatInkop;

    return { totalTid, totMatInkop, totMatFors, arbetskostnad, offertExMoms, moms, offertInklMoms, avans };
  }, [materials, timkostnad, momsPct]);

  // Group materials by category for time breakdown
  const timeByCategory = useMemo(() => {
    const categories: Record<string, { tid: number; items: { artikel: string; tid: number }[] }> = {};
    
    materials.filter(m => m.taMed && m.mangd * m.enhetstid > 0).forEach(m => {
      const tid = m.mangd * m.enhetstid;
      if (!categories[m.kategori]) {
        categories[m.kategori] = { tid: 0, items: [] };
      }
      categories[m.kategori].tid += tid;
      categories[m.kategori].items.push({ artikel: m.artikel, tid });
    });
    
    return categories;
  }, [materials]);

  const categoryIcons: Record<string, string> = {
    'Stomme': '🏗️',
    'Golv': '📐',
    'Tak': '🏠',
    'Vägg': '🧱',
    'Grund': '🧱',
    'Invändigt': '🔲',
  };

  // Track which categories are expanded
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  const toggleCategory = (kategori: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(kategori)) {
        newSet.delete(kategori);
      } else {
        newSet.add(kategori);
      }
      return newSet;
    });
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Time breakdown by category */}
      <section>
        <h2 className="font-display text-xl font-semibold text-slate-800 mb-4">⏱ Tidskalkyl per kategori</h2>
        
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(timeByCategory).map(([kategori, data]) => {
            const isExpanded = expandedCategories.has(kategori);
            const hasMore = data.items.length > 4;
            const itemsToShow = isExpanded ? data.items : data.items.slice(0, 4);
            
            return (
              <div 
                key={kategori} 
                className={`bg-white rounded-xl p-4 border border-slate-200 shadow-sm transition-all duration-300 ${
                  isExpanded ? 'row-span-2' : ''
                }`}
              >
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xl">{categoryIcons[kategori] || '📦'}</span>
                  <h3 className="font-semibold text-slate-700">{kategori}</h3>
                </div>
                <p className="text-2xl font-bold text-slate-800 mb-2">{formatTime(data.tid)}</p>
                <ul className="text-xs text-slate-500 space-y-1">
                  {itemsToShow.map((item, i) => (
                    <li key={i} className="flex justify-between">
                      <span className="truncate mr-2">{item.artikel}</span>
                      <span className="text-slate-600 whitespace-nowrap">{formatTime(item.tid)}</span>
                    </li>
                  ))}
                </ul>
                {hasMore && (
                  <button 
                    onClick={() => toggleCategory(kategori)}
                    className="mt-2 text-xs text-primary-500 hover:text-primary-700 font-medium flex items-center gap-1 transition-colors"
                  >
                    {isExpanded ? (
                      <>
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                        Visa färre
                      </>
                    ) : (
                      <>
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                        +{data.items.length - 4} fler...
                      </>
                    )}
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Time summary */}
        <div className="grid grid-cols-2 gap-4 mt-4">
          <MetricCard label="Total arbetstid" value={formatTime(totalTid)} />
          <MetricCard label="Arbetskostnad" value={formatCurrency(arbetskostnad)} highlight />
        </div>
      </section>

      {/* Quote section */}
      <section>
        <div className="border-t border-slate-200 pt-8">
          <h2 className="font-display text-xl font-semibold text-slate-800 mb-6">📋 Offertsammanställning</h2>
          
          {/* Cost breakdown */}
          <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm mb-6">
            <h3 className="font-semibold text-slate-700 mb-4">Kostnadsuppställning</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-slate-600">
                <span>Materialkostnad (inköp)</span>
                <span>{formatCurrency(totMatInkop)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Materialförsäljning</span>
                <span>{formatCurrency(totMatFors)}</span>
              </div>
              <div className="flex justify-between text-slate-700 font-medium border-t border-slate-200 pt-2">
                <span>Materialmarginal</span>
                <span className="text-green-600">{formatCurrency(avans)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Arbetstid ({formatTime(totalTid)} × {formatCurrency(timkostnad)}/h)</span>
                <span>{formatCurrency(arbetskostnad)}</span>
              </div>
            </div>
          </div>

          {/* Quote cards */}
          <div className="grid grid-cols-3 gap-4 mb-4">
            <QuoteCard label="Material, försäljning" value={formatCurrency(totMatFors)} />
            <QuoteCard label="Arbetskostnad" value={formatCurrency(arbetskostnad)} />
            <QuoteCard label="Offert exkl. moms" value={formatCurrency(offertExMoms)} variant="highlight" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <QuoteCard label={`Moms (${formatNumber(momsPct, 0)} %)`} value={formatCurrency(moms)} />
            <QuoteCard label="Offert inkl. moms" value={formatCurrency(offertInklMoms)} variant="primary" large />
          </div>

          {/* Profit summary */}
          <div className="mt-6 bg-green-50 rounded-xl p-4 border border-green-200">
            <div className="flex justify-between items-center">
              <span className="text-green-700">Total marginal (material + arbete)</span>
              <span className="text-2xl font-bold text-green-600">{formatCurrency(avans + arbetskostnad)}</span>
            </div>
          </div>

          {/* Kundinfo för offert */}
          <div className="mt-8 bg-slate-50 rounded-xl p-6 border border-slate-200">
            <h3 className="font-semibold text-slate-700 mb-4">📬 Kunduppgifter för offert</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs text-slate-500 mb-1">Kundens namn</label>
                <input
                  type="text"
                  value={kundNamn}
                  onChange={e => setKundNamn(e.target.value)}
                  placeholder="T.ex. Mats Holmvall"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 text-sm 
                             focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Adress</label>
                <input
                  type="text"
                  value={kundAdress}
                  onChange={e => setKundAdress(e.target.value)}
                  placeholder="T.ex. Strandvägen 128"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 text-sm 
                             focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Postnummer & Ort</label>
                <input
                  type="text"
                  value={kundPostort}
                  onChange={e => setKundPostort(e.target.value)}
                  placeholder="T.ex. 846 96 Ljusnedal"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 text-sm 
                             focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500"
                />
              </div>
            </div>
          </div>

          {/* Export buttons */}
          <div className="mt-6 flex justify-center gap-4">
            {/* Rapport (PDF för eget bruk) */}
            <button
              onClick={handleExportPDF}
              disabled={isExportingPDF}
              className="flex items-center gap-3 px-6 py-3 bg-slate-600 hover:bg-slate-700 disabled:bg-slate-400 
                         text-white font-semibold rounded-xl shadow-md hover:shadow-lg 
                         transition-all duration-300"
            >
              {isExportingPDF ? (
                <>
                  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Skapar PDF...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Exportera rapport (PDF)
                </>
              )}
            </button>

            {/* Offert (Word för kund) */}
            <button
              onClick={() => handleExportDocx(offertExMoms, moms)}
              disabled={isExportingDocx}
              className="flex items-center gap-3 px-6 py-3 bg-primary-500 hover:bg-primary-600 disabled:bg-primary-300 
                         text-white font-semibold rounded-xl shadow-lg hover:shadow-xl 
                         transition-all duration-300 transform hover:scale-105 disabled:scale-100"
            >
              {isExportingDocx ? (
                <>
                  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Skapar offert...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Exportera offert (Word)
                </>
              )}
            </button>
          </div>
          
          <div className="mt-3 text-center text-sm text-slate-400">
            <p>📊 <strong>Rapport</strong> = Detaljerad kalkyl för dig (med mängder & priser)</p>
            <p>📄 <strong>Offert</strong> = Kunddokument enligt din mall (utan detaljpriser)</p>
          </div>
          
          {!projektNamn && (
            <p className="text-center text-sm text-amber-500 mt-2">
              💡 Tips: Ange ett projektnamn i sidopanelen för att få med det i dokumenten
            </p>
          )}
        </div>
      </section>
    </div>
  );
}

function MetricCard({ 
  label, value, highlight = false 
}: { 
  label: string; 
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className={`rounded-xl p-5 border shadow-sm ${
      highlight 
        ? 'bg-primary-50 border-primary-200' 
        : 'bg-white border-slate-200'
    }`}>
      <p className="text-sm text-slate-500 mb-1">{label}</p>
      <p className={`text-2xl font-bold ${highlight ? 'text-primary-700' : 'text-slate-700'}`}>
        {value}
      </p>
    </div>
  );
}

function QuoteCard({ 
  label, 
  value, 
  variant = 'default',
  large = false
}: { 
  label: string; 
  value: string;
  variant?: 'default' | 'highlight' | 'primary';
  large?: boolean;
}) {
  const baseClasses = 'rounded-xl p-5 border shadow-sm transition-all duration-300';
  const variantClasses = {
    default: 'bg-white border-slate-200',
    highlight: 'bg-slate-50 border-slate-300',
    primary: 'bg-primary-500 border-primary-600'
  };

  return (
    <div className={`${baseClasses} ${variantClasses[variant]}`}>
      <p className={`text-sm mb-1 ${variant === 'primary' ? 'text-primary-100' : 'text-slate-500'}`}>{label}</p>
      <p className={`font-bold ${
        large ? 'text-3xl' : 'text-xl'
      } ${
        variant === 'primary' ? 'text-white' : 'text-slate-800'
      }`}>
        {value}
      </p>
    </div>
  );
}
