import type { Restaurant } from "../client/src/lib/data";

export type DeliveryFeeOverride = Partial<{
  deliveryFee: number;
  serviceFee: number;
  serviceFeePercent: number | null;
  serviceFeeMin: number | null;
  serviceFeeMax: number | null;
  smallOrderFee: number | null;
  smallOrderThreshold: number | null;
  dynamicSmallOrderFee: boolean;
  deliveryTime: number;
  available: boolean;
  deepLink: string;
}>;

export interface DeliveryFeeDataset {
  updatedAt: string;
  source?: string;
  fees: Record<string, Record<string, DeliveryFeeOverride>>;
}

export const EMPTY_DELIVERY_FEE_DATASET: DeliveryFeeDataset = {
  updatedAt: new Date(0).toISOString(),
  fees: {},
};

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function sanitizeOverride(input: DeliveryFeeOverride): DeliveryFeeOverride {
  const sanitized: DeliveryFeeOverride = {};

  if (isFiniteNumber(input.deliveryFee)) {
    sanitized.deliveryFee = input.deliveryFee;
  }
  if (isFiniteNumber(input.serviceFee)) {
    sanitized.serviceFee = input.serviceFee;
  }
  if (input.serviceFeePercent === null || isFiniteNumber(input.serviceFeePercent)) {
    sanitized.serviceFeePercent = input.serviceFeePercent;
  }
  if (input.serviceFeeMin === null || isFiniteNumber(input.serviceFeeMin)) {
    sanitized.serviceFeeMin = input.serviceFeeMin;
  }
  if (input.serviceFeeMax === null || isFiniteNumber(input.serviceFeeMax)) {
    sanitized.serviceFeeMax = input.serviceFeeMax;
  }
  if (input.smallOrderFee === null || isFiniteNumber(input.smallOrderFee)) {
    sanitized.smallOrderFee = input.smallOrderFee;
  }
  if (
    input.smallOrderThreshold === null ||
    isFiniteNumber(input.smallOrderThreshold)
  ) {
    sanitized.smallOrderThreshold = input.smallOrderThreshold;
  }
  if (typeof input.dynamicSmallOrderFee === "boolean") {
    sanitized.dynamicSmallOrderFee = input.dynamicSmallOrderFee;
  }
  if (isFiniteNumber(input.deliveryTime)) {
    sanitized.deliveryTime = input.deliveryTime;
  }
  if (typeof input.available === "boolean") {
    sanitized.available = input.available;
  }
  if (typeof input.deepLink === "string" && input.deepLink.trim()) {
    sanitized.deepLink = input.deepLink.trim();
  }

  return sanitized;
}

export function normalizeDeliveryFeeDataset(
  input: unknown
): DeliveryFeeDataset {
  if (!input || typeof input !== "object") {
    return { ...EMPTY_DELIVERY_FEE_DATASET };
  }

  const candidate = input as Partial<DeliveryFeeDataset>;
  const fees: DeliveryFeeDataset["fees"] = {};

  if (candidate.fees && typeof candidate.fees === "object") {
    for (const [restaurantId, platforms] of Object.entries(candidate.fees)) {
      if (!platforms || typeof platforms !== "object") {
        continue;
      }

      const sanitizedPlatforms: Record<string, DeliveryFeeOverride> = {};
      for (const [platformKey, override] of Object.entries(platforms)) {
        if (!override || typeof override !== "object") {
          continue;
        }

        const sanitized = sanitizeOverride(override as DeliveryFeeOverride);
        if (Object.keys(sanitized).length > 0) {
          sanitizedPlatforms[platformKey] = sanitized;
        }
      }

      if (Object.keys(sanitizedPlatforms).length > 0) {
        fees[restaurantId] = sanitizedPlatforms;
      }
    }
  }

  return {
    updatedAt:
      typeof candidate.updatedAt === "string" && candidate.updatedAt
        ? candidate.updatedAt
        : new Date().toISOString(),
    source:
      typeof candidate.source === "string" && candidate.source.trim()
        ? candidate.source.trim()
        : undefined,
    fees,
  };
}

export function applyDeliveryFeeOverrides(
  restaurants: Restaurant[],
  dataset: DeliveryFeeDataset
): Restaurant[] {
  return restaurants.map((restaurant) => {
    const restaurantOverrides = dataset.fees[restaurant.id];
    if (!restaurantOverrides) {
      return restaurant;
    }

    return {
      ...restaurant,
      platforms: restaurant.platforms.map((platformData) => {
        const override = restaurantOverrides[platformData.platform];
        if (!override) {
          return platformData;
        }

        const {
          smallOrderFee,
          smallOrderThreshold,
          ...restOverride
        } = override;

        return {
          ...platformData,
          ...restOverride,
          smallOrderFee:
            smallOrderFee === null
              ? undefined
              : smallOrderFee ?? platformData.smallOrderFee,
          smallOrderThreshold:
            smallOrderThreshold === null
              ? undefined
              : smallOrderThreshold ?? platformData.smallOrderThreshold,
        };
      }),
    };
  });
}
