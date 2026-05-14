import fs from "node:fs/promises";
import path from "node:path";
import {
  EMPTY_DELIVERY_FEE_DATASET,
  normalizeDeliveryFeeDataset,
  type DeliveryFeeDataset,
} from "../shared/delivery-fees";

const DATA_DIR = path.resolve(process.cwd(), "data");
const DELIVERY_FEES_FILE = path.join(DATA_DIR, "delivery-fees.json");

async function ensureDataDir() {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

export async function readDeliveryFeeDataset(): Promise<DeliveryFeeDataset> {
  try {
    const raw = await fs.readFile(DELIVERY_FEES_FILE, "utf8");
    return normalizeDeliveryFeeDataset(JSON.parse(raw));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return { ...EMPTY_DELIVERY_FEE_DATASET };
    }
    throw error;
  }
}

export async function writeDeliveryFeeDataset(
  dataset: DeliveryFeeDataset
): Promise<void> {
  await ensureDataDir();
  const normalized = normalizeDeliveryFeeDataset(dataset);
  await fs.writeFile(
    DELIVERY_FEES_FILE,
    JSON.stringify(normalized, null, 2),
    "utf8"
  );
}

export async function syncDeliveryFeesFromUrl(sourceUrl: string) {
  const response = await fetch(sourceUrl, {
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error(`Fee source responded with ${response.status}`);
  }

  const payload = normalizeDeliveryFeeDataset(await response.json());
  payload.updatedAt = new Date().toISOString();
  payload.source = sourceUrl;
  await writeDeliveryFeeDataset(payload);
  return payload;
}
