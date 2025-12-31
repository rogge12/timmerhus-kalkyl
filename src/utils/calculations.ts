import type { BuildingInputs, CalculatedValues, PrislistaMaterial, MaterialRow } from '../types';

export function calculateBuilding(inputs: BuildingInputs): CalculatedValues {
  const {
    roofType, includeMellanvagg, grundTyp, length: L, width: B, wallHeight: h_wall,
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
  const outerArea = L * B;  // Ytterarea
  const innerArea = innerL * innerB;
  
  // Grund - höjd och antal element
  // Plintar och betongsten bygger båda 20cm (betongsten: 2 × 10cm staplade)
  const grundHeight = grundTyp !== 'ingen' ? 0.2 : 0;
  
  // Antal grundelement - fasta standardvärden
  // Plintar: 9 st, Betongsten: 15 st (kan justeras manuellt i Material-fliken)
  const antalPlintar = 9;
  const antalBetongsten = 15;
  const antalGrundElement = grundTyp === 'plintar' ? antalPlintar : antalBetongsten;
  
  const totalHeight = h_wall + gabelHeight + grundHeight;

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
    roofArea, outerArea, innerArea, innerL, innerB, gabelHeight, grundHeight, totalHeight,
    golvasLen, stroLaktLen, barLaktLen, roofLenEff, roofSlope,
    meterPerVarv,
    syllOmkrets,
    innerOmkrets,
    antalGrundElement
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
      // Stödregel 45x45 beräknas på gavelväggarnas insida längd (2 × innerB)
      if (mat.artikel === 'Stödregel 45x45') {
        mangd = 2 * calculated.innerB;  // Två gavelväggar
      } else if (mat.artikel === 'Bärlina 45x95') {
        // Bärlina = stommens bredd (B), används vid både plintar och betongsten
        if (inputs.grundTyp !== 'ingen') {
          mangd = inputs.width;  // Stommens bredd (B)
        } else {
          mangd = 0;  // Ingen bärlina utan grund
        }
      } else {
        // Floor materials are based on innerArea (m²)
        // Om MangdPerM2 är 0 eller saknas, använd 1 (hela golvytan)
        const faktor = mat.mangdPerM2 > 0 ? mat.mangdPerM2 : 1;
        mangd = innerArea * faktor;
        // Avrunda uppåt för styck-material (st)
        if (mat.enhet === 'st') {
          mangd = Math.ceil(mangd);
        }
      }
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
      } else if (mat.artikel === 'Dragstång') {
        // Fast antal dragstänger
        mangd = 6;
      }
    } else if (mat.kategori === 'Tak') {
      // Roof materials
      const antalTakfallKanter = inputs.roofType === 'sadeltak' ? 4 : 2;  // 4 kanter på sadeltak, 2 på pulpettak
      
      if (mat.artikel === 'Takåsar') {
        mangd = antalTakasar * roofLenEff;
      } else if (mat.artikel.includes('Fotplåt')) {
        // Fotplåt/Takfotsplåt: MangdPerM2 = täckning per plåt (t.ex. 1.9m)
        // Sadeltak: 2 långsidor, Pulpettak: 1 långsida
        const antalLangsidor = inputs.roofType === 'sadeltak' ? 2 : 1;
        if (mat.enhet === 'st' && mat.mangdPerM2 > 0) {
          const totalLangd = antalLangsidor * roofLenEff;
          mangd = Math.ceil(totalLangd / mat.mangdPerM2);  // Antal plåtar (st)
        } else {
          mangd = antalLangsidor * roofLenEff;  // Löpmeter
        }
      } else if (mat.artikel.includes('Takfotsbräda') || mat.artikel.includes('Regnvatten')) {
        mangd = 2 * roofLenEff;
      } else if (mat.artikel.includes('Vindskiveplåt')) {
        // Vindskiveplåt: MangdPerM2 = täckning per plåt (t.ex. 1.9m)
        // Antal = avrunda uppåt((takfall-kanter × takfall-längd) / täckning)
        // Sadeltak: 4 takfall, Pulpettak: 2 takfall
        const tackningPerPlat = mat.mangdPerM2 > 0 ? mat.mangdPerM2 : 1.9;
        const totalLangd = antalTakfallKanter * roofSlope;
        mangd = Math.ceil(totalLangd / tackningPerPlat);  // Antal plåtar (st)
      } else if (mat.artikel.includes('Vindskiv')) {
        // Vindskivor: MangdPerM2 = antal brädor per takfall (t.ex. 2)
        // Sadeltak: 4 takfall × 2 brädor × takfall-längd meter
        // Pulpettak: 2 takfall × 2 brädor × takfall-längd meter
        const antalBradorPerTakfall = mat.mangdPerM2 > 0 ? mat.mangdPerM2 : 2;  // Default 2
        mangd = antalTakfallKanter * antalBradorPerTakfall * roofSlope;  // Total längd i meter
      } else if (mat.artikel.includes('Nockplåt')) {
        mangd = roofLenEff;
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
      // Foundation materials - plintar or betongsten based on grundTyp
      // Fasta standardvärden: 9 plintar eller 15 betongsten
      if (mat.artikel === 'Plintar' && inputs.grundTyp === 'plintar') {
        mangd = 9;  // Fast antal plintar
      } else if (mat.artikel === 'Betongsten 40x40x10' && inputs.grundTyp === 'betongsten') {
        mangd = 15;  // Fast antal betongsten
      } else if (mat.mangdPerM2 > 0) {
        mangd = innerArea * mat.mangdPerM2;
      }
    }

    // För "Timmer (tillverkning)" används priserna från ekonomi-inställningarna
    const isTimmer = mat.artikel === 'Timmer (tillverkning)';
    const inkopspris = isTimmer ? inputs.prisTimmerIn : mat.inkopspris;
    // För timmer beräknas påslaget från ekonomi-inställningarna
    const spillPct = isTimmer ? 0 : mat.spillPct;
    const paslagPct = isTimmer 
      ? Math.round((inputs.prisTimmerUt / inputs.prisTimmerIn - 1) * 100) 
      : mat.paslagPct;

    return {
      id: `mat-${index}`,
      kategori: mat.kategori,
      artikel: mat.artikel,
      enhet: mat.enhet,
      mangdPerM2: mat.mangdPerM2,
      mangd: Math.round(mangd * 100) / 100,
      inkopspris,
      spillPct,
      paslagPct,
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

// Formatera tid i timmar och minuter (t.ex. "2h 30min" eller "45min")
export function formatTime(hours: number): string {
  if (hours === 0) return '0min';
  
  const totalMinutes = Math.round(hours * 60);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  
  if (h === 0) {
    return `${m}min`;
  } else if (m === 0) {
    return `${h}h`;
  } else {
    return `${h}h ${m}min`;
  }
}

// Kort format för tabeller (t.ex. "2:30" eller "0:45")
export function formatTimeShort(hours: number): string {
  if (hours === 0) return '0:00';
  
  const totalMinutes = Math.round(hours * 60);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  
  return `${h}:${m.toString().padStart(2, '0')}`;
}
