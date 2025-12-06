import type { BuildingInputs, CalculatedValues } from '../../types';
import { formatNumber } from '../../utils/calculations';

interface Props {
  inputs: BuildingInputs;
  calculated: CalculatedValues;
}

export function StructureTab({ inputs, calculated }: Props) {
  const { roofType, includeMellanvagg, wallHeight, avdragVaggarea, innertakTyp } = inputs;
  const { 
    varvSnitt, totalLogg, roofArea, innerArea, 
    gabelHeight, totalHeight, vaggAreaTotal, vaggAreaNetto,
    innerVaggArea, innertakArea, innerOmkrets,
    timmerYtter, timmerGavlar, timmerMellan,
    roofLenEff, roofSlope, innerL, innerB,
    antalVarvLow, antalVarvHigh, meterPerVarv, syllOmkrets
  } = calculated;

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header info badges */}
      <div className="flex flex-wrap gap-3">
        <Badge icon="🏠" label="Stomtyp" value={roofType === 'sadeltak' ? 'Sadeltak' : 'Pulpettak'} />
        <Badge icon="🧱" label="Mellanvägg" value={includeMellanvagg ? 'Ja' : 'Nej'} />
      </div>

      {/* Key metrics grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <MetricCard 
          label="Antal stockvarv (snitt)" 
          value={formatNumber(varvSnitt, 1)} 
          icon="📊"
        />
        <MetricCard 
          label="Total timmerlängd" 
          value={`${formatNumber(totalLogg, 1)} m`} 
          icon="📏"
        />
        <MetricCard 
          label={avdragVaggarea > 0 ? "Väggyta netto" : "Väggyta totalt"} 
          value={`${formatNumber(avdragVaggarea > 0 ? vaggAreaNetto : vaggAreaTotal, 1)} m²`} 
          icon="🧱"
        />
        <MetricCard 
          label="Takarea (yttre)" 
          value={`${formatNumber(roofArea, 1)} m²`} 
          icon="🏠"
        />
        <MetricCard 
          label="Golvarea" 
          value={`${formatNumber(innerArea, 1)} m²`} 
          icon="⬛"
        />
        <MetricCard 
          label="Innertakyta" 
          value={`${formatNumber(innertakArea, 1)} m²`} 
          icon="🔲"
        />
      </div>

      {/* Height metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard 
          label="Väggliv (låg sida)" 
          value={`${formatNumber(wallHeight, 2)} m`}
          small
        />
        <MetricCard 
          label="Extra höjd (gavel/pulpet)" 
          value={`${formatNumber(gabelHeight, 2)} m`}
          small
        />
        <MetricCard 
          label="Total bygghöjd" 
          value={`${formatNumber(totalHeight, 2)} m`}
          small
        />
        <HeightStatus height={totalHeight} />
      </div>

      {/* Pulpet extra info */}
      {roofType === 'pulpettak' && (
        <div className="flex gap-4 text-sm text-slate-500">
          <span>Antal varv låg sida: <strong className="text-slate-700">{antalVarvLow}</strong></span>
          <span>•</span>
          <span>Antal varv hög sida: <strong className="text-slate-700">{antalVarvHigh}</strong></span>
        </div>
      )}

      {/* Detail sections */}
      <div className="grid lg:grid-cols-2 gap-6">
        <DetailCard title="🪵 Väggar & timmer">
          <DetailList items={[
            { label: 'Meter per varv', value: `${formatNumber(meterPerVarv, 2)} m` },
            { label: 'Syllomkrets', value: `${formatNumber(syllOmkrets, 2)} m` },
            { label: 'Ytterväggar', value: `${formatNumber(timmerYtter, 1)} m` },
            { label: 'Gavlar', value: `${formatNumber(timmerGavlar, 1)} m` },
            { label: 'Mellanvägg', value: `${formatNumber(timmerMellan, 1)} m` },
            { label: 'Total timmerlängd', value: `${formatNumber(totalLogg, 1)} m`, highlight: true },
            { label: 'Väggyta totalt (brutto)', value: `${formatNumber(vaggAreaTotal, 2)} m²`, highlight: true },
            ...(avdragVaggarea > 0 ? [
              { label: `Avdrag (fönster/dörrar)`, value: `-${formatNumber(avdragVaggarea, 2)} m²` },
              { label: 'Väggyta netto', value: `${formatNumber(vaggAreaNetto, 2)} m²`, highlight: true },
            ] : []),
            { label: 'Invändig omkrets', value: `${formatNumber(innerOmkrets, 2)} m` },
            { label: 'Invändig väggyta', value: `${formatNumber(innerVaggArea, 2)} m²`, highlight: true },
          ]} />
        </DetailCard>

        <DetailCard title="🏠 Tak & golv">
          <div className="grid grid-cols-2 gap-x-6">
            <DetailList items={[
              { label: 'Effektiv taklängd', value: `${formatNumber(roofLenEff, 2)} m` },
              { label: 'Sned taklängd', value: `${formatNumber(roofSlope, 2)} m` },
              { label: 'Takarea (yttre)', value: `${formatNumber(roofArea, 1)} m²` },
            ]} />
            <DetailList items={[
              { label: 'Invändig längd', value: `${formatNumber(innerL, 2)} m` },
              { label: 'Invändig bredd', value: `${formatNumber(innerB, 2)} m` },
              { label: 'Golvyta', value: `${formatNumber(innerArea, 2)} m²` },
            ]} />
          </div>
          <div className="mt-4 pt-4 border-t border-slate-200">
            <DetailList items={[
              { 
                label: `Innertak (${innertakTyp === 'sned' ? 'snedtak' : 'platt'})`, 
                value: `${formatNumber(innertakArea, 2)} m²`, 
                highlight: true 
              },
            ]} />
            <p className="text-xs text-slate-400 mt-1">
              {innertakTyp === 'sned' 
                ? 'Följer taklutningen invändigt' 
                : 'Horisontellt tak (samma som golvyta)'}
            </p>
          </div>
        </DetailCard>
      </div>
    </div>
  );
}

function Badge({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-slate-200 shadow-sm">
      <span>{icon}</span>
      <span className="text-sm text-slate-500">{label}:</span>
      <span className="text-sm font-medium text-slate-700">{value}</span>
    </div>
  );
}

function MetricCard({ 
  label, value, icon, small = false 
}: { 
  label: string; 
  value: string; 
  icon?: string;
  small?: boolean;
}) {
  return (
    <div className="group relative bg-white rounded-xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300">
      <div className="relative">
        {icon && <span className="text-2xl mb-2 block">{icon}</span>}
        <p className="text-xs text-slate-500 mb-1">{label}</p>
        <p className={`font-semibold text-slate-800 ${small ? 'text-lg' : 'text-2xl'}`}>{value}</p>
      </div>
    </div>
  );
}

function HeightStatus({ height }: { height: number }) {
  const isOver = height > 3.0;
  
  return (
    <div className={`relative rounded-xl p-5 border transition-all duration-300 ${
      isOver 
        ? 'bg-red-50 border-red-200' 
        : 'bg-green-50 border-green-200'
    }`}>
      <p className="text-xs text-slate-500 mb-1">Bygglovsgräns</p>
      <p className={`text-lg font-bold ${isOver ? 'text-red-600' : 'text-green-600'}`}>
        {isOver ? '⚠️ ÖVER 3,0 m' : '✓ UNDER 3,0 m'}
      </p>
      {isOver && (
        <p className="text-xs text-red-500 mt-1">Kan kräva bygglov</p>
      )}
    </div>
  );
}

function DetailCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
      <h3 className="font-display font-semibold text-xl text-slate-800 mb-4">{title}</h3>
      {children}
    </section>
  );
}

function DetailList({ items }: { items: { label: string; value: string; highlight?: boolean }[] }) {
  return (
    <ul className="space-y-2">
      {items.map((item, i) => (
        <li key={i} className={`flex justify-between ${item.highlight ? 'pt-2 border-t border-slate-200' : ''}`}>
          <span className="text-slate-500">{item.label}</span>
          <span className={`font-medium ${item.highlight ? 'text-slate-800' : 'text-slate-600'}`}>
            {item.value}
          </span>
        </li>
      ))}
    </ul>
  );
}
