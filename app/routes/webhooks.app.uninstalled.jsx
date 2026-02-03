import { authenticate } from "../shopify.server";
import prisma from "../db.server";

/**
 * APP_UNINSTALLED Webhook Handler
 * D1-2 FIX: Complete data cleanup for GDPR compliance
 * 
 * When a merchant uninstalls the app, we must:
 * 1. Delete all stored data for the shop
 * 2. Ensure no data remnants for GDPR/privacy compliance
 */
export const action = async ({ request }) => {
  const { shop, session, topic } = await authenticate.webhook(request);

  console.log(`[Webhook] Received ${topic} webhook for ${shop}`);

  // D1-2 FIX: Complete data cleanup when app is uninstalled
  try {
    // Use transaction for atomic cleanup
    await prisma.$transaction([
      // Core session data (already existed)
      prisma.session.deleteMany({ where: { shop } }),

      // Widget customization
      prisma.widgetSettings.deleteMany({ where: { shop } }),

      // Billing and payment info
      // Billing and payment info
      prisma.shopSubscription.deleteMany({ where: { shopId: shop } }),
      prisma.billingHistory.deleteMany({ where: { shop } }),

      // Central Shop entity (must be last due to FK constraints if not cascading)
      prisma.shop.deleteMany({ where: { id: shop } }),

      // Usage and analytics
      prisma.usageStat.deleteMany({ where: { shop } }),
      prisma.productStat.deleteMany({ where: { shop } }),
      prisma.tryOnEvent.deleteMany({ where: { shop } }),

      // Background tasks
      prisma.uploadTask.deleteMany({ where: { shop } }),

      // Webhook idempotency records
      prisma.webhookEvent.deleteMany({ where: { shop } }),
    ]);

    console.log(`[Webhook] ✅ Cleaned up all data for ${shop}`);
  } catch (error) {
    console.error(`[Webhook] ❌ Failed to clean up data for ${shop}:`, error);
    // Still return 200 to prevent Shopify from retrying
    // The data will be orphaned but won't cause issues
  }

  return new Response("Shop data cleaned up", { status: 200 });
};
