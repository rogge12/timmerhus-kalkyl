import React, { useState } from 'react';
import type { BuildingInputs } from '../types';

interface SidebarProps {
  inputs: BuildingInputs;
  setInputs: React.Dispatch<React.SetStateAction<BuildingInputs>>;
}

export function Sidebar({ inputs, setInputs }: SidebarProps) {
  const updateInput = <K extends keyof BuildingInputs>(
    key: K, 
    value: BuildingInputs[K]
  ) => {
    setInputs(prev => ({ ...prev, [key]: value }));
  };

  return (
    <aside className="fixed left-0 top-0 h-screen w-80 bg-white border-r border-slate-200 overflow-y-auto shadow-sm">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="pb-4 border-b border-slate-200">
          <h2 className="font-display text-xl font-semibold text-slate-800">
            🪵 Inställningar
          </h2>
        </div>

        {/* Roof Type */}
        <Section title="Mått & tak">
          <div className="space-y-3">
            <label className="text-sm text-slate-500">Typ av stomme</label>
            <div className="flex gap-2">
              {(['sadeltak', 'pulpettak'] as const).map(type => (
                <button
                  key={type}
                  onClick={() => updateInput('roofType', type)}
                  className={`flex-1 py-2.5 px-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                    inputs.roofType === type
                      ? 'bg-primary-500 text-white shadow-md'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {type === 'sadeltak' ? 'Sadeltak' : 'Pulpettak'}
                </button>
              ))}
            </div>
          </div>

          <label className="flex items-center gap-3 mt-4 cursor-pointer group">
            <div className="relative">
              <input
                type="checkbox"
                checked={inputs.includeMellanvagg}
                onChange={e => updateInput('includeMellanvagg', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-5 h-5 rounded border-2 border-slate-300 bg-white peer-checked:bg-primary-500 peer-checked:border-primary-500 transition-all duration-200 flex items-center justify-center">
                {inputs.includeMellanvagg && (
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
            </div>
            <span className="text-sm text-slate-600 group-hover:text-slate-800 transition-colors">
              Inkludera mellanvägg
            </span>
          </label>

          <div className="grid grid-cols-2 gap-3 mt-4">
            <NumberField 
              label="Längd (m)" 
              value={inputs.length} 
              onChange={v => updateInput('length', v)} 
              min={1} max={50} step={0.1}
            />
            <NumberField 
              label="Bredd (m)" 
              value={inputs.width} 
              onChange={v => updateInput('width', v)} 
              min={1} max={50} step={0.1}
            />
            <NumberField 
              label="Väggliv (m)" 
              value={inputs.wallHeight} 
              onChange={v => updateInput('wallHeight', v)} 
              min={0.1} max={10} step={0.01}
            />
            <NumberField 
              label="Taklut (°)" 
              value={inputs.roofAngle} 
              onChange={v => updateInput('roofAngle', v)} 
              min={5} max={60} step={1}
            />
            <NumberField 
              label="Utsprång (m)" 
              value={inputs.overhang} 
              onChange={v => updateInput('overhang', v)} 
              min={0} max={2} step={0.05}
            />
            <NumberField 
              label="Takåsar (st)" 
              value={inputs.antalTakasar} 
              onChange={v => updateInput('antalTakasar', v)} 
              min={1} max={50} step={1}
            />
            <NumberField 
              label="Knututstick (m)" 
              value={inputs.knut} 
              onChange={v => updateInput('knut', v)} 
              min={0} max={1} step={0.01}
            />
            <NumberField 
              label="Avdrag vägg (m²)" 
              value={inputs.avdragVaggarea} 
              onChange={v => updateInput('avdragVaggarea', v)} 
              min={0} max={100} step={0.5}
            />
          </div>

          {/* Innertak typ */}
          <div className="mt-4 space-y-2">
            <label className="text-sm text-slate-500">Typ av innertak</label>
            <div className="flex gap-2">
              {(['sned', 'platt'] as const).map(typ => (
                <button
                  key={typ}
                  onClick={() => updateInput('innertakTyp', typ)}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                    inputs.innertakTyp === typ
                      ? 'bg-primary-500 text-white shadow-md'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {typ === 'sned' ? 'Snedtak' : 'Platt tak'}
                </button>
              ))}
            </div>
            <p className="text-xs text-slate-400">
              {inputs.innertakTyp === 'sned' ? 'Följer taklutningen' : 'Horisontellt tak (som golv)'}
            </p>
          </div>
        </Section>

        {/* Timber */}
        <Section title="Timmer">
          <div className="grid grid-cols-2 gap-3">
            <NumberField 
              label="Tjocklek (m)" 
              value={inputs.timmerThickness} 
              onChange={v => updateInput('timmerThickness', v)} 
              min={0.04} max={0.3} step={0.001}
            />
            <NumberField 
              label="Stockhöjd (m)" 
              value={inputs.stockHeight} 
              onChange={v => updateInput('stockHeight', v)} 
              min={0.08} max={0.3} step={0.001}
            />
          </div>
        </Section>

        {/* C/C Distances */}
        <Section title="c/c-avstånd" collapsible>
          <div className="grid grid-cols-2 gap-3">
            <NumberField 
              label="Golvåsar (m)" 
              value={inputs.ccGolv} 
              onChange={v => updateInput('ccGolv', v)} 
              min={0.1} max={1} step={0.05}
            />
            <NumberField 
              label="Ströläkt (m)" 
              value={inputs.ccStro} 
              onChange={v => updateInput('ccStro', v)} 
              min={0.1} max={1} step={0.05}
            />
            <NumberField 
              label="Bärläkt (m)" 
              value={inputs.ccBar} 
              onChange={v => updateInput('ccBar', v)} 
              min={0.1} max={1} step={0.05}
            />
          </div>
        </Section>

        {/* Economics */}
        <Section title="Ekonomi">
          <div className="grid grid-cols-2 gap-3">
            <NumberField 
              label="Timmer inköp (kr/m)" 
              value={inputs.prisTimmerIn} 
              onChange={v => updateInput('prisTimmerIn', v)} 
              min={0} max={5000} step={5}
            />
            <NumberField 
              label="Timmer utpris (kr/m)" 
              value={inputs.prisTimmerUt} 
              onChange={v => updateInput('prisTimmerUt', v)} 
              min={0} max={5000} step={5}
            />
            <NumberField 
              label="Timkostnad (kr/h)" 
              value={inputs.timkostnad} 
              onChange={v => updateInput('timkostnad', v)} 
              min={0} max={2000} step={25}
            />
            <NumberField 
              label="Moms (%)" 
              value={inputs.momsPct} 
              onChange={v => updateInput('momsPct', v)} 
              min={0} max={50} step={1}
            />
          </div>
        </Section>

        {/* Info */}
        <div className="bg-slate-50 rounded-lg p-3 text-xs text-slate-500 border border-slate-200">
          <p>💡 Enhetstider och priser laddas från Excel-filen. Ändra dem i Material-fliken eller ladda upp en ny fil.</p>
        </div>
      </div>
    </aside>
  );
}

function Section({ 
  title, 
  children, 
  collapsible = false 
}: { 
  title: string; 
  children: React.ReactNode;
  collapsible?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(!collapsible);

  return (
    <section className="space-y-3">
      {collapsible ? (
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between text-left"
        >
          <h3 className="font-display font-semibold text-slate-700">{title}</h3>
          <svg 
            className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      ) : (
        <h3 className="font-display font-semibold text-slate-700">{title}</h3>
      )}
      {isOpen && <div>{children}</div>}
    </section>
  );
}

function NumberField({ 
  label, value, onChange, min, max, step, fullWidth = false 
}: { 
  label: string; 
  value: number; 
  onChange: (v: number) => void;
  min: number;
  max: number;
  step: number;
  fullWidth?: boolean;
}) {
  return (
    <div className={fullWidth ? 'col-span-2' : ''}>
      <label className="block text-xs text-slate-500 mb-1.5">{label}</label>
      <input
        type="number"
        value={value}
        onChange={e => onChange(parseFloat(e.target.value) || 0)}
        min={min}
        max={max}
        step={step}
        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-sm 
                   focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500
                   transition-all duration-200 hover:border-slate-300"
      />
    </div>
  );
}
