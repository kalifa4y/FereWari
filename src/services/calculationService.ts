import { Product, RawMaterial } from '../db/db';

export interface DominantCostItem {
  name: string;
  cost: number;
  percentage: number;
  type: 'ingredient' | 'packaging' | 'transport' | 'other';
}

export interface CalculationBreakdown {
  rawMaterialsCost: number;
  packagingCost: number;
  transportCost: number;
  otherCosts: number;
  totalUnitCost: number; // CRU
  sellingPrice: number;
  grossMarginAmount: number;
  grossMarginPercentage: number;
  dominantCostItem: DominantCostItem;
  ingredientDetails: Array<{
    name: string;
    unit: string;
    unitCost: number;
    quantity: number;
    subtotal: number;
    percentageOfCRU: number;
  }>;
}

/**
 * Format a number as FCFA currency with French locale thousand separators.
 * e.g., 5000 -> "5 000 FCFA"
 */
export function formatFCFA(amount: number | undefined | null): string {
  if (amount === undefined || amount === null || isNaN(amount)) return '0 FCFA';
  const rounded = Math.round(amount);
  return new Intl.NumberFormat('fr-FR').format(rounded) + ' FCFA';
}

/**
 * Format a percentage with 1 decimal place.
 * e.g., 54.321 -> "54.3%"
 */
export function formatPercent(value: number): string {
  if (isNaN(value)) return '0%';
  return `${value.toFixed(1)}%`;
}

/**
 * Calculates complete unit cost (CRU), gross margin, and cost breakdowns for a product.
 */
export function calculateProductCRU(
  product: Pick<Product, 'packagingCost' | 'transportCost' | 'otherCosts' | 'ingredients' | 'sellingPrice'>,
  rawMaterialsMap: Map<number, RawMaterial>
): CalculationBreakdown {
  const packaging = Number(product.packagingCost) || 0;
  const transport = Number(product.transportCost) || 0;
  const other = Number(product.otherCosts) || 0;
  const selling = Number(product.sellingPrice) || 0;

  let rawMaterialsCost = 0;
  const ingredientDetails: CalculationBreakdown['ingredientDetails'] = [];

  // Breakdown items for dominant cost calculation
  const allCostElements: Array<{ name: string; cost: number; type: DominantCostItem['type'] }> = [];

  if (product.ingredients && Array.isArray(product.ingredients)) {
    for (const item of product.ingredients) {
      const material = rawMaterialsMap.get(item.rawMaterialId);
      const unitCost = material ? Number(material.unitCost) || 0 : 0;
      const quantity = Number(item.quantity) || 0;
      const subtotal = quantity * unitCost;

      rawMaterialsCost += subtotal;

      const name = material ? material.name : `Matière #${item.rawMaterialId}`;
      ingredientDetails.push({
        name,
        unit: material ? material.unit : 'u',
        unitCost,
        quantity,
        subtotal,
        percentageOfCRU: 0 // populated below
      });

      if (subtotal > 0) {
        allCostElements.push({
          name: material ? material.name : `Matière #${item.rawMaterialId}`,
          cost: subtotal,
          type: 'ingredient'
        });
      }
    }
  }

  if (packaging > 0) {
    allCostElements.push({ name: 'Emballage & Conditionnement', cost: packaging, type: 'packaging' });
  }
  if (transport > 0) {
    allCostElements.push({ name: 'Transport & Logistique', cost: transport, type: 'transport' });
  }
  if (other > 0) {
    allCostElements.push({ name: 'Autres Frais / Main d\'œuvre', cost: other, type: 'other' });
  }

  const totalUnitCost = rawMaterialsCost + packaging + transport + other;
  const grossMarginAmount = selling - totalUnitCost;
  const grossMarginPercentage = selling > 0 ? (grossMarginAmount / selling) * 100 : 0;

  // Calculate percentages for ingredient details
  ingredientDetails.forEach(item => {
    item.percentageOfCRU = totalUnitCost > 0 ? (item.subtotal / totalUnitCost) * 100 : 0;
  });

  // Find dominant cost item
  let dominantCostItem: DominantCostItem = {
    name: 'Aucun coût',
    cost: 0,
    percentage: 0,
    type: 'ingredient'
  };

  if (allCostElements.length > 0) {
    const highest = allCostElements.reduce((prev, current) => (current.cost > prev.cost ? current : prev), allCostElements[0]);
    dominantCostItem = {
      name: highest.name,
      cost: highest.cost,
      percentage: totalUnitCost > 0 ? (highest.cost / totalUnitCost) * 100 : 0,
      type: highest.type
    };
  }

  return {
    rawMaterialsCost,
    packagingCost: packaging,
    transportCost: transport,
    otherCosts: other,
    totalUnitCost,
    sellingPrice: selling,
    grossMarginAmount,
    grossMarginPercentage,
    dominantCostItem,
    ingredientDetails
  };
}
