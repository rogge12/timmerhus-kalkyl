export interface BuildingInputs {
  roofType: 'sadeltak' | 'pulpettak';
  includeMellanvagg: boolean;
  grundTyp: 'plintar' | 'betongsten' | 'ingen';  // Typ av grund
  length: number;
  width: number;
  wallHeight: number;
  roofAngle: number;
  overhang: number;
  knut: number;
  timmerThickness: number;
  stockHeight: number;
  ccGolv: number;
  ccStro: number;
  ccBar: number;
  antalTakasar: number;
  prisTimmerIn: number;
  prisTimmerUt: number;
  timkostnad: number;
  momsPct: number;
  avdragVaggarea: number;  // Avdrag för fönster/dörrar (m²)
  innertakTyp: 'sned' | 'platt';  // Snedtak följer taklutning, platt = som golvarea
}

export interface CalculatedValues {
  antalVarvLow: number;
  antalVarvHigh: number;
  varvSnitt: number;
  timmerYtter: number;
  timmerGavlar: number;
  timmerMellan: number;
  totalLogg: number;
  totalLoggNetto: number;  // Timmerlängd minus avdrag för fönster/dörrar
  vaggAreaTotal: number;
  vaggAreaNetto: number;  // Väggarea minus avdrag för fönster/dörrar
  innerVaggArea: number;  // Invändig väggarea (för innerpanel etc)
  innertakArea: number;   // Innertak area (sned eller platt)
  roofArea: number;
  outerArea: number;      // Ytterarea (L × B)
  innerArea: number;
  innerL: number;
  innerB: number;
  gabelHeight: number;
  grundHeight: number;    // Höjd på grund (0.2m för plintar/betongsten, 0 för ingen)
  totalHeight: number;
  golvasLen: number;
  stroLaktLen: number;
  barLaktLen: number;
  roofLenEff: number;
  roofSlope: number;
  meterPerVarv: number;  // Meter timmer per stockvarv (inkl knututstick)
  syllOmkrets: number;   // Omkrets för syllvirke (utan knututstick)
  innerOmkrets: number;  // Invändig omkrets
  antalGrundElement: number;  // Antal plintar eller betongstenspar
}

// Material from Excel file
export interface PrislistaMaterial {
  kategori: string;
  artikel: string;
  enhet: string;
  mangdPerM2: number;
  enhetstid: number;
  inkopspris: number;
  spillPct: number;      // Spill i procent (t.ex. 10 = 10%)
  paslagPct: number;     // Påslag i procent (t.ex. 30 = 30%)
  taMed: boolean;
  notering: string;
}

export interface EkonomiSettings {
  prisTimmerIn: number;      // Inköpspris timmer kr/m
  prisTimmerUt: number;      // Försäljningspris timmer kr/m
  timkostnad: number;        // Timkostnad kr/h
  momsPct: number;           // Moms %
}

// Material row for calculations (includes calculated quantity)
export interface MaterialRow {
  id: string;
  kategori: string;
  artikel: string;
  enhet: string;
  mangdPerM2: number;
  mangd: number;
  inkopspris: number;
  spillPct: number;      // Spill i procent (t.ex. 10 = 10%)
  paslagPct: number;     // Påslag i procent (t.ex. 30 = 30%)
  enhetstid: number;
  taMed: boolean;
  notering: string;
}

export interface TimeRow {
  id: string;
  aktiv: boolean;
  aktivitet: string;
  enhet: string;
  mangd: number;
  enhetstid: number;
}

export const defaultInputs: BuildingInputs = {
  roofType: 'sadeltak',
  includeMellanvagg: false,
  grundTyp: 'plintar',  // Standard: plintar
  length: 5.0,
  width: 3.0,
  wallHeight: 2.12,
  roofAngle: 22.0,
  overhang: 0.4,
  knut: 0.14,
  timmerThickness: 0.07,
  stockHeight: 0.157,
  ccGolv: 0.6,
  ccStro: 0.6,
  ccBar: 0.35,
  antalTakasar: 3,
  prisTimmerIn: 458,
  prisTimmerUt: 850,
  timkostnad: 550,
  momsPct: 25,
  avdragVaggarea: 0,  // Avdrag för fönster/dörrar
  innertakTyp: 'sned',  // Snedtak som standard
};
