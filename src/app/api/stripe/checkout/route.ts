import { NextResponse } from "next/server";
import { POST as billingCheckoutPost } from "@/app/api/billing/checkout/route";

export const runtime = "nodejs";

export async function POST(request: Request) {
  return billingCheckoutPost(request);
}
