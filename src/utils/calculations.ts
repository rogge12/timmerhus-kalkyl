import type { BuildingInputs, CalculatedValues, PrislistaMaterial, MaterialRow } from '../types';

export function calculateBuilding(inputs: BuildingInputs): CalculatedValues {
  const {
    roofType, includeMellanvagg, length: L, width: B, wallHeight: h_wall,
    roofAngle: angle_deg, overhang, knut, timmerThickness: timmer_t,
    stockHeight: stock_h, ccGolv, ccStro, ccBar, avdragVaggarea, innertakTyp
  } = inputs;

  const angle_rad = (angle_deg * Math.PI) / 180;
  const meterPerVarv = 2 * ((L + 2 * knut) + (B + 2 * knut));  // Meter timmer per stockvarv (inkl knututstick)
  const syllOmkrets = 2 * (L + B);  // Omkrets för syllvirke (utan knututstick)

  let antalVarvLow: number, antalVarvHigh: number, varvSnitt: number;
  let timmerYtter: number, timmerGavlar: number, timmerMellan = 0;
  let gabelHeight: number;

  // Wall areas in m²
  let vaggAreaYtter: number, vaggAreaGavlar: number, vaggAreaMellan = 0;

  if (roofType === 'sadeltak') {
    antalVarvLow = Math.ceil(h_wall / stock_h);
    antalVarvHigh = antalVarvLow;
    varvSnitt = antalVarvLow;
    timmerYtter = meterPerVarv * antalVarvLow;
    gabelHeight = (B / 2.0) * Math.tan(angle_rad);
    const gabelAreaTotal = L * gabelHeight;
    timmerGavlar = gabelAreaTotal / stock_h;

    vaggAreaYtter = meterPerVarv * h_wall;
    vaggAreaGavlar = 2 * (0.5 * B * gabelHeight);

    if (includeMellanvagg) {
      const loggMellanBas = antalVarvLow * L;
      const loggMellanGavel = (0.5 * L * gabelHeight) / stock_h;
      timmerMellan = loggMellanBas + loggMellanGavel;
      vaggAreaMellan = L * h_wall + 0.5 * L * gabelHeight;
    }
  } else {
    antalVarvLow = Math.ceil(h_wall / stock_h);
    const delta_h = B * Math.tan(angle_rad);
    const h_high = h_wall + delta_h;
    antalVarvHigh = Math.ceil(h_high / stock_h);
    varvSnitt = (antalVarvLow + antalVarvHigh) / 2.0;
    timmerYtter = meterPerVarv * varvSnitt;
    gabelHeight = delta_h;
    timmerGavlar = 0;

    const avgHeight = (h_wall + h_high) / 2;
    vaggAreaYtter = meterPerVarv * avgHeight;
    vaggAreaGavlar = 0;

    if (includeMellanvagg) {
      timmerMellan = L * varvSnitt;
      vaggAreaMellan = L * avgHeight;
    }
  }

  const totalLogg = timmerYtter + timmerGavlar + timmerMellan;
  const vaggAreaTotal = vaggAreaYtter + vaggAreaGavlar + vaggAreaMellan;
  
  // Netto väggarea (minus avdrag för fönster/dörrar)
  const vaggAreaNetto = Math.max(vaggAreaTotal - avdragVaggarea, 0);
  
  // Netto timmerlängd - proportionellt reducerad baserat på väggarea-avdrag
  const totalLoggNetto = vaggAreaTotal > 0 
    ? totalLogg * (vaggAreaNetto / vaggAreaTotal)
    : totalLogg;

  const roofLenEff = L + 2 * overhang;
  let roofRun: number, roofSlope: number, roofArea: number;

  if (roofType === 'sadeltak') {
    // Sadeltak: varje halva går från nock till kant + utsprång
    roofRun = B / 2.0 + overhang;
    roofSlope = roofRun / Math.cos(angle_rad);
    roofArea = 2 * roofLenEff * roofSlope;
  } else {
    // Pulpettak: hela bredden + utsprång på BÅDA sidor (låg och hög kant)
    roofRun = B + 2 * overhang;
    roofSlope = roofRun / Math.cos(angle_rad);
    roofArea = roofLenEff * roofSlope;
  }

  const innerL = Math.max(L - 2 * timmer_t, 0);
  const innerB = Math.max(B - 2 * timmer_t, 0);
  const innerArea = innerL * innerB;
  const totalHeight = h_wall + gabelHeight;

  // Invändig omkrets och väggarea
  const innerOmkrets = 2 * (innerL + innerB);
  const innerVaggArea = innerOmkrets * h_wall;

  // Innertak area - beror på typ
  let innertakArea: number;
  if (innertakTyp === 'platt') {
    // Platt innertak = samma som golvarea
    innertakArea = innerArea;
  } else {
    // Snedtak - följer taklutningen invändigt
    if (roofType === 'sadeltak') {
      const innerRoofSlope = (innerB / 2) / Math.cos(angle_rad);
      innertakArea = 2 * innerL * innerRoofSlope;
    } else {
      const innerRoofSlope = innerB / Math.cos(angle_rad);
      innertakArea = innerL * innerRoofSlope;
    }
  }

  const antalGolvAser = ccGolv > 0 ? Math.ceil(L / ccGolv) : 0;
  const golvasLen = antalGolvAser * innerB;

  const antalStro = ccStro > 0 ? Math.ceil(roofSlope / ccStro) : 0;
  const stroLaktLen = roofType === 'sadeltak' 
    ? 2 * roofLenEff * antalStro 
    : roofLenEff * antalStro;

  const antalBar = ccBar > 0 ? Math.ceil(roofLenEff / ccBar) : 0;
  const barLaktLen = roofType === 'sadeltak' 
    ? 2 * roofSlope * antalBar 
    : roofSlope * antalBar;

  return {
    antalVarvLow, antalVarvHigh, varvSnitt,
    timmerYtter, timmerGavlar, timmerMellan, totalLogg, totalLoggNetto,
    vaggAreaTotal,
    vaggAreaNetto,
    innerVaggArea,
    innertakArea,
    roofArea, innerArea, innerL, innerB, gabelHeight, totalHeight,
    golvasLen, stroLaktLen, barLaktLen, roofLenEff, roofSlope,
    meterPerVarv,
    syllOmkrets,
    innerOmkrets
  };
}

// Calculate material quantities based on building dimensions and prislista
export function calculateMaterialQuantities(
  prislista: PrislistaMaterial[],
  inputs: BuildingInputs,
  calculated: CalculatedValues
): MaterialRow[] {
  const { 
    innerArea, roofArea, vaggAreaTotal, vaggAreaNetto, innerVaggArea, innertakArea,
    roofLenEff, roofSlope, syllOmkrets 
  } = calculated;
  const { antalTakasar } = inputs;

  return prislista.map((mat, index) => {
    let mangd = 0;

    // Calculate quantity based on category and article
    if (mat.kategori === 'Golv') {
      // Floor materials are based on innerArea (m²)
      // Om MangdPerM2 är 0 eller saknas, använd 1 (hela golvytan)
      const faktor = mat.mangdPerM2 > 0 ? mat.mangdPerM2 : 1;
      mangd = innerArea * faktor;
    } else if (mat.kategori === 'Stomme') {
      // Stomme materials - check which ones use wall area vs syllomkrets
      if (mat.artikel === 'Timmer (tillverkning)' || 
          mat.artikel === 'Montering stomme' || 
          mat.artikel === 'Timmerväggar') {
        // Dessa använder väggarea netto (m²) - minus fönster/dörrar
        mangd = vaggAreaNetto;
      } else if (mat.artikel === 'Syllvirke 45x95') {
        // Syllvirke ligger under väggarna, inte under knutarna
        mangd = syllOmkrets;
      }
    } else if (mat.kategori === 'Tak') {
      // Roof materials
      if (mat.artikel === 'Takåsar') {
        mangd = antalTakasar * roofLenEff;
      } else if (mat.artikel.includes('Fotplåt') || mat.artikel.includes('Takfotsbräda') || mat.artikel.includes('Regnvatten')) {
        mangd = 2 * roofLenEff;
      } else if (mat.artikel.includes('Vindskiv') || mat.artikel.includes('Nockplåt')) {
        if (mat.artikel === 'Nockplåt') {
          mangd = roofLenEff;
        } else {
          mangd = 4 * roofSlope;
        }
      } else if (mat.mangdPerM2 > 0) {
        // Area-based materials (råspont, takplåt, etc)
        mangd = roofArea * mat.mangdPerM2;
      }
    } else if (mat.kategori === 'Vägg') {
      // Wall materials based on wall area (netto - minus fönster/dörrar)
      if (mat.mangdPerM2 > 0) {
        mangd = vaggAreaNetto * mat.mangdPerM2;
      }
    } else if (mat.kategori === 'Invändigt') {
      // Invändiga material (innerpanel, innertakspanel etc.)
      if (mat.artikel.includes('innervägg') || mat.artikel.includes('Innervägg')) {
        mangd = innerVaggArea * (mat.mangdPerM2 > 0 ? mat.mangdPerM2 : 1);
      } else if (mat.artikel.includes('innertak') || mat.artikel.includes('Innertak')) {
        mangd = innertakArea * (mat.mangdPerM2 > 0 ? mat.mangdPerM2 : 1);
      } else if (mat.mangdPerM2 > 0) {
        // Default: use innerArea
        mangd = innerArea * mat.mangdPerM2;
      }
    } else if (mat.kategori === 'Grund') {
      // Foundation materials based on inner area
      if (mat.mangdPerM2 > 0) {
        mangd = innerArea * mat.mangdPerM2;
      }
    }

    return {
      id: `mat-${index}`,
      kategori: mat.kategori,
      artikel: mat.artikel,
      enhet: mat.enhet,
      mangdPerM2: mat.mangdPerM2,
      mangd: Math.round(mangd * 100) / 100,
      inkopspris: mat.inkopspris,
      forsaljningspris: mat.forsaljningspris,
      enhetstid: mat.enhetstid,
      taMed: mat.taMed && mangd > 0,
      notering: mat.notering,
    };
  });
}

export function formatNumber(num: number, decimals: number = 1): string {
  return num.toLocaleString('sv-SE', { 
    minimumFractionDigits: decimals, 
    maximumFractionDigits: decimals 
  });
}

export function formatCurrency(num: number): string {
  return num.toLocaleString('sv-SE', { 
    minimumFractionDigits: 0, 
    maximumFractionDigits: 0 
  }) + ' kr';
}
