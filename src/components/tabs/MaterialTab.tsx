import React, { useMemo } from 'react';
import type { MaterialRow } from '../../types';
import { formatNumber, formatCurrency } from '../../utils/calculations';

interface Props {
  materials: MaterialRow[];
  setMaterials: React.Dispatch<React.SetStateAction<MaterialRow[]>>;
}

export function MaterialTab({ materials, setMaterials }: Props) {
  const updateMaterial = (id: string, field: keyof MaterialRow, value: number | boolean) => {
    setMaterials(prev => prev.map(row => 
      row.id === id ? { ...row, [field]: value } : row
    ));
  };

  const totals = useMemo(() => {
    const selected = materials.filter(m => m.taMed);
    const inkopTotal = selected.reduce((sum, m) => sum + m.mangd * m.inkopspris, 0);
    const forsaljningTotal = selected.reduce((sum, m) => sum + m.mangd * m.forsaljningspris, 0);
    const totalTid = selected.reduce((sum, m) => sum + m.mangd * m.enhetstid, 0);
    return { inkopTotal, forsaljningTotal, totalTid };
  }, [materials]);

  // Group by category
  const grouped = useMemo(() => {
    const groups: Record<string, MaterialRow[]> = {};
    const order = ['Stomme', 'Golv', 'Tak', 'Vägg', 'Grund'];
    
    materials.forEach(m => {
      if (!groups[m.kategori]) groups[m.kategori] = [];
      groups[m.kategori].push(m);
    });
    
    const sorted: [string, MaterialRow[]][] = [];
    order.forEach(cat => {
      if (groups[cat]) sorted.push([cat, groups[cat]]);
    });
    Object.keys(groups).forEach(cat => {
      if (!order.includes(cat)) sorted.push([cat, groups[cat]]);
    });
    
    return sorted;
  }, [materials]);

  const categoryIcons: Record<string, string> = {
    'Stomme': '🪵',
    'Golv': '⬛',
    'Tak': '🏠',
    'Vägg': '🧱',
    'Grund': '🪨',
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
        <p className="text-slate-600 text-sm">
          Mängder beräknas automatiskt från byggmått. Priser och enhetstider laddas från Excel-filen.
          Du kan justera <strong className="text-slate-800">Mängd</strong>, <strong className="text-slate-800">Priser</strong> och 
          <strong className="text-slate-800"> Enhetstid</strong> manuellt.
        </p>
      </div>

      {/* Material table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left p-3 font-medium text-slate-600 w-12">✓</th>
                <th className="text-left p-3 font-medium text-slate-600">Artikel</th>
                <th className="text-left p-3 font-medium text-slate-600 w-16">Enhet</th>
                <th className="text-right p-3 font-medium text-slate-600 w-24">Mängd</th>
                <th className="text-right p-3 font-medium text-slate-600 w-24">Inköp/e</th>
                <th className="text-right p-3 font-medium text-slate-600 w-24">Förs/e</th>
                <th className="text-right p-3 font-medium text-slate-600 w-20">h/e</th>
                <th className="text-right p-3 font-medium text-slate-600 w-24">Inköp tot</th>
                <th className="text-right p-3 font-medium text-slate-600 w-24">Förs tot</th>
                <th className="text-right p-3 font-medium text-slate-600 w-20">Tid (h)</th>
              </tr>
            </thead>
            <tbody>
              {grouped.map(([kategori, rows]) => (
                <React.Fragment key={kategori}>
                  <tr className="bg-slate-100">
                    <td colSpan={10} className="p-2 font-semibold text-slate-700">
                      {categoryIcons[kategori] || '📦'} {kategori}
                    </td>
                  </tr>
                  {rows.map(row => (
                    <MaterialRowComponent 
                      key={row.id} 
                      row={row} 
                      onUpdate={updateMaterial}
                    />
                  ))}
                </React.Fragment>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-slate-50 border-t border-slate-300">
                <td colSpan={7} className="p-3 text-right font-semibold text-slate-700">
                  Summa (valda):
                </td>
                <td className="p-3 text-right font-bold text-slate-600">
                  {formatCurrency(totals.inkopTotal)}
                </td>
                <td className="p-3 text-right font-bold text-slate-800">
                  {formatCurrency(totals.forsaljningTotal)}
                </td>
                <td className="p-3 text-right font-bold text-slate-700">
                  {formatNumber(totals.totalTid, 1)} h
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        <SummaryCard 
          label="Materialkostnad inköp" 
          value={formatCurrency(totals.inkopTotal)}
          variant="secondary"
        />
        <SummaryCard 
          label="Material försäljning" 
          value={formatCurrency(totals.forsaljningTotal)}
          variant="primary"
        />
        <SummaryCard 
          label="Total arbetstid material" 
          value={`${formatNumber(totals.totalTid, 1)} h`}
          variant="secondary"
        />
      </div>
    </div>
  );
}

function MaterialRowComponent({ 
  row, 
  onUpdate 
}: { 
  row: MaterialRow; 
  onUpdate: (id: string, field: keyof MaterialRow, value: number | boolean) => void;
}) {
  const inkopTot = row.mangd * row.inkopspris;
  const forsaljTot = row.mangd * row.forsaljningspris;
  const tidTot = row.mangd * row.enhetstid;

  return (
    <tr className={`border-b border-slate-100 hover:bg-slate-50 transition-colors ${
      !row.taMed ? 'opacity-40' : ''
    }`}>
      <td className="p-2">
        <label className="cursor-pointer">
          <input
            type="checkbox"
            checked={row.taMed}
            onChange={e => onUpdate(row.id, 'taMed', e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-5 h-5 rounded border-2 border-slate-300 bg-white peer-checked:bg-primary-500 peer-checked:border-primary-500 transition-all duration-200 flex items-center justify-center">
            {row.taMed && (
              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            )}
          </div>
        </label>
      </td>
      <td className="p-2 text-slate-700" title={row.notering || undefined}>
        {row.artikel}
        {row.notering && <span className="text-slate-400 text-xs ml-1">ⓘ</span>}
      </td>
      <td className="p-2 text-slate-500">{row.enhet}</td>
      <td className="p-2">
        <input
          type="number"
          value={row.mangd.toFixed(2)}
          onChange={e => onUpdate(row.id, 'mangd', parseFloat(e.target.value) || 0)}
          step="0.1"
          min="0"
          className="w-20 px-2 py-1 text-right bg-slate-50 border border-slate-200 rounded text-slate-800 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
        />
      </td>
      <td className="p-2">
        <input
          type="number"
          value={row.inkopspris}
          onChange={e => onUpdate(row.id, 'inkopspris', parseFloat(e.target.value) || 0)}
          step="1"
          min="0"
          className="w-20 px-2 py-1 text-right bg-slate-50 border border-slate-200 rounded text-slate-800 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
        />
      </td>
      <td className="p-2">
        <input
          type="number"
          value={row.forsaljningspris}
          onChange={e => onUpdate(row.id, 'forsaljningspris', parseFloat(e.target.value) || 0)}
          step="1"
          min="0"
          className="w-20 px-2 py-1 text-right bg-slate-50 border border-slate-200 rounded text-slate-800 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
        />
      </td>
      <td className="p-2">
        <input
          type="number"
          value={row.enhetstid}
          onChange={e => onUpdate(row.id, 'enhetstid', parseFloat(e.target.value) || 0)}
          step="0.01"
          min="0"
          className="w-16 px-2 py-1 text-right bg-slate-50 border border-slate-200 rounded text-slate-800 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
        />
      </td>
      <td className="p-2 text-right text-slate-500">
        {formatNumber(inkopTot, 0)}
      </td>
      <td className="p-2 text-right text-slate-700 font-medium">
        {formatNumber(forsaljTot, 0)}
      </td>
      <td className="p-2 text-right text-slate-600">
        {formatNumber(tidTot, 2)}
      </td>
    </tr>
  );
}

function SummaryCard({ 
  label, 
  value, 
  variant 
}: { 
  label: string; 
  value: string;
  variant: 'primary' | 'secondary';
}) {
  return (
    <div className={`rounded-xl p-5 border shadow-sm ${
      variant === 'primary' 
        ? 'bg-primary-50 border-primary-200' 
        : 'bg-white border-slate-200'
    }`}>
      <p className="text-sm text-slate-500 mb-1">{label}</p>
      <p className={`text-2xl font-bold ${variant === 'primary' ? 'text-primary-700' : 'text-slate-700'}`}>
        {value}
      </p>
    </div>
  );
}
