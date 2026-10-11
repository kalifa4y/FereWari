import {
  calculateProductCRU,
  formatFCFA,
  formatPercent,
  normalizeUnit,
  getConversionFactor,
  getCompatibleUnits
} from './calculationService';
import { RawMaterial } from '../db/db';

export function runCalculationTests() {
  console.log('🧪 Running Calculation Service Tests...');

  const materialsMap = new Map<number, RawMaterial>([
    [1, { id: 1, name: "Fleurs d'Hibiscus", unit: "kg", unitCost: 1500, stockQty: 20, updatedAt: new Date() }],
    [2, { id: 2, name: "Sucre cristal", unit: "kg", unitCost: 650, stockQty: 50, updatedAt: new Date() }],
    [3, { id: 3, name: "Feuilles de Menthe", unit: "kg", unitCost: 1200, stockQty: 5, updatedAt: new Date() }],
    [4, { id: 4, name: "Sirop de Gingembre", unit: "L", unitCost: 1800, stockQty: 10, updatedAt: new Date() }],
    [5, { id: 5, name: "Farine de blé", unit: "sac", unitCost: 25000, stockQty: 2, updatedAt: new Date() }],
    [6, { id: 6, name: "Poudre de vanille", unit: "g", unitCost: 500, stockQty: 100, updatedAt: new Date() }],
    [7, { id: 7, name: "Gros sel raffiné", unit: "kg", unitCost: 500, stockQty: 50, updatedAt: new Date() }]
  ]);

  // --- Test 1: Historical Jus de Bissap 33cl recipe (backward compatibility without unit) ---
  const breakdown1 = calculateProductCRU(
    {
      sellingPrice: 700,
      packagingCost: 120,
      transportCost: 35,
      otherCosts: 40,
      ingredients: [
        { rawMaterialId: 1, quantity: 0.05 },
        { rawMaterialId: 2, quantity: 0.04 },
        { rawMaterialId: 3, quantity: 0.01 }
      ]
    },
    materialsMap
  );

  if (Math.round(breakdown1.rawMaterialsCost) !== 113) {
    throw new Error(`Expected rawMaterialsCost to be 113, got ${breakdown1.rawMaterialsCost}`);
  }
  if (Math.round(breakdown1.totalUnitCost) !== 308) {
    throw new Error(`Expected totalUnitCost to be 308, got ${breakdown1.totalUnitCost}`);
  }
  if (Math.round(breakdown1.grossMarginAmount) !== 392) {
    throw new Error(`Expected grossMarginAmount to be 392, got ${breakdown1.grossMarginAmount}`);
  }
  if (Math.round(breakdown1.grossMarginPercentage * 10) / 10 !== 56.0) {
    throw new Error(`Expected grossMarginPercentage to be 56.0%, got ${breakdown1.grossMarginPercentage}`);
  }
  if (breakdown1.dominantCostItem.name !== 'Emballage & Conditionnement' || breakdown1.dominantCostItem.cost !== 120) {
    throw new Error(`Expected dominant cost to be Emballage (120), got ${JSON.stringify(breakdown1.dominantCostItem)}`);
  }
  if (!breakdown1.isComplete) {
    throw new Error('Historical complete recipe should be marked isComplete: true');
  }

  // --- Test 2: FCFA & Percent Currency Formatting ---
  const formatted5000 = formatFCFA(5000);
  if (!formatted5000.includes('5') || !formatted5000.includes('FCFA')) {
    throw new Error(`Invalid formatFCFA result: ${formatted5000}`);
  }
  if (formatFCFA(null) !== '0 FCFA' || formatFCFA(undefined) !== '0 FCFA') {
    throw new Error('formatFCFA should handle null/undefined as 0 FCFA');
  }
  if (formatPercent(50) !== '50.0%') {
    throw new Error(`formatPercent expected 50.0%, got ${formatPercent(50)}`);
  }

  // --- Test 3: Normalization & Conversion Factors ---
  if (normalizeUnit('KG') !== 'kg' || normalizeUnit('kilo') !== 'kg' || normalizeUnit('kilogrammes') !== 'kg') {
    throw new Error('Failed to normalize mass unit to kg');
  }
  if (normalizeUnit('g') !== 'g' || normalizeUnit('Gramme') !== 'g') {
    throw new Error('Failed to normalize mass unit to g');
  }
  if (normalizeUnit('l') !== 'L' || normalizeUnit('Litre') !== 'L') {
    throw new Error('Failed to normalize volume unit to L');
  }
  if (normalizeUnit('ml') !== 'ml' || normalizeUnit('Millilitre') !== 'ml') {
    throw new Error('Failed to normalize volume unit to ml');
  }
  if (normalizeUnit('bidon') !== 'bidon') {
    throw new Error('Custom unit bidon should be preserved');
  }

  if (getConversionFactor('g', 'kg') !== 0.001) throw new Error('g -> kg factor must be 0.001');
  if (getConversionFactor('kg', 'g') !== 1000) throw new Error('kg -> g factor must be 1000');
  if (getConversionFactor('ml', 'L') !== 0.001) throw new Error('ml -> L factor must be 0.001');
  if (getConversionFactor('L', 'ml') !== 1000) throw new Error('L -> ml factor must be 1000');
  if (getConversionFactor('kg', 'L') !== null) throw new Error('kg -> L must be incompatible (null)');
  if (getConversionFactor('sac', 'kg') !== null) throw new Error('sac -> kg must be incompatible (null)');

  const massUnits = getCompatibleUnits('kg');
  if (massUnits.length !== 2 || massUnits[0].value !== 'kg' || massUnits[1].value !== 'g') {
    throw new Error('getCompatibleUnits(kg) must return kg and g');
  }
  const volUnits = getCompatibleUnits('L');
  if (volUnits.length !== 2 || volUnits[0].value !== 'L' || volUnits[1].value !== 'ml') {
    throw new Error('getCompatibleUnits(L) must return L and ml');
  }
  const sacUnits = getCompatibleUnits('sac');
  if (sacUnits.length !== 1 || sacUnits[0].value !== 'sac') {
    throw new Error('getCompatibleUnits(sac) must return only sac');
  }

  // --- Scénario A : Conversion de masse (kg -> g) ---
  // Achat 1500 FCFA/kg, utilisation 250 g -> Coût attendu = 375 FCFA
  const resA = calculateProductCRU(
    {
      sellingPrice: 1000,
      packagingCost: 0,
      transportCost: 0,
      otherCosts: 0,
      ingredients: [{ rawMaterialId: 1, quantity: 250, unit: 'g' }]
    },
    materialsMap
  );
  if (Math.round(resA.rawMaterialsCost) !== 375) {
    throw new Error(`Scénario A: attendu 375 FCFA, reçu ${resA.rawMaterialsCost}`);
  }
  if (!resA.isComplete) throw new Error('Scénario A: devrait être complet');

  // --- Scénario B : Conversion de volume (L -> ml) ---
  // Achat 1800 FCFA/L, utilisation 100 ml -> Coût attendu = 180 FCFA
  const resB = calculateProductCRU(
    {
      sellingPrice: 500,
      packagingCost: 0,
      transportCost: 0,
      otherCosts: 0,
      ingredients: [{ rawMaterialId: 4, quantity: 100, unit: 'ml' }]
    },
    materialsMap
  );
  if (Math.round(resB.rawMaterialsCost) !== 180) {
    throw new Error(`Scénario B: attendu 180 FCFA, reçu ${resB.rawMaterialsCost}`);
  }
  if (!resB.isComplete) throw new Error('Scénario B: devrait être complet');

  // --- Scénario C : Unités identiques (kg -> kg) ---
  // Achat 1500 FCFA/kg, utilisation 0.5 kg -> Coût attendu = 750 FCFA
  const resC = calculateProductCRU(
    {
      sellingPrice: 1500,
      packagingCost: 0,
      transportCost: 0,
      otherCosts: 0,
      ingredients: [{ rawMaterialId: 1, quantity: 0.5, unit: 'kg' }]
    },
    materialsMap
  );
  if (Math.round(resC.rawMaterialsCost) !== 750) {
    throw new Error(`Scénario C: attendu 750 FCFA, reçu ${resC.rawMaterialsCost}`);
  }

  // --- Scénario D : Conversion inverse ---
  // Cas D1 : Matière achetée à 500 FCFA/kg (#7), recette exprimée en g (2 g) -> 2 * 0.001 * 500 = 1 FCFA
  const resD1 = calculateProductCRU(
    {
      sellingPrice: 50,
      packagingCost: 0,
      transportCost: 0,
      otherCosts: 0,
      ingredients: [{ rawMaterialId: 7, quantity: 2, unit: 'g' }]
    },
    materialsMap
  );
  if (Math.round(resD1.rawMaterialsCost) !== 1) {
    throw new Error(`Scénario D1: attendu 1 FCFA, reçu ${resD1.rawMaterialsCost}`);
  }

  // Cas D2 : Matière achetée à 500 FCFA/g (#6), recette exprimée en kg (0.002 kg = 2 g) -> 2 * 500 = 1000 FCFA
  const resD2 = calculateProductCRU(
    {
      sellingPrice: 2000,
      packagingCost: 0,
      transportCost: 0,
      otherCosts: 0,
      ingredients: [{ rawMaterialId: 6, quantity: 0.002, unit: 'kg' }]
    },
    materialsMap
  );
  if (Math.round(resD2.rawMaterialsCost) !== 1000) {
    throw new Error(`Scénario D2: attendu 1000 FCFA, reçu ${resD2.rawMaterialsCost}`);
  }

  // --- Scénario E : Unités incompatibles (kg vs L) ---
  const resE = calculateProductCRU(
    {
      sellingPrice: 1000,
      packagingCost: 0,
      transportCost: 0,
      otherCosts: 0,
      ingredients: [{ rawMaterialId: 1, quantity: 2, unit: 'L' }]
    },
    materialsMap
  );
  if (resE.isComplete) {
    throw new Error('Scénario E: une recette avec kg vs L ne doit PAS être marquée isComplete');
  }
  if (resE.grossMarginPercentage !== 0) {
    throw new Error('Scénario E: la marge d\'une recette incompatible ne doit pas être affichée (doit être 0)');
  }
  if (!resE.issues.some(i => i.code === 'INCOMPATIBLE_UNITS')) {
    throw new Error('Scénario E: doit contenir un issue INCOMPATIBLE_UNITS');
  }

  // --- Scénario F : Conditionnement non convertible (sac vs kg) ---
  const resF = calculateProductCRU(
    {
      sellingPrice: 1000,
      packagingCost: 0,
      transportCost: 0,
      otherCosts: 0,
      ingredients: [{ rawMaterialId: 5, quantity: 10, unit: 'kg' }]
    },
    materialsMap
  );
  if (resF.isComplete) {
    throw new Error('Scénario F: sac vs kg ne doit PAS être converti arbitrairement');
  }
  if (!resF.issues.some(i => i.code === 'INCOMPATIBLE_UNITS')) {
    throw new Error('Scénario F: doit contenir un issue INCOMPATIBLE_UNITS');
  }

  // --- Scénario G : Ancienne recette sans propriété unit ---
  const resG = calculateProductCRU(
    {
      sellingPrice: 1500,
      packagingCost: 0,
      transportCost: 0,
      otherCosts: 0,
      ingredients: [{ rawMaterialId: 1, quantity: 0.5 }]
    },
    materialsMap
  );
  if (!resG.isComplete) {
    throw new Error('Scénario G: ancienne recette sans unit doit être complète');
  }
  if (Math.round(resG.rawMaterialsCost) !== 750) {
    throw new Error(`Scénario G: attendu 750 FCFA, reçu ${resG.rawMaterialsCost}`);
  }

  // --- Scénario H : Données incomplètes et invalides ---
  // H1: Produit sans ingrédient
  const resH1 = calculateProductCRU(
    { sellingPrice: 500, packagingCost: 0, transportCost: 0, otherCosts: 0, ingredients: [] },
    materialsMap
  );
  if (resH1.isComplete || !resH1.issues.some(i => i.code === 'NO_INGREDIENTS')) {
    throw new Error('Scénario H1: aucun ingrédient doit être incomplet');
  }

  // H2: Référence d'ingrédient manquante
  const resH2 = calculateProductCRU(
    { sellingPrice: 500, packagingCost: 0, transportCost: 0, otherCosts: 0, ingredients: [{ rawMaterialId: 9999, quantity: 1 }] },
    materialsMap
  );
  if (resH2.isComplete || !resH2.issues.some(i => i.code === 'MISSING_MATERIAL')) {
    throw new Error('Scénario H2: matière manquante doit être incomplète');
  }

  // H3: Quantité nulle ou négative
  const resH3 = calculateProductCRU(
    { sellingPrice: 500, packagingCost: 0, transportCost: 0, otherCosts: 0, ingredients: [{ rawMaterialId: 1, quantity: 0 }] },
    materialsMap
  );
  if (resH3.isComplete || !resH3.issues.some(i => i.code === 'INVALID_QUANTITY')) {
    throw new Error('Scénario H3: quantité nulle doit être incomplète');
  }

  const resH4 = calculateProductCRU(
    { sellingPrice: 500, packagingCost: 0, transportCost: 0, otherCosts: 0, ingredients: [{ rawMaterialId: 1, quantity: -2 }] },
    materialsMap
  );
  if (resH4.isComplete || !resH4.issues.some(i => i.code === 'INVALID_QUANTITY')) {
    throw new Error('Scénario H4: quantité négative doit être incomplète');
  }

  // H5: Quantité NaN
  const resH5 = calculateProductCRU(
    { sellingPrice: 500, packagingCost: 0, transportCost: 0, otherCosts: 0, ingredients: [{ rawMaterialId: 1, quantity: NaN }] },
    materialsMap
  );
  if (resH5.isComplete || !resH5.issues.some(i => i.code === 'INVALID_QUANTITY')) {
    throw new Error('Scénario H5: quantité NaN doit être incomplète');
  }

  // --- Tests spécifiques : Prix de vente nul, négatif ou non fini ---
  // 1. Coûts valides + prix de vente nul (0)
  const resZeroPrice = calculateProductCRU(
    {
      sellingPrice: 0,
      packagingCost: 0,
      transportCost: 0,
      otherCosts: 0,
      ingredients: [{ rawMaterialId: 1, quantity: 250, unit: 'g' }] // 375 FCFA
    },
    materialsMap
  );
  if (!resZeroPrice.isComplete) {
    throw new Error('Test Prix 0: le coût de revient doit rester valide (isComplete: true)');
  }
  if (resZeroPrice.totalUnitCost !== 375) {
    throw new Error(`Test Prix 0: coût de fabrication attendu 375, reçu ${resZeroPrice.totalUnitCost}`);
  }
  if (resZeroPrice.hasReliableMargin) {
    throw new Error('Test Prix 0: hasReliableMargin doit être false pour un prix de vente nul');
  }
  if (resZeroPrice.grossMarginAmount !== 0 || resZeroPrice.grossMarginPercentage !== 0) {
    throw new Error('Test Prix 0: marge et gain doivent valoir 0 (aucune marge fictive ni division par zéro)');
  }

  // 2. Prix de vente négatif (-500)
  const resNegativePrice = calculateProductCRU(
    {
      sellingPrice: -500,
      packagingCost: 0,
      transportCost: 0,
      otherCosts: 0,
      ingredients: [{ rawMaterialId: 1, quantity: 250, unit: 'g' }]
    },
    materialsMap
  );
  if (!resNegativePrice.isComplete) {
    throw new Error('Test Prix négatif: le coût de revient doit rester valide si les ingrédients sont complets');
  }
  if (resNegativePrice.hasReliableMargin) {
    throw new Error('Test Prix négatif: hasReliableMargin doit être false');
  }
  if (resNegativePrice.grossMarginAmount !== 0 || resNegativePrice.grossMarginPercentage !== 0) {
    throw new Error('Test Prix négatif: aucune marge ne doit être présentée');
  }

  // 3. Prix de vente NaN ou non fini
  const resNaNPrice = calculateProductCRU(
    {
      sellingPrice: NaN,
      packagingCost: 0,
      transportCost: 0,
      otherCosts: 0,
      ingredients: [{ rawMaterialId: 1, quantity: 250, unit: 'g' }]
    },
    materialsMap
  );
  if (!resNaNPrice.isComplete) {
    throw new Error('Test Prix NaN: le coût de revient doit rester valide');
  }
  if (resNaNPrice.hasReliableMargin) {
    throw new Error('Test Prix NaN: hasReliableMargin doit être false');
  }
  if (resNaNPrice.grossMarginPercentage !== 0) {
    throw new Error('Test Prix NaN: la marge doit valoir 0');
  }

  // 4. Prix de vente positif + calcul complet
  const resValidPrice = calculateProductCRU(
    {
      sellingPrice: 1000,
      packagingCost: 0,
      transportCost: 0,
      otherCosts: 0,
      ingredients: [{ rawMaterialId: 1, quantity: 250, unit: 'g' }] // 375 FCFA
    },
    materialsMap
  );
  if (!resValidPrice.isComplete || !resValidPrice.hasReliableMargin) {
    throw new Error('Test Prix valide: doit être complet avec marge fiable');
  }
  if (resValidPrice.grossMarginAmount !== 625 || resValidPrice.grossMarginPercentage !== 62.5) {
    throw new Error(`Test Prix valide: gain attendu 625 (62.5%), reçu ${resValidPrice.grossMarginAmount} (${resValidPrice.grossMarginPercentage}%)`);
  }

  // 5. Recette réellement incomplète
  const resIncomplete = calculateProductCRU(
    {
      sellingPrice: 1000,
      packagingCost: 0,
      transportCost: 0,
      otherCosts: 0,
      ingredients: [{ rawMaterialId: 1, quantity: 0 }]
    },
    materialsMap
  );
  if (resIncomplete.isComplete || resIncomplete.hasReliableMargin) {
    throw new Error('Test Recette incomplète: isComplete et hasReliableMargin doivent être false');
  }

  console.log('✅ Calculation Service Tests (Scenarios A through H + Prix nul/invalide) Passed 100%!');
}
