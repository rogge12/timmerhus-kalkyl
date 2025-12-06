import { useState, useMemo, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { TabNavigation } from './components/TabNavigation';
import { StructureTab } from './components/tabs/StructureTab';
import { MaterialTab } from './components/tabs/MaterialTab';
import { TimeQuoteTab } from './components/tabs/TimeQuoteTab';
import { calculateBuilding, calculateMaterialQuantities } from './utils/calculations';
import { loadDefaultPrislista, loadPrislistaFromFile } from './utils/excelLoader';
import type { BuildingInputs, MaterialRow, PrislistaMaterial } from './types';
import { defaultInputs } from './types';

const tabs = [
  { label: '🏠 Stomme & bygghöjd', icon: '🏠' },
  { label: '📦 Material', icon: '📦' },
  { label: '⏱ Tid & offert', icon: '⏱' },
];

export default function App() {
  const [inputs, setInputs] = useState<BuildingInputs>(defaultInputs);
  const [activeTab, setActiveTab] = useState(0);
  const [prislista, setPrislista] = useState<PrislistaMaterial[]>([]);
  const [materials, setMaterials] = useState<MaterialRow[]>([]);
  const [prislistaSource, setPrislistaSource] = useState<string>('Laddar...');

  // Load default prislista on mount
  useEffect(() => {
    loadDefaultPrislista().then(data => {
      setPrislista(data);
      setPrislistaSource('material_prislista.xlsx');
    });
  }, []);

  // Calculate building values
  const calculated = useMemo(() => calculateBuilding(inputs), [inputs]);

  // Calculate material quantities when prislista or building changes
  useEffect(() => {
    if (prislista.length > 0) {
      const newMaterials = calculateMaterialQuantities(prislista, inputs, calculated);
      setMaterials(prev => {
        return newMaterials.map(newMat => {
          const existing = prev.find(p => p.artikel === newMat.artikel);
          if (existing) {
            return {
              ...newMat,
              inkopspris: existing.inkopspris,
              forsaljningspris: existing.forsaljningspris,
              enhetstid: existing.enhetstid,
              taMed: existing.taMed,
              mangd: newMat.mangd,
            };
          }
          return newMat;
        });
      });
    }
  }, [prislista, inputs, calculated]);

  // Handle file upload
  const handleFileUpload = async (file: File) => {
    try {
      const data = await loadPrislistaFromFile(file);
      setPrislista(data);
      setPrislistaSource(file.name);
    } catch (error) {
      console.error('Error loading file:', error);
      alert('Kunde inte läsa filen. Kontrollera att det är en giltig Excel-fil.');
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Sidebar */}
      <Sidebar inputs={inputs} setInputs={setInputs} />

      {/* Main content */}
      <main className="flex-1 ml-80 p-8 relative">
        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-4xl">🪵</span>
            <h1 className="font-display text-4xl font-bold text-slate-800">
              Timmerhus-kalkyl
            </h1>
          </div>
          <p className="text-slate-500 ml-14">
            Beräkna material, tid och offert för ditt timmerhusprojekt
          </p>
        </header>

        {/* Prislista info & upload */}
        <div className="mb-6 flex items-center gap-4">
          <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg border border-slate-200 shadow-sm">
            <span className="text-slate-500 text-sm">📋 Prislista:</span>
            <span className="text-slate-700 text-sm font-medium">{prislistaSource}</span>
            <span className="text-slate-400 text-sm">({prislista.length} artiklar)</span>
          </div>
          <label className="cursor-pointer px-4 py-2 bg-primary-500 hover:bg-primary-600 rounded-lg text-white text-sm font-medium transition-colors shadow-sm">
            📤 Ladda upp Excel
            <input
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileUpload(file);
              }}
            />
          </label>
        </div>

        {/* Tab navigation */}
        <TabNavigation 
          tabs={tabs} 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
        />

        {/* Tab content */}
        <div className="mt-8">
          {activeTab === 0 && (
            <StructureTab inputs={inputs} calculated={calculated} />
          )}
          {activeTab === 1 && (
            <MaterialTab 
              materials={materials} 
              setMaterials={setMaterials} 
            />
          )}
          {activeTab === 2 && (
            <TimeQuoteTab 
              inputs={inputs} 
              calculated={calculated} 
              materials={materials} 
            />
          )}
        </div>

        {/* Footer */}
        <footer className="mt-16 pt-8 border-t border-slate-200 text-center text-slate-400 text-sm">
          <p>Timmerhus-kalkyl • Enhetstider laddas från Excel</p>
        </footer>
      </main>

      {/* CSS animation keyframes */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
