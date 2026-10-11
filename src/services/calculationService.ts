import { Product, RawMaterial } from '../db/db';

export interface DominantCostItem {
  name: string;
  cost: number;
  percentage: number;
  type: 'ingredient' | 'packaging' | 'transport' | 'other';
}

export type CalculationIssueCode =
  | 'NO_INGREDIENTS'
  | 'MISSING_MATERIAL'
  | 'INVALID_QUANTITY'
  | 'INVALID_PRICE'
  | 'INCOMPATIBLE_UNITS'
  | 'NON_FINITE_VALUE';

export interface CalculationIssue {
  code: CalculationIssueCode;
  message: string;
  rawMaterialId?: number;
  ingredientIndex?: number;
}

export interface IngredientCalculationDetail {
  name: string;
  unit: string;
  purchaseUnit: string;
  unitCost: number;
  quantity: number;
  convertedQuantity: number;
  subtotal: number;
  percentageOfCRU: number;
  isValid: boolean;
  error?: string;
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
  ingredientDetails: IngredientCalculationDetail[];
  /** Indique si le coût de fabrication est complet et fiable (ingrédients valides, unités compatibles, frais finis) */
  isComplete: boolean;
  /** Indique si une marge et un gain fiables sont disponibles (coût complet et prix de vente strictement positif) */
  hasReliableMargin: boolean;
  /** Liste des anomalies identifiées */
  issues: CalculationIssue[];
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
 * Normalise les unités standard connues (casse et variations courantes).
 * Conserve fidèlement les unités personnalisées sans approximation arbitraire.
 */
export function normalizeUnit(unit: string | undefined | null): string {
  if (!unit) return '';
  const trimmed = unit.trim();
  const lower = trimmed.toLowerCase();

  // Masse
  if (lower === 'kg' || lower === 'kilo' || lower === 'kilogramme' || lower === 'kilogrammes') {
    return 'kg';
  }
  if (lower === 'g' || lower === 'gr' || lower === 'gramme' || lower === 'grammes') {
    return 'g';
  }

  // Volume
  if (lower === 'l' || lower === 'litre' || lower === 'litres') {
    return 'L';
  }
  if (lower === 'ml' || lower === 'millilitre' || lower === 'millilitres') {
    return 'ml';
  }

  // Pièces / Conditionnements standards
  if (
    lower === 'unité' ||
    lower === 'unite' ||
    lower === 'u' ||
    lower === 'pièce' ||
    lower === 'piece' ||
    lower === 'pièces' ||
    lower === 'pieces'
  ) {
    return 'unité';
  }
  if (lower === 'sac' || lower === 'sacs') {
    return 'sac';
  }
  if (lower === 'paquet' || lower === 'paquets') {
    return 'paquet';
  }

  // Unités personnalisées (ex: 'bidon', 'bouteille', 'carton')
  return trimmed;
}

/**
 * Calcule le facteur multiplicateur pour convertir une quantité exprimée en `fromUnit`
 * vers l'unité de référence `toUnit` (ex: unité d'achat).
 *
 * Retourne le facteur numérique (ex: 0.001 pour g -> kg), ou null si les unités sont incompatibles.
 */
export function getConversionFactor(
  fromUnit: string | undefined | null,
  toUnit: string | undefined | null
): number | null {
  if (!fromUnit || !toUnit) return null;
  const normFrom = normalizeUnit(fromUnit);
  const normTo = normalizeUnit(toUnit);

  // Unités identiques (y compris unités personnalisées insensibles à la casse)
  if (normFrom.toLowerCase() === normTo.toLowerCase()) {
    return 1;
  }

  // Conversions Masse
  if (normFrom === 'g' && normTo === 'kg') return 0.001;
  if (normFrom === 'kg' && normTo === 'g') return 1000;

  // Conversions Volume
  if (normFrom === 'ml' && normTo === 'L') return 0.001;
  if (normFrom === 'L' && normTo === 'ml') return 1000;

  // Aucune autre conversion arbitraire
  return null;
}

/**
 * Retourne la liste des unités compatibles avec l'unité d'achat donnée.
 * Pour la masse : kg et g.
 * Pour le volume : L et ml.
 * Pour les autres : l'unité d'achat elle-même uniquement.
 */
export function getCompatibleUnits(
  purchaseUnit: string | undefined | null
): Array<{ value: string; label: string }> {
  const norm = normalizeUnit(purchaseUnit);

  if (norm === 'kg' || norm === 'g') {
    return [
      { value: 'kg', label: 'Kilogramme (kg)' },
      { value: 'g', label: 'Gramme (g)' }
    ];
  }

  if (norm === 'L' || norm === 'ml') {
    return [
      { value: 'L', label: 'Litre (L)' },
      { value: 'ml', label: 'Millilitre (ml)' }
    ];
  }

  const raw = purchaseUnit?.trim() || 'unité';
  return [{ value: raw, label: raw }];
}

/**
 * Calculates complete unit cost (CRU), gross margin, and cost breakdowns for a product.
 * Source unique de vérité pour les calculs de coûts et conversions d'unités de FereWari.
 */
export function calculateProductCRU(
  product: Pick<Product, 'packagingCost' | 'transportCost' | 'otherCosts' | 'ingredients' | 'sellingPrice'>,
  rawMaterialsMap: Map<number, RawMaterial>
): CalculationBreakdown {
  const issues: CalculationIssue[] = [];

  const rawPackaging = Number(product.packagingCost) || 0;
  const rawTransport = Number(product.transportCost) || 0;
  const rawOther = Number(product.otherCosts) || 0;
  const rawSelling = Number(product.sellingPrice) || 0;

  // Validation des frais et prix
  const isPackagingValid = Number.isFinite(rawPackaging) && rawPackaging >= 0;
  const isTransportValid = Number.isFinite(rawTransport) && rawTransport >= 0;
  const isOtherValid = Number.isFinite(rawOther) && rawOther >= 0;
  const isSellingValid = Number.isFinite(rawSelling) && rawSelling >= 0;

  if (!isPackagingValid) issues.push({ code: 'INVALID_PRICE', message: 'Frais d\'emballage invalides ou négatifs' });
  if (!isTransportValid) issues.push({ code: 'INVALID_PRICE', message: 'Frais de transport invalides ou négatifs' });
  if (!isOtherValid) issues.push({ code: 'INVALID_PRICE', message: 'Autres frais invalides ou négatifs' });
  if (!isSellingValid) issues.push({ code: 'INVALID_PRICE', message: 'Prix de vente invalide ou négatif' });

  const packaging = isPackagingValid ? rawPackaging : 0;
  const transport = isTransportValid ? rawTransport : 0;
  const other = isOtherValid ? rawOther : 0;
  const selling = isSellingValid ? rawSelling : 0;

  let rawMaterialsCost = 0;
  let allIngredientsValid = true;
  const ingredientDetails: CalculationBreakdown['ingredientDetails'] = [];
  const allCostElements: Array<{ name: string; cost: number; type: DominantCostItem['type'] }> = [];

  const ingredientsList = product.ingredients;
  const hasIngredients = Array.isArray(ingredientsList) && ingredientsList.length > 0;

  if (!hasIngredients) {
    issues.push({ code: 'NO_INGREDIENTS', message: 'Aucun ingrédient associé à ce produit' });
  } else {
    ingredientsList.forEach((item, index) => {
      const material = rawMaterialsMap.get(item.rawMaterialId);
      const rawQty = Number(item.quantity);
      const isQtyValid = Number.isFinite(rawQty) && rawQty > 0;

      if (!material) {
        allIngredientsValid = false;
        issues.push({
          code: 'MISSING_MATERIAL',
          message: `Matière première #${item.rawMaterialId} introuvable`,
          rawMaterialId: item.rawMaterialId,
          ingredientIndex: index
        });
        ingredientDetails.push({
          name: `Matière #${item.rawMaterialId}`,
          unit: item.unit || 'u',
          purchaseUnit: 'u',
          unitCost: 0,
          quantity: isQtyValid ? rawQty : 0,
          convertedQuantity: 0,
          subtotal: 0,
          percentageOfCRU: 0,
          isValid: false,
          error: 'Matière introuvable'
        });
        return;
      }

      const purchaseUnit = material.unit || 'unité';
      // Règle rétrocompatible : si item.unit est absent, interpréter dans l'unité d'achat
      const recipeUnit = item.unit && item.unit.trim() !== '' ? item.unit.trim() : purchaseUnit;

      const unitCost = Number(material.unitCost);
      const isUnitCostValid = Number.isFinite(unitCost) && unitCost >= 0;

      if (!isUnitCostValid) {
        allIngredientsValid = false;
        issues.push({
          code: 'INVALID_PRICE',
          message: `Prix d'achat invalide pour "${material.name}"`,
          rawMaterialId: material.id,
          ingredientIndex: index
        });
      }

      if (!isQtyValid) {
        allIngredientsValid = false;
        issues.push({
          code: 'INVALID_QUANTITY',
          message: `Quantité invalide ou nulle pour "${material.name}" (doit être > 0)`,
          rawMaterialId: material.id,
          ingredientIndex: index
        });
      }

      const factor = getConversionFactor(recipeUnit, purchaseUnit);
      const areUnitsCompatible = factor !== null;

      if (!areUnitsCompatible) {
        allIngredientsValid = false;
        issues.push({
          code: 'INCOMPATIBLE_UNITS',
          message: `Unité incompatible pour "${material.name}" (${recipeUnit} vs ${purchaseUnit})`,
          rawMaterialId: material.id,
          ingredientIndex: index
        });
      }

      let lineValid = isQtyValid && isUnitCostValid && areUnitsCompatible;
      let subtotal = 0;
      let convertedQty = 0;

      if (lineValid && factor !== null) {
        convertedQty = rawQty * factor;
        subtotal = convertedQty * unitCost;

        if (!Number.isFinite(subtotal) || subtotal < 0) {
          allIngredientsValid = false;
          lineValid = false;
          issues.push({
            code: 'NON_FINITE_VALUE',
            message: `Calcul non fini pour "${material.name}"`,
            rawMaterialId: material.id,
            ingredientIndex: index
          });
          subtotal = 0;
        } else {
          rawMaterialsCost += subtotal;
          if (subtotal > 0) {
            allCostElements.push({
              name: material.name,
              cost: subtotal,
              type: 'ingredient'
            });
          }
        }
      }

      ingredientDetails.push({
        name: material.name,
        unit: recipeUnit,
        purchaseUnit,
        unitCost: isUnitCostValid ? unitCost : 0,
        quantity: isQtyValid ? rawQty : 0,
        convertedQuantity: convertedQty,
        subtotal,
        percentageOfCRU: 0,
        isValid: lineValid,
        error: !isQtyValid
          ? 'Quantité invalide (doit être > 0)'
          : !areUnitsCompatible
          ? `Incompatible avec ${purchaseUnit}`
          : !isUnitCostValid
          ? 'Prix d\'achat invalide'
          : undefined
      });
    });
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

  const rawTotalCost = rawMaterialsCost + packaging + transport + other;
  const isTotalFinite = Number.isFinite(rawTotalCost) && rawTotalCost >= 0;
  const totalUnitCost = isTotalFinite ? rawTotalCost : 0;

  // Une recette a un coût de fabrication complet et valide si elle a des ingrédients, qu'ils sont tous valides, que les frais annexes sont valides et le coût fini
  const isComplete =
    hasIngredients &&
    allIngredientsValid &&
    isPackagingValid &&
    isTransportValid &&
    isOtherValid &&
    isTotalFinite;

  // La marge et le gain ne sont fiables que si le coût est complet ET que le prix de vente est strictement positif (> 0)
  const hasReliableMargin = isComplete && isSellingValid && selling > 0;

  // Calcul du gain et de la marge (uniquement si hasReliableMargin est vrai)
  let grossMarginAmount = 0;
  let grossMarginPercentage = 0;

  if (hasReliableMargin) {
    grossMarginAmount = selling - totalUnitCost;
    grossMarginPercentage = (grossMarginAmount / selling) * 100;
  }

  // Pourcentages dans les détails d'ingrédients
  ingredientDetails.forEach(item => {
    item.percentageOfCRU = totalUnitCost > 0 && item.isValid ? (item.subtotal / totalUnitCost) * 100 : 0;
  });

  // Poste de coût dominant
  let dominantCostItem: DominantCostItem = {
    name: 'Aucun coût',
    cost: 0,
    percentage: 0,
    type: 'ingredient'
  };

  if (isComplete && allCostElements.length > 0) {
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
    ingredientDetails,
    isComplete,
    hasReliableMargin,
    issues
  };
}
