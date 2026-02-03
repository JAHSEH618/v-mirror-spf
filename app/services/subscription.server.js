import prisma from "../db.server";

// Plan Constants
export const PLANS = {
    FREE: "Free Plan",
    PROFESSIONAL: "Professional Plan",
    ENTERPRISE: "Enterprise Plan",
    TRIAL: "Free Trial",
};

export const PLAN_LIMITS = {
    [PLANS.FREE]: 2,
    [PLANS.TRIAL]: 2,
    [PLANS.PROFESSIONAL]: 1000,
    [PLANS.ENTERPRISE]: 10000,
};

/**
 * Synchronizes the local database subscription state with Shopify's state.
 * This is the Single Source of Truth for subscription logic.
 *
 * @param {string} shop - The shop domain (e.g., 'my-shop.myshopify.com')
 * @param {Object|null} shopifySubscription - The subscription object from Shopify API
 * @param {boolean} forceUpdate - Whether to force an update even if state seems consistent
 * @returns {Promise<Object>} The updated or existing ShopSubscription record
 */
export async function syncSubscriptionState(shop, shopifySubscription, forceUpdate = false) {
    const now = new Date();

    // 1. Determine Expected State based on Shopify Data
    let expectedPlan = PLANS.FREE;
    let expectedStatus = "CANCELLED";
    let expectedLimit = PLAN_LIMITS[PLANS.FREE];
    let cycleEndDate = null;

    if (shopifySubscription && shopifySubscription.status === "ACTIVE") {
        const planName = shopifySubscription.name;
        expectedStatus = "ACTIVE";

        // Map Shopify Plan Name to Internal Plan
        if (planName.includes("Enterprise")) {
            expectedPlan = PLANS.ENTERPRISE;
        } else if (planName.includes("Professional")) {
            expectedPlan = PLANS.PROFESSIONAL;
        } else {
            // Fallback for custom or legacy plan names
            expectedPlan = planName;
        }

        // Set Limit based on mapped plan (Default to Professional limit if unknown paid plan)
        expectedLimit = PLAN_LIMITS[expectedPlan] || PLAN_LIMITS[PLANS.PROFESSIONAL];

        if (shopifySubscription.currentPeriodEnd) {
            cycleEndDate = new Date(shopifySubscription.currentPeriodEnd);
        }
    } else if (shopifySubscription && shopifySubscription.status === "FROZEN") {
        // Frozen: Keep previous plan but mark as Frozen
        expectedStatus = "FROZEN";
        // We need to fetch current DB state to know what to preserve, 
        // or pass it in. For now, we'll handle this by checking DB below.
    }

    // 2. Fetch Current DB State
    const currentDbSub = await prisma.shopSubscription.findUnique({
        where: { shopId: shop },
    });

    // DEV MODE FIX: Inspect for Mock Subscription Conflicts
    // If we are in Dev, and we have a local ACTIVE plan, but Shopify reports nothing (or Free),
    // we assume the user is using a Mock Upgrade and we should NOT downgrade them automatically.
    // eslint-disable-next-line no-undef
    const isDev = process.env.NODE_ENV === "development";
    if (isDev && currentDbSub?.status === "ACTIVE" && (!shopifySubscription || shopifySubscription.status !== "ACTIVE")) {
        console.log(`[Subscription Sync] Dev Mode: Preserving local '${currentDbSub.planName}' (Mock) against Shopify Check (Empty/Free).`);

        // Touch sync time to avoid re-checking immediately
        if (forceUpdate || !currentDbSub.lastSyncTime || (new Date() - currentDbSub.lastSyncTime > 1000 * 60 * 60)) {
            await prisma.shopSubscription.update({
                where: { shopId: shop },
                data: { lastSyncTime: now }
            });
        }
        return currentDbSub;
    }

    // Handle FROZEN state preservation logic
    if (expectedStatus === "FROZEN" && currentDbSub) {
        expectedPlan = currentDbSub.planName;
        expectedLimit = currentDbSub.usageLimit;
        cycleEndDate = currentDbSub.cycleEndDate;
    }

    // 3. Detect Drift (Differences between Expected and Actual)
    const isPlanChanged = currentDbSub?.planName !== expectedPlan;
    const isStatusChanged = currentDbSub?.status !== expectedStatus;
    const isLimitChanged = currentDbSub?.usageLimit !== expectedLimit;
    // Check date drift with tolerance (e.g., 1 minute) or straight equality if non-null
    const isDateChanged = cycleEndDate && currentDbSub?.cycleEndDate
        ? Math.abs(cycleEndDate.getTime() - currentDbSub.cycleEndDate.getTime()) > 60000
        : !!cycleEndDate !== !!currentDbSub?.cycleEndDate;

    const shouldUpdate = !currentDbSub || isPlanChanged || isStatusChanged || isLimitChanged || isDateChanged || forceUpdate;

    if (shouldUpdate) {
        console.log(`[Subscription Sync] Updating ${shop}: ${currentDbSub?.planName} -> ${expectedPlan} (${expectedStatus})`);

        // 4. Perform Update (Upsert)
        // Note: We do NOT reset usage here. Usage reset is a separate lifecycle event (monthly cycle).
        // Unless it's a new record.
        return await prisma.shopSubscription.upsert({
            where: { shopId: shop },
            update: {
                planName: expectedPlan,
                status: expectedStatus,
                usageLimit: expectedLimit,
                cycleEndDate: cycleEndDate || undefined, // Only update if we have a new date from Shopify
                lastSyncTime: now,
            },
            create: {
                shopId: shop,
                planName: expectedPlan,
                status: expectedStatus,
                usageLimit: expectedLimit,
                currentUsage: 0, // Start with 0 for new records
                cycleStartDate: now,
                cycleEndDate: cycleEndDate || new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000), // Default 30 days
                lastSyncTime: now,
            },
        });
    } else {
        // Just update sync time to prevent frequent checks
        await prisma.shopSubscription.update({
            where: { shopId: shop },
            data: { lastSyncTime: now }
        });
        return currentDbSub;
    }
}
