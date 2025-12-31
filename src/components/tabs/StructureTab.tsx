import type { BuildingInputs, CalculatedValues } from '../../types';
import { formatNumber, formatTime } from '../../utils/calculations';

interface Props {
  inputs: BuildingInputs;
  calculated: CalculatedValues;
}

// Uppskattad tillverkningstid per m² väggyta (i timmar)
const TILLVERKNINGSTID_PER_M2 = 27 / 60; // 27 minuter = 0.45 timmar

export function StructureTab({ inputs, calculated }: Props) {
  const { roofType, includeMellanvagg, grundTyp, wallHeight, avdragVaggarea, innertakTyp } = inputs;
  const { 
    varvSnitt, totalLogg, totalLoggNetto, roofArea, outerArea, innerArea, 
    gabelHeight, grundHeight, totalHeight, vaggAreaTotal, vaggAreaNetto,
    innerVaggArea, innertakArea, innerOmkrets,
    timmerYtter, timmerGavlar, timmerMellan,
    roofLenEff, roofSlope, innerL, innerB,
    antalVarvLow, antalVarvHigh, meterPerVarv, syllOmkrets, antalGrundElement
  } = calculated;

  const isOverHeight = totalHeight > 3.0;
  
  // Beräkna uppskattad tillverkningstid för timmer
  const tillverkningsTid = (avdragVaggarea > 0 ? vaggAreaNetto : vaggAreaTotal) * TILLVERKNINGSTID_PER_M2;

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* Top row: badges + height status */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex flex-wrap gap-2">
          <Badge label="Stomtyp" value={roofType === 'sadeltak' ? 'Sadeltak' : 'Pulpettak'} />
          <Badge label="Mellanvägg" value={includeMellanvagg ? 'Ja' : 'Nej'} />
          <Badge label="Grund" value={grundTyp === 'plintar' ? `Plintar (${antalGrundElement} st)` : grundTyp === 'betongsten' ? `Betongsten (${antalGrundElement} st)` : 'Ingen'} />
          {roofType === 'pulpettak' && (
            <Badge label="Varv" value={`${antalVarvLow} / ${antalVarvHigh}`} />
          )}
          {roofType === 'sadeltak' && (
            <Badge label="Varv (snitt)" value={formatNumber(varvSnitt, 1)} />
          )}
        </div>
        <div className={`px-3 py-1.5 rounded-full text-sm font-medium ${
          isOverHeight 
            ? 'bg-red-100 text-red-700 border border-red-200' 
            : 'bg-green-100 text-green-700 border border-green-200'
        }`}>
          {isOverHeight ? '⚠️ Höjd > 3,0 m' : '✓ Höjd < 3,0 m'}
        </div>
      </div>

      {/* Main metrics - compact grid */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-7 gap-4">
          <Metric label="Ytterarea" value={formatNumber(outerArea, 1)} unit="m²" />
          <Metric label="Timmerlängd" value={formatNumber(avdragVaggarea > 0 ? totalLoggNetto : totalLogg, 1)} unit="m" />
          <Metric label="Väggyta" value={formatNumber(avdragVaggarea > 0 ? vaggAreaNetto : vaggAreaTotal, 1)} unit="m²" />
          <Metric label="Takarea" value={formatNumber(roofArea, 1)} unit="m²" />
          <Metric label="Golvarea" value={formatNumber(innerArea, 1)} unit="m²" />
          <Metric label="Innertakyta" value={formatNumber(innertakArea, 1)} unit="m²" />
          <Metric label="Total höjd" value={formatNumber(totalHeight, 2)} unit="m" highlight={isOverHeight} />
        </div>
      </div>

      {/* Detail tables side by side */}
      <div className="grid lg:grid-cols-2 gap-4">
        {/* Väggar & timmer */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="bg-slate-50 px-4 py-2 border-b border-slate-200">
            <h3 className="font-semibold text-slate-700 text-sm">🏗️ Väggar & timmer</h3>
          </div>
          <div className="p-3">
            <table className="w-full text-sm">
              <tbody>
                <Row label="Meter/varv" value={`${formatNumber(meterPerVarv, 2)} m`} />
                <Row label="Syllomkrets" value={`${formatNumber(syllOmkrets, 2)} m`} />
                <Row label="Ytterväggar" value={`${formatNumber(timmerYtter, 1)} m`} />
                <Row label="Gavlar" value={`${formatNumber(timmerGavlar, 1)} m`} />
                {includeMellanvagg && <Row label="Mellanvägg" value={`${formatNumber(timmerMellan, 1)} m`} />}
                <Row label="Timmer brutto" value={`${formatNumber(totalLogg, 1)} m`} highlight />
                {avdragVaggarea > 0 && (
                  <>
                    <Row label="Avdrag (fönster/dörr)" value={`-${formatNumber(avdragVaggarea, 1)} m²`} />
                    <Row label="Timmer netto" value={`${formatNumber(totalLoggNetto, 1)} m`} highlight />
                  </>
                )}
                <Row label="Inv. väggyta" value={`${formatNumber(innerVaggArea, 1)} m²`} />
              </tbody>
            </table>
          </div>
        </div>

        {/* Tak & golv */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="bg-slate-50 px-4 py-2 border-b border-slate-200">
            <h3 className="font-semibold text-slate-700 text-sm">🏠 Tak & golv</h3>
          </div>
          <div className="p-3">
            <table className="w-full text-sm">
              <tbody>
                <Row label="Taklängd (eff)" value={`${formatNumber(roofLenEff, 2)} m`} />
                <Row label="Takfall" value={`${formatNumber(roofSlope, 2)} m`} />
                <Row label="Takarea" value={`${formatNumber(roofArea, 1)} m²`} highlight />
                <Row label="Inv. längd" value={`${formatNumber(innerL, 2)} m`} />
                <Row label="Inv. bredd" value={`${formatNumber(innerB, 2)} m`} />
                <Row label="Golvyta" value={`${formatNumber(innerArea, 1)} m²`} highlight />
                <Row label={`Innertak (${innertakTyp === 'sned' ? 'sned' : 'platt'})`} value={`${formatNumber(innertakArea, 1)} m²`} />
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Höjder - compact */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
          <span className="text-slate-500">Höjder:</span>
          {grundHeight > 0 && (
            <span><span className="text-slate-500">Grund:</span> <strong className="text-slate-700">{formatNumber(grundHeight * 100, 0)} cm</strong></span>
          )}
          <span><span className="text-slate-500">Väggliv:</span> <strong className="text-slate-700">{formatNumber(wallHeight, 2)} m</strong></span>
          <span><span className="text-slate-500">Gavel/pulpet:</span> <strong className="text-slate-700">{formatNumber(gabelHeight, 2)} m</strong></span>
          <span><span className="text-slate-500">Total:</span> <strong className={isOverHeight ? 'text-red-600' : 'text-slate-700'}>{formatNumber(totalHeight, 2)} m</strong></span>
          <span><span className="text-slate-500">Inv. omkrets:</span> <strong className="text-slate-700">{formatNumber(innerOmkrets, 2)} m</strong></span>
        </div>
      </div>

      {/* Uppskattad tillverkningstid */}
      <div className="bg-amber-50 rounded-xl border border-amber-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">⏱️</span>
            <div>
              <p className="text-sm font-medium text-amber-800">Uppskattad tillverkningstid (timmer)</p>
              <p className="text-xs text-amber-600">
                {formatNumber(avdragVaggarea > 0 ? vaggAreaNetto : vaggAreaTotal, 1)} m² × 27 min/m²
              </p>
            </div>
          </div>
          <p className="text-2xl font-bold text-amber-700">{formatTime(tillverkningsTid)}</p>
        </div>
      </div>
    </div>
  );
}

function Badge({ label, value }: { label: string; value: string }) {
  return (
    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 rounded-full text-sm">
      <span className="text-slate-500">{label}:</span>
      <span className="font-medium text-slate-700">{value}</span>
    </div>
  );
}

function Metric({ label, value, unit, highlight = false }: { label: string; value: string; unit: string; highlight?: boolean }) {
  return (
    <div className="text-center">
      <p className="text-xs text-slate-500 mb-0.5">{label}</p>
      <p className={`text-lg font-bold ${highlight ? 'text-red-600' : 'text-slate-800'}`}>
        {value} <span className="text-sm font-normal text-slate-500">{unit}</span>
      </p>
    </div>
  );
}

function Row({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <tr className={highlight ? 'bg-slate-50' : ''}>
      <td className="py-1 text-slate-500">{label}</td>
      <td className={`py-1 text-right font-medium ${highlight ? 'text-slate-800' : 'text-slate-600'}`}>{value}</td>
    </tr>
  );
}
