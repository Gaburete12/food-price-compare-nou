import {
  syncDeliveryFeesFromUrl,
  writeDeliveryFeeDataset,
} from "../server/deliveryFeeStore";
import { EMPTY_DELIVERY_FEE_DATASET } from "../shared/delivery-fees";

async function main() {
  const sourceUrl = process.env.DELIVERY_FEES_SOURCE_URL;

  if (!sourceUrl) {
    await writeDeliveryFeeDataset({
      ...EMPTY_DELIVERY_FEE_DATASET,
      updatedAt: new Date().toISOString(),
      source: "empty-reset",
    });
    console.log("No DELIVERY_FEES_SOURCE_URL set; dataset reset to empty.");
    return;
  }

  const dataset = await syncDeliveryFeesFromUrl(sourceUrl);
  console.log(
    `Delivery fees synced from ${dataset.source} at ${dataset.updatedAt}.`
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
