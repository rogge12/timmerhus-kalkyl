export interface BuildingInputs {
  roofType: 'sadeltak' | 'pulpettak';
  includeMellanvagg: boolean;
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
  innerArea: number;
  innerL: number;
  innerB: number;
  gabelHeight: number;
  totalHeight: number;
  golvasLen: number;
  stroLaktLen: number;
  barLaktLen: number;
  roofLenEff: number;
  roofSlope: number;
  meterPerVarv: number;  // Meter timmer per stockvarv (inkl knututstick)
  syllOmkrets: number;   // Omkrets för syllvirke (utan knututstick)
  innerOmkrets: number;  // Invändig omkrets
}

// Material from Excel file
export interface PrislistaMaterial {
  kategori: string;
  artikel: string;
  enhet: string;
  mangdPerM2: number;
  enhetstid: number;
  inkopspris: number;
  forsaljningspris: number;
  taMed: boolean;
  notering: string;
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
  forsaljningspris: number;
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
  prisTimmerIn: 60,
  prisTimmerUt: 120,
  timkostnad: 450,
  momsPct: 25,
  avdragVaggarea: 0,  // Avdrag för fönster/dörrar
  innertakTyp: 'sned',  // Snedtak som standard
};
