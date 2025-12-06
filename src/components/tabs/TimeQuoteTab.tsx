import React, { useMemo } from 'react';
import type { BuildingInputs, CalculatedValues, MaterialRow } from '../../types';
import { formatNumber, formatCurrency } from '../../utils/calculations';

interface Props {
  inputs: BuildingInputs;
  calculated: CalculatedValues;
  materials: MaterialRow[];
}

export function TimeQuoteTab({ inputs, calculated, materials }: Props) {
  const { timkostnad, momsPct } = inputs;

  // Calculate totals from materials
  const { totalTid, totMatInkop, totMatFors, arbetskostnad, offertExMoms, moms, offertInklMoms, avans } = useMemo(() => {
    const activeMaterials = materials.filter(m => m.taMed);
    
    const totalTid = activeMaterials.reduce((sum, m) => sum + m.mangd * m.enhetstid, 0);
    const totMatInkop = activeMaterials.reduce((sum, m) => sum + m.mangd * m.inkopspris, 0);
    const totMatFors = activeMaterials.reduce((sum, m) => sum + m.mangd * m.forsaljningspris, 0);
    
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
    'Stomme': '🪵',
    'Golv': '⬛',
    'Tak': '🏠',
    'Vägg': '🧱',
    'Grund': '🪨',
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Time breakdown by category */}
      <section>
        <h2 className="font-display text-xl font-semibold text-slate-800 mb-4">⏱ Tidskalkyl per kategori</h2>
        
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(timeByCategory).map(([kategori, data]) => (
            <div key={kategori} className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xl">{categoryIcons[kategori] || '📦'}</span>
                <h3 className="font-semibold text-slate-700">{kategori}</h3>
              </div>
              <p className="text-2xl font-bold text-slate-800 mb-2">{formatNumber(data.tid, 1)} h</p>
              <ul className="text-xs text-slate-500 space-y-1">
                {data.items.slice(0, 4).map((item, i) => (
                  <li key={i} className="flex justify-between">
                    <span className="truncate mr-2">{item.artikel}</span>
                    <span className="text-slate-600">{formatNumber(item.tid, 1)}h</span>
                  </li>
                ))}
                {data.items.length > 4 && (
                  <li className="text-slate-400">+{data.items.length - 4} fler...</li>
                )}
              </ul>
            </div>
          ))}
        </div>

        {/* Time summary */}
        <div className="grid grid-cols-2 gap-4 mt-4">
          <MetricCard label="Total arbetstid" value={`${formatNumber(totalTid, 1)} h`} />
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
                <span>Arbetstid ({formatNumber(totalTid, 1)} h × {formatCurrency(timkostnad)}/h)</span>
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
