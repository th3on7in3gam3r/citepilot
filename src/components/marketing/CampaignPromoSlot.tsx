import { unstable_noStore as noStore } from "next/cache";
import { CampaignPromoBar } from "@/components/marketing/CampaignPromoBar";
import { getCampaignSnapshot } from "@/lib/campaign/config";

/**
 * Reads campaign env at request time so toggling CAMPAIGN_* on Render
 * does not wait on the parent page's ISR snapshot from build.
 */
export function CampaignPromoSlot() {
  noStore();
  const campaign = getCampaignSnapshot();
  return <CampaignPromoBar campaign={campaign} />;
}
