import { calculateProductCRU, formatFCFA } from './calculationService';
import { RawMaterial } from '../db/db';

export function runCalculationTests() {
  console.log('🧪 Running Calculation Service Tests...');

  const materialsMap = new Map<number, RawMaterial>([
    [1, { id: 1, name: "Fleurs d'Hibiscus", unit: "kg", unitCost: 1500, stockQty: 20, updatedAt: new Date() }],
    [2, { id: 2, name: "Sucre cristal", unit: "kg", unitCost: 650, stockQty: 50, updatedAt: new Date() }],
    [3, { id: 3, name: "Feuilles de Menthe", unit: "kg", unitCost: 1200, stockQty: 5, updatedAt: new Date() }]
  ]);

  // Test 1: Jus de Bissap 33cl recipe
  // 0.05kg * 1500 = 75 FCFA
  // 0.04kg * 650 = 26 FCFA
  // 0.01kg * 1200 = 12 FCFA
  // Raw materials = 113 FCFA
  // Packaging = 120 FCFA
  // Transport = 35 FCFA
  // Other = 40 FCFA
  // Total CRU = 308 FCFA
  // Selling price = 700 FCFA -> Margin = 392 FCFA (56.0%)
  const breakdown = calculateProductCRU(
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

  if (Math.round(breakdown.rawMaterialsCost) !== 113) {
    throw new Error(`Expected rawMaterialsCost to be 113, got ${breakdown.rawMaterialsCost}`);
  }
  if (Math.round(breakdown.totalUnitCost) !== 308) {
    throw new Error(`Expected totalUnitCost to be 308, got ${breakdown.totalUnitCost}`);
  }
  if (Math.round(breakdown.grossMarginAmount) !== 392) {
    throw new Error(`Expected grossMarginAmount to be 392, got ${breakdown.grossMarginAmount}`);
  }
  if (Math.round(breakdown.grossMarginPercentage * 10) / 10 !== 56.0) {
    throw new Error(`Expected grossMarginPercentage to be 56.0%, got ${breakdown.grossMarginPercentage}`);
  }

  // Dominant cost in this recipe is Packaging (120 FCFA)
  if (breakdown.dominantCostItem.name !== 'Emballage & Conditionnement' || breakdown.dominantCostItem.cost !== 120) {
    throw new Error(`Expected dominant cost to be Emballage (120), got ${JSON.stringify(breakdown.dominantCostItem)}`);
  }

  // Test 2: FCFA Currency Formatting
  const formatted5000 = formatFCFA(5000);
  if (!formatted5000.includes('5') || !formatted5000.includes('FCFA')) {
    throw new Error(`Invalid formatFCFA result: ${formatted5000}`);
  }

  console.log('✅ Calculation Service Tests Passed!');
}
