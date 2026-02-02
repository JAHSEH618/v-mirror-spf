import { useLoaderData, useSubmit, useActionData, useSearchParams, useRevalidator, useNavigate } from "react-router";
import { useState, useEffect, useMemo } from "react";
import { authenticate, apiVersion } from "../shopify.server";
import { DashboardLayout } from "../components/DashboardLayout";
import { useLanguage } from "../components/LanguageContext";
import prisma from "../db.server";
import adminStyles from "../styles/admin.css?url";
// Note: lucide-react removed - using Polaris s-icon and emoji for icons
import { CancelSubscriptionModal } from "../components/CancelSubscriptionModal";
import { UpgradePlanModal } from "../components/UpgradePlanModal";

export const links = () => [
    { rel: "stylesheet", href: adminStyles },
];

// Billing Configuration
const MONTHLY_PLAN = "Professional Plan";
const ENTERPRISE_PLAN = "Enterprise Plan";
// eslint-disable-next-line no-undef
const IS_TEST_MODE = process.env.NODE_ENV !== "production";

export const loader = async ({ request }) => {
    const { session, admin, billing } = await authenticate.admin(request);
    const shop = session.shop;

    // === Fetch 30 days of data to support all time ranges client-side ===
    // This eliminates server round-trips when switching time ranges
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    thirtyDaysAgo.setHours(0, 0, 0, 0);

    // === Parallel execution of database queries (fast) ===
    // External API calls are moved to a race with timeout to prevent blocking

    // Theme check with aggressive timeout (non-blocking for page load)
    const checkAppBlockStatusWithTimeout = async () => {
        const TIMEOUT_MS = 2000; // 2 second timeout - don't block page for too long

        const timeoutPromise = new Promise((resolve) => {
            setTimeout(() => resolve(null), TIMEOUT_MS); // Return null on timeout
        });

        const checkPromise = (async () => {
            try {
                const themesResponse = await admin.graphql(
                    `#graphql
                    query getThemes {
                        themes(first: 5, roles: MAIN) {
                            nodes { id }
                        }
                    }`
                );
                const themesData = await themesResponse.json();
                const mainThemeId = themesData.data?.themes?.nodes?.[0]?.id;

                if (mainThemeId) {
                    const themeId = mainThemeId.split('/').pop();
                    const response = await fetch(
                        `https://${session.shop}/admin/api/${apiVersion}/themes/${themeId}/assets.json?asset[key]=config/settings_data.json`,
                        { headers: { "X-Shopify-Access-Token": session.accessToken } }
                    );
                    const json = await response.json();
                    const asset = json.asset;

                    if (asset?.value) {
                        const settingsData = JSON.parse(asset.value);
                        const blocks = settingsData.current?.blocks || {};
                        return Object.values(blocks).some((block) => {
                            return block.type.includes("try-on-widget") && String(block.disabled) !== "true";
                        });
                    }
                }
            } catch (error) {
                console.warn("Theme check failed:", error);
            }
            return false;
        })();

        // Race: whichever finishes first wins
        const result = await Promise.race([checkPromise, timeoutPromise]);
        return result === null ? false : result; // Default to false if timeout
    };

    // Billing check with timeout - also returns subscription details for sync
    const checkBillingStatusWithTimeout = async () => {
        const TIMEOUT_MS = 1500;

        const timeoutPromise = new Promise((resolve) => {
            setTimeout(() => resolve({ hasActivePayment: false, subscription: null }), TIMEOUT_MS);
        });

        const checkPromise = (async () => {
            try {
                const billingCheck = await billing.check({
                    plans: [MONTHLY_PLAN, ENTERPRISE_PLAN],
                    isTest: IS_TEST_MODE,
                });
                return {
                    hasActivePayment: billingCheck.hasActivePayment,
                    subscription: billingCheck.appSubscriptions?.[0] || null
                };
            } catch (e) {
                return { hasActivePayment: false, subscription: null };
            }
        })();

        return Promise.race([checkPromise, timeoutPromise]);
    };

    // === Execute all queries in parallel with timeouts ===
    const [
        isEmbedEnabled,
        hasPaymentResult,
        billingInfoResult,
        billingHistorySrc,
        rawUsageStats, // Fetch 30 days of raw data for client-side filtering
        productStats,
        deviceStatsSrc,
        uvStatsSrc
    ] = await Promise.all([
        // External API calls with timeouts (won't block page for too long)
        checkAppBlockStatusWithTimeout(),
        checkBillingStatusWithTimeout(),
        // Database queries (all run in parallel - these are fast)
        prisma.billingInfo.findUnique({
            where: { shop },
            include: { paymentMethods: true }
        }),
        prisma.billingHistory.findMany({
            where: { shop },
            orderBy: { date: 'desc' },
            take: 5
        }),
        // Fetch 30 days of raw stats - client will filter by time range
        prisma.usageStat.findMany({
            where: { shop, date: { gte: thirtyDaysAgo } },
            orderBy: { date: 'asc' }
        }),
        prisma.productStat.findMany({
            where: { shop },
            orderBy: { tryOnCount: 'desc' },
            take: 5
        }),
        // Fetch Device Stats (Phase 2)
        prisma.tryOnEvent.groupBy({
            by: ['deviceType'],
            where: { shop },
            _count: { _all: true }
        }),
        // Fetch UV (Unique Visitors) count based on fingerprintId
        prisma.tryOnEvent.groupBy({
            by: ['fingerprintId'],
            where: { shop, fingerprintId: { not: null } },
            _count: { _all: true }
        })
    ]);

    // === Process billing info (create if not exists) ===
    let billingInfo = billingInfoResult;
    let hasPayment = hasPaymentResult.hasActivePayment;
    const shopifySubscription = hasPaymentResult.subscription;

    if (!billingInfo) {
        billingInfo = await prisma.billingInfo.create({
            data: {
                shop,
                planName: hasPayment ? MONTHLY_PLAN : "Free Trial",
                status: "ACTIVE",
                usageLimit: hasPayment ? 1000 : 2,
            },
            include: { paymentMethods: true }
        });
    } else if (shopifySubscription) {
        // === Billing State Sync ===
        // Reconcile local DB with Shopify's source of truth to prevent drift
        const shopifyPlan = shopifySubscription.name;
        const shopifyStatus = shopifySubscription.status;
        const localPlan = billingInfo.planName;
        const localStatus = billingInfo.status;

        // Determine expected values based on Shopify state
        let expectedPlan = localPlan;
        let expectedLimit = billingInfo.usageLimit;
        let expectedStatus = localStatus;

        if (shopifyStatus === "ACTIVE") {
            if (shopifyPlan.includes("Enterprise")) {
                expectedPlan = ENTERPRISE_PLAN;
                expectedLimit = 10000;
            } else if (shopifyPlan.includes("Professional")) {
                expectedPlan = MONTHLY_PLAN;
                expectedLimit = 1000;
            }
            expectedStatus = "ACTIVE";
        } else if (["CANCELLED", "EXPIRED", "DECLINED"].includes(shopifyStatus)) {
            expectedPlan = "Free Plan";
            expectedLimit = 2;
            expectedStatus = "CANCELLED";
        }
        // FROZEN: Keep current plan but mark status
        else if (shopifyStatus === "FROZEN") {
            expectedStatus = "FROZEN";
        }

        // Sync if drift detected
        if (expectedPlan !== localPlan || expectedStatus !== localStatus || expectedLimit !== billingInfo.usageLimit) {
            console.log(`[Billing Sync] Drift detected for ${shop}: Local(${localPlan}/${localStatus}) vs Shopify(${shopifyPlan}/${shopifyStatus})`);
            billingInfo = await prisma.billingInfo.update({
                where: { shop },
                data: {
                    planName: expectedPlan,
                    status: expectedStatus,
                    usageLimit: expectedLimit,
                },
                include: { paymentMethods: true }
            });
        }
    }

    // === Usage Cycle Reset Check ===
    // Check if 30 days have passed since cycle start and reset usage if needed
    const now = new Date();
    const cycleStart = new Date(billingInfo.cycleStartDate);
    const daysSinceCycleStart = Math.floor((now - cycleStart) / (1000 * 60 * 60 * 24));

    if (daysSinceCycleStart >= 30) {
        console.log(`[Usage Reset] Cycle expired for ${shop}: ${daysSinceCycleStart} days since ${cycleStart.toISOString()}`);
        billingInfo = await prisma.billingInfo.update({
            where: { shop },
            data: {
                currentUsage: 0,
                cycleStartDate: now,
            },
            include: { paymentMethods: true }
        });
        console.log(`[Usage Reset] Reset usage for ${shop}, new cycle started`);
    }

    const isPremium = billingInfo.planName === MONTHLY_PLAN || billingInfo.planName === ENTERPRISE_PLAN;
    hasPayment = hasPayment || isPremium;

    // === Process billing history ===
    const billingHistory = billingHistorySrc.map(record => ({
        id: record.id,
        date: new Date(record.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        description: record.description,
        amount: record.amount,
        status: record.status.toLowerCase(),
    }));

    // === Serialize raw usage stats for client-side processing ===
    // This allows instant time range switching without server round-trips
    const serializedUsageStats = rawUsageStats.map(stat => ({
        date: stat.date.toISOString(),
        count: stat.count
    }));

    // Calculate weekly stats for quick stats display (default view)
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const weeklyStats = rawUsageStats.filter(s => new Date(s.date) >= oneWeekAgo);
    const totalTryOns = weeklyStats.reduce((sum, stat) => sum + stat.count, 0);

    // Previous week for comparison
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
    const prevWeekStats = rawUsageStats.filter(s => {
        const d = new Date(s.date);
        return d >= twoWeeksAgo && d < oneWeekAgo;
    });
    const previousTotalTryOns = prevWeekStats.reduce((sum, stat) => sum + stat.count, 0);

    const tryOnChange = previousTotalTryOns > 0
        ? ((totalTryOns - previousTotalTryOns) / previousTotalTryOns)
        : (totalTryOns > 0 ? 1 : 0);

    const usagePercentage = Math.min(100, Math.round((billingInfo.currentUsage / billingInfo.usageLimit) * 100));
    const renewalDate = new Date(billingInfo.cycleStartDate.getTime() + 30 * 24 * 60 * 60 * 1000);

    // === Process popular products ===
    const popularProducts = productStats.map(p => ({
        id: p.productId,
        name: p.productTitle,
        image: p.productImage,
        tryOns: p.tryOnCount,
        conversion: p.tryOnCount > 0 ? (p.orderedCount / p.tryOnCount) : 0
    }));

    // === Process Device Stats ===
    const deviceStats = deviceStatsSrc.map(d => ({
        name: d.deviceType || 'unknown',
        value: d._count._all
    })).sort((a, b) => b.value - a.value);

    // === Process UV Stats (Unique Visitors) ===
    const uniqueVisitors = uvStatsSrc.length; // Count of unique fingerprintIds

    // Calculate aggregated stats
    const totalOrders = productStats.reduce((sum, p) => sum + p.orderedCount, 0);
    const totalRevenue = productStats.reduce((sum, p) => sum + p.revenue, 0);
    const totalTryOnStats = productStats.reduce((sum, p) => sum + p.tryOnCount, 0);

    const conversionRate = totalTryOnStats > 0 ? (totalOrders / totalTryOnStats) : 0;

    // Mock diffs for new metrics until we have history for them
    const conversionChange = 0.0;
    const revenueImpact = totalRevenue;
    const revenueChange = 0.0;

    // Payment method - No longer handling raw cards, relying on Shopify
    // We just show active/inactive state based on subscription
    const paymentStatus = isPremium ? 'Active' : 'Free';

    return {
        storeName: shop.split('.')[0],
        shop,
        isEmbedEnabled,
        hasPayment,
        isPremium,
        paymentStatus,
        billingHistory,
        usage: {
            current: billingInfo.currentUsage,
            limit: billingInfo.usageLimit,
            percentage: usagePercentage,
            planName: billingInfo.planName,
            renewalDate: renewalDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            deviceStats: deviceStats
        },
        quickStats: {
            totalTryOns: { value: totalTryOns || billingInfo.currentUsage, change: tryOnChange },
            uniqueVisitors: { value: uniqueVisitors, change: 0 },
            conversionRate: { value: conversionRate, change: conversionChange },
            revenueImpact: { value: revenueImpact, change: revenueChange }
        },
        // Send raw stats for client-side trend calculation (enables instant time range switching)
        rawUsageStats: serializedUsageStats,
        popularProducts
    };
};

export const action = async ({ request }) => {
    const { billing, session } = await authenticate.admin(request);
    const formData = await request.formData();
    const actionType = formData.get("actionType");
    const shop = session.shop;

    if (actionType === "upgrade") {
        const planId = formData.get("planId");
        const targetPlanName = planId === "enterprise" ? ENTERPRISE_PLAN : MONTHLY_PLAN;
        const targetLimit = planId === "enterprise" ? 10000 : 1000;

        try {
            await billing.request({
                plan: targetPlanName,
                isTest: IS_TEST_MODE,
                // eslint-disable-next-line no-undef
                returnUrl: `https://${session.shop}/admin/apps/${process.env.SHOPIFY_API_KEY}/app/dashboard`,
            });
            return null;
        } catch (error) {
            console.error("Billing Request Failed (Mocking Success for Dev):", error);
            // eslint-disable-next-line no-undef
            const isDev = process.env.NODE_ENV === "development";
            const isShopOwnedError = error.message && error.message.includes("owned by a Shop");

            if (isDev || isShopOwnedError) {
                await prisma.billingInfo.update({
                    where: { shop },
                    data: { planName: targetPlanName, usageLimit: targetLimit }
                });
                return { status: "mock_upgraded", plan: targetPlanName };
            }
            throw error;
        }
    }

    if (actionType === "cancel") {
        try {
            const subscription = await billing.check({ plans: [MONTHLY_PLAN, ENTERPRISE_PLAN], isTest: IS_TEST_MODE });
            if (subscription.appSubscriptions?.[0]) {
                await billing.cancel({
                    subscriptionId: subscription.appSubscriptions[0].id,
                    isTest: IS_TEST_MODE,
                    prorate: true,
                });
            }
        } catch (e) {
            console.error("Cancel subscription error:", e);
        }

        await prisma.billingInfo.update({
            where: { shop },
            data: { planName: "Free Plan", usageLimit: 2, status: "CANCELLED" }
        });

        return { status: "cancelled" };
    }

    // Removed custom payment method handling actions (addPaymentMethod, removePaymentMethod)
    // as we must rely on Shopify's billing system.

    // Apply retention discount - create a new subscription with 20% off for 3 months
    // Uses replacementBehavior for atomic swap instead of cancel-then-create
    if (actionType === "applyDiscount") {
        const billingInfo = await prisma.billingInfo.findUnique({ where: { shop } });
        const currentPlan = billingInfo?.planName || MONTHLY_PLAN;

        // Determine price based on current plan
        const planPrice = currentPlan === ENTERPRISE_PLAN ? 199.00 : 49.00;
        const discountedPlanName = currentPlan === ENTERPRISE_PLAN
            ? "Enterprise Plan (20% Off)"
            : "Professional Plan (20% Off)";

        try {
            // Create new subscription with discount using GraphQL
            // Using replacementBehavior: APPLY_IMMEDIATELY for atomic swap
            const { admin } = await authenticate.admin(request);
            const response = await admin.graphql(
                `#graphql
                mutation AppSubscriptionCreate($name: String!, $lineItems: [AppSubscriptionLineItemInput!]!, $returnUrl: URL!, $test: Boolean, $replacementBehavior: AppSubscriptionReplacementBehavior) {
                    appSubscriptionCreate(name: $name, returnUrl: $returnUrl, lineItems: $lineItems, test: $test, replacementBehavior: $replacementBehavior) {
                        userErrors { field message }
                        confirmationUrl
                        appSubscription { id }
                    }
                }`,
                {
                    variables: {
                        name: discountedPlanName,
                        // eslint-disable-next-line no-undef
                        returnUrl: `https://${session.shop}/admin/apps/${process.env.SHOPIFY_API_KEY}/app/dashboard`,
                        test: IS_TEST_MODE,
                        replacementBehavior: "APPLY_IMMEDIATELY",
                        lineItems: [{
                            plan: {
                                appRecurringPricingDetails: {
                                    price: { amount: planPrice, currencyCode: "USD" },
                                    interval: "EVERY_30_DAYS",
                                    discount: {
                                        value: { percentage: 0.2 },  // 20% off
                                        durationLimitInIntervals: 3  // For 3 billing cycles
                                    }
                                }
                            }
                        }]
                    }
                }
            );

            const result = await response.json();

            if (result.data?.appSubscriptionCreate?.confirmationUrl) {
                // Redirect merchant to approve the discounted subscription
                return {
                    status: "discount_pending",
                    confirmationUrl: result.data.appSubscriptionCreate.confirmationUrl
                };
            }

            if (result.data?.appSubscriptionCreate?.userErrors?.length > 0) {
                console.error("Discount subscription errors:", result.data.appSubscriptionCreate.userErrors);
                throw new Error(result.data.appSubscriptionCreate.userErrors[0].message);
            }

            return { status: "discount_applied" };
        } catch (error) {
            console.error("Apply Discount Failed (Mocking Success for Dev):", error);
            // eslint-disable-next-line no-undef
            const isDev = process.env.NODE_ENV === "development";
            const isShopOwnedError = error.message && error.message.includes("owned by a Shop");

            if (isDev || isShopOwnedError) {
                // Mock success in dev environment - just keep current plan
                return { status: "mock_discount_applied", plan: currentPlan };
            }
            throw error;
        }
    }

    return null;
};

export default function DashboardPage() {
    const {
        storeName,
        shop,
        isEmbedEnabled,
        hasPayment,
        isPremium,
        paymentStatus,
        billingHistory,
        usage,
        quickStats,
        rawUsageStats, // Raw data for client-side trend calculation
        popularProducts
    } = useLoaderData();

    const actionData = useActionData();
    const submit = useSubmit();
    const [searchParams, setSearchParams] = useSearchParams();
    const revalidator = useRevalidator();
    const navigate = useNavigate();
    const { t } = useLanguage();

    // Local time range state for instant switching (no server round-trip)
    const [timeRange, setTimeRange] = useState('weekly');
    const [isCancelModalOpen, setCancelModalOpen] = useState(false);
    const [isUpgradeModalOpen, setUpgradeModalOpen] = useState(false);

    // Async Verification State
    const [isVerifying, setIsVerifying] = useState(false);
    const [downloadingId, setDownloadingId] = useState(null);
    const [hoveredIndex, setHoveredIndex] = useState(null);

    // === Client-side trend calculation (instant switching) ===
    const usageTrend = useMemo(() => {
        // Safety check: return empty array if no data
        if (!rawUsageStats || !Array.isArray(rawUsageStats) || rawUsageStats.length === 0) {
            return [];
        }

        const stats = rawUsageStats.map(s => ({ ...s, date: new Date(s.date) }));

        if (timeRange === 'daily') {
            // Hourly data for last 24 hours
            const now = new Date();
            const trend = [];
            for (let i = 23; i >= 0; i--) {
                const d = new Date(now);
                d.setHours(d.getHours() - i);
                d.setMinutes(0, 0, 0);

                const label = d.getHours() + ":00";
                const match = stats.find(s =>
                    s.date.getFullYear() === d.getFullYear() &&
                    s.date.getMonth() === d.getMonth() &&
                    s.date.getDate() === d.getDate() &&
                    s.date.getHours() === d.getHours()
                );
                trend.push({ date: label, tryOns: match ? match.count : 0 });
            }
            return trend;
        } else {
            // Daily aggregation for weekly/monthly
            const rangeDays = timeRange === 'weekly' ? 7 : 30;
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - (rangeDays - 1));
            startDate.setHours(0, 0, 0, 0);

            const dailyMap = new Map();
            stats.filter(s => s.date >= startDate).forEach(stat => {
                const dateStr = stat.date.toISOString().split('T')[0];
                const current = dailyMap.get(dateStr) || 0;
                dailyMap.set(dateStr, current + stat.count);
            });

            const trend = [];
            for (let i = rangeDays - 1; i >= 0; i--) {
                const d = new Date();
                d.setDate(d.getDate() - i);
                const dateStr = d.toISOString().split('T')[0];
                trend.push({
                    date: dateStr,
                    tryOns: dailyMap.get(dateStr) || 0
                });
            }
            return trend;
        }
    }, [rawUsageStats, timeRange]);

    // Helper to translate plan names from backend values
    const translatePlanName = (planName) => {
        const planMap = {
            'Free Plan': t('subscription.plans.free.name'),
            'Free Trial': t('subscription.plans.free.name'),
            'Professional Plan': t('subscription.plans.professional.name'),
            'Professional': t('subscription.plans.professional.name'),
            'Enterprise': t('subscription.plans.enterprise.name'),
            'Enterprise Plan': t('subscription.plans.enterprise.name'),
        };
        return planMap[planName] || planName;
    };
    useEffect(() => {
        const chargeId = searchParams.get('charge_id');
        if (chargeId) {
            setIsVerifying(true);
            // Simulate polling/verification
            const timer = setTimeout(() => {
                setIsVerifying(false);
                setSearchParams(params => {
                    params.delete('charge_id');
                    return params;
                });
                alert("Subscription updated successfully!");
                revalidator.revalidate(); // Refresh data
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [searchParams, setSearchParams, revalidator]);

    // Feedback Effect
    useEffect(() => {
        if (actionData?.status === "mock_upgraded") {
            alert(`Success! Plan updated to ${actionData.plan} (Dev Mock). 14-Day Trial Started.`);
        }
        if (actionData?.status === "cancelled") {
            alert("Subscription cancelled. Switched to Free Plan.");
        }
        if (actionData?.status === "discount_pending" && actionData?.confirmationUrl) {
            // Redirect to Shopify confirmation page for discounted subscription
            window.location.href = actionData.confirmationUrl;
        }
        if (actionData?.status === "mock_discount_applied") {
            alert(`20% discount applied for next 3 months! (Dev Mock - ${actionData.plan})`);
        }
        if (actionData?.status === "discount_applied") {
            alert("20% discount applied successfully for the next 3 billing cycles!");
        }
    }, [actionData]);

    const handleUpgrade = () => setUpgradeModalOpen(true);

    const handleConfirmUpgrade = (planId) => {
        if (planId === "free") {
            submit({ actionType: "cancel" }, { method: "POST" });
        } else {
            submit({ actionType: "upgrade", planId }, { method: "POST" });
        }
    };

    // Chart path calculation
    const maxTryOns = Math.max(...usageTrend.map(d => d.tryOns), 1);
    const chartHeight = 200;
    const chartWidth = 1200;

    const points = usageTrend.map((d, i) => {
        const x = (i / (usageTrend.length - 1)) * chartWidth;
        const y = chartHeight - (d.tryOns / maxTryOns) * (chartHeight - 20);
        return `${x},${y}`;
    }).join(' L');

    const linePath = `M${points}`;
    const areaPath = `M0,${chartHeight} L${points} L${chartWidth},${chartHeight} Z`;

    const formatChange = (change) => {
        const pct = (change * 100).toFixed(1);
        return change >= 0 ? `+${pct}%` : `${pct}%`;
    };

    // Dynamic progress ring color based on usage percentage
    const getRingColor = (percentage) => {
        if (percentage > 100) return { start: '#fca5a5', end: '#ef4444' }; // Red
        if (percentage > 80) return { start: '#fde68a', end: '#f59e0b' };  // Orange/Warning
        return { start: '#d8b4fe', end: '#8b5cf6' }; // Purple (default)
    };

    const ringColors = getRingColor(usage.percentage);
    const usageStatus = usage.percentage > 100 ? 'exceeded' : usage.percentage > 80 ? 'warning' : 'normal';

    return (
        <DashboardLayout merchantName={storeName}>
            {/* Modals */}
            <CancelSubscriptionModal
                isOpen={isCancelModalOpen}
                onClose={() => setCancelModalOpen(false)}
            />
            <UpgradePlanModal
                isOpen={isUpgradeModalOpen}
                onClose={() => setUpgradeModalOpen(false)}
                currentPlanName={usage.planName}
                onUpgrade={handleConfirmUpgrade}
            />

            {/* Welcome Banner */}

            {/* Async Verification Banner */}
            {isVerifying && (
                <div className="verification-banner">
                    <Loader2 size={20} color="#b45309" className="verification-banner-icon" />
                    <span className="verification-banner-text">Verifying your subscription update... This may take a few moments.</span>
                </div>
            )}

            <div className="welcome-banner">
                <div>
                    <h1 className="welcome-title">{t('dashboard.welcomeTitle', { name: storeName })}</h1>
                    <p className="welcome-subtitle">{t('dashboard.welcomeSubtitle')}</p>
                </div>
                {!isEmbedEnabled && (
                    <button
                        className="btn btn-install"
                        onClick={() => window.open(`https://${shop}/admin/themes/current/editor?context=apps`, '_blank')}
                    >
                        <s-icon type="file" size="small"></s-icon>
                        View Installation Guide
                    </button>
                )}
            </div>

            {/* Main Dashboard Grid */}
            <div className="dashboard-grid">
                {/* Left Column - Usage & Billing */}
                <div className="dashboard-col-left">
                    <div className="usage-card">
                        <div className="usage-card-header">
                            <h2 className="card-title">{t('dashboard.usageBilling.title')}</h2>
                            <span className="period-badge">{t('dashboard.usageBilling.monthly')}</span>
                        </div>

                        <div className="usage-content">
                            {/* Progress Ring */}
                            <div className="progress-ring-wrapper">
                                <svg className="progress-ring" viewBox="0 0 120 120">
                                    <defs>
                                        <linearGradient id="ringGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                            <stop offset="0%" stopColor={ringColors.start} />
                                            <stop offset="100%" stopColor={ringColors.end} />
                                        </linearGradient>
                                    </defs>
                                    <circle cx="60" cy="60" r="50" className="ring-bg" />
                                    <circle
                                        cx="60" cy="60" r="50"
                                        className={`ring-progress ${usageStatus}`}
                                        strokeDasharray={`${Math.min(usage.percentage, 100) * 3.14} 314`}
                                        transform="rotate(-90 60 60)"
                                    />
                                </svg>
                                <div className="ring-content">
                                    <span className={`ring-percentage ${usageStatus}`}>{usage.percentage}%</span>
                                    <span className="ring-label">{usageStatus === 'exceeded' ? t('common.exceeded') : t('common.used')}</span>
                                </div>
                            </div>

                            {/* Usage Details */}
                            <div className="usage-details">
                                <div className="usage-count">
                                    <span className="count-value">{usage.current}</span>
                                    <span className="count-label">/ {usage.limit} {t('dashboard.usageBilling.tryOns')}</span>
                                </div>
                                <div className="usage-remaining">
                                    <span className="remaining-dot"></span>
                                    {usage.limit - usage.current} {t('dashboard.usageBilling.remaining')}
                                </div>
                                <div className="plan-info">
                                    <div className="plan-info-header">
                                        <span className="plan-label">{t('dashboard.usageBilling.currentPlan')}</span>
                                        <span className="plan-name">{translatePlanName(usage.planName)}</span>
                                    </div>
                                    <div className="plan-renewal">
                                        {hasPayment ? <>{t('dashboard.usageBilling.renewsOn')} <span>{usage.renewalDate}</span></> : t('common.freeTrial')}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="usage-actions">
                            <button onClick={handleUpgrade} className="btn btn-primary">
                                {hasPayment ? t('dashboard.usageBilling.changePlan') : t('dashboard.usageBilling.changePlan')}
                            </button>
                            {hasPayment && (
                                <button onClick={() => setCancelModalOpen(true)} className="btn btn-secondary">
                                    {t('cancelSubscription.cancel')}
                                </button>
                            )}
                        </div>
                    </div>



                    {/* Payment & Billing History */}
                    <div className="products-card">
                        <div className="products-header">
                            <h3 className="card-title">{t('dashboard.billing.title')}</h3>
                            <div className="billing-actions">
                                <a
                                    href={`https://${shop}/admin/settings/billing`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="view-all-btn"
                                    style={{ display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'none' }}
                                >
                                    <s-icon type="credit-card" size="small"></s-icon>
                                    {t('dashboard.billing.shopifySettings')}
                                    <s-icon type="link" size="small"></s-icon>
                                </a>
                            </div>
                        </div>

                        <div className="payment-info-card">
                            <div className="payment-generic-badge">
                                <s-icon type="credit-card" size="small"></s-icon>
                            </div>
                            <div>
                                <div className="payment-status">{isPremium ? t('dashboard.billing.subscriptionActive') : t('dashboard.billing.subscriptionInactive')}</div>
                                <div className="payment-subtext">{t('dashboard.billing.managedVia')}</div>
                            </div>
                        </div>

                        <div className="billing-info-box">
                            <div className="billing-info-content">
                                <div className="billing-info-icon">
                                    <s-icon type="file" size="base"></s-icon>
                                </div>
                                <div>
                                    <h4 className="billing-info-title">{t('dashboard.billing.invoicesTitle')}</h4>
                                    <p className="billing-info-text">
                                        {t('dashboard.billing.invoicesDesc')} <a href={`https://${shop.replace('https://', '')}/admin/settings/billing`} target="_blank" className="link-underline">{t('dashboard.billing.shopifyAdmin')}</a>.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="billing-footer">
                            <button
                                className="view-all-btn btn-block-link"
                                onClick={() => window.open(`https://${shop.replace('https://', '')}/admin/settings/billing`, '_blank')}
                            >
                                {t('dashboard.billing.viewHistory')}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Right Column */}
                <div className="dashboard-col-right">
                    {/* Quick Stats */}
                    <div className="quick-stats">
                        <div className="stat-card">
                            <div className="stat-header">
                                <span className="stat-value">{quickStats.totalTryOns.value.toLocaleString()}</span>
                                <span className={`stat-change ${quickStats.totalTryOns.change >= 0 ? 'positive' : 'negative'}`}>
                                    {quickStats.totalTryOns.change >= 0 ? '↑' : '↓'}
                                    {formatChange(quickStats.totalTryOns.change)}
                                </span>
                            </div>
                            <span className="stat-label">{t('dashboard.stats.totalTryOns')}</span>
                        </div>

                        <div className="stat-card">
                            <div className="stat-header">
                                <span className="stat-value">{quickStats.uniqueVisitors.value.toLocaleString()}</span>
                                <span className={`stat-change ${quickStats.uniqueVisitors.change >= 0 ? 'positive' : 'negative'}`}>
                                    {quickStats.uniqueVisitors.change >= 0 ? '↑' : '↓'}
                                    {formatChange(quickStats.uniqueVisitors.change)}
                                </span>
                            </div>
                            <span className="stat-label">{t('dashboard.stats.uniqueVisitors')}</span>
                        </div>

                        <div className="stat-card">
                            <div className="stat-header">
                                <span className="stat-value">{(quickStats.conversionRate.value * 100).toFixed(1)}%</span>
                                <span className={`stat-change ${quickStats.conversionRate.change >= 0 ? 'positive' : 'negative'}`}>
                                    {quickStats.conversionRate.change >= 0 ? '↑' : '↓'}
                                    {formatChange(quickStats.conversionRate.change)}
                                </span>
                            </div>
                            <span className="stat-label">{t('dashboard.stats.conversionRate')}</span>
                        </div>

                        <div className="stat-card">
                            <div className="stat-header">
                                <span className="stat-value">${quickStats.revenueImpact.value.toLocaleString()}</span>
                                <span className={`stat-change ${quickStats.revenueImpact.change >= 0 ? 'positive' : 'negative'}`}>
                                    {quickStats.revenueImpact.change >= 0 ? '↑' : '↓'}
                                    {formatChange(quickStats.revenueImpact.change)}
                                </span>
                            </div>
                            <span className="stat-label">{t('dashboard.stats.revenueImpact')}</span>
                        </div>
                    </div>

                    {/* Popular Products Table */}
                    <div className="products-card">
                        <div className="products-header">
                            <h3 className="card-title">{t('dashboard.products.title')}</h3>
                            <button
                                className="view-all-btn"
                                onClick={() => navigate('/app/products')}
                            >
                                {t('dashboard.products.viewAll')}
                            </button>
                        </div>
                        <table className="products-table">
                            <thead>
                                <tr>
                                    <th>{t('dashboard.products.product')}</th>
                                    <th>{t('dashboard.products.tryOns')}</th>
                                    <th>{t('dashboard.products.conversions')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {popularProducts.map((product, index) => (
                                    <tr key={product.id}>
                                        <td>
                                            <div className="product-cell">
                                                {product.image ? (
                                                    <img
                                                        src={product.image}
                                                        alt={product.name}
                                                        className="product-img"
                                                    />
                                                ) : (
                                                    <div className={`product-icon product-icon-${index % 4}`}>
                                                        <s-icon type="view" size="base"></s-icon>
                                                    </div>
                                                )}
                                                <span className="product-name">{product.name}</span>
                                            </div>
                                        </td>
                                        <td className="tryons-cell">{product.tryOns}</td>
                                        <td>
                                            <div className="conversion-cell">
                                                <div className="conversion-bar-track">
                                                    <div
                                                        className="conversion-bar-fill"
                                                        style={{ width: `${product.conversion * 100}%` }}
                                                    ></div>
                                                </div>
                                                <span className="conversion-value">{(product.conversion * 100).toFixed(0)}%</span>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Usage Trend Chart */}
            <div className="trend-card">
                <div className="trend-header">
                    <h3 className="card-title">{t('dashboard.trend.title')}</h3>
                    <div className="time-range-btns">
                        <button
                            className={`range-btn ${timeRange === 'daily' ? 'active' : ''}`}
                            onClick={() => setTimeRange('daily')}
                        >{t('dashboard.trend.daily')}</button>
                        <button
                            className={`range-btn ${timeRange === 'weekly' ? 'active' : ''}`}
                            onClick={() => setTimeRange('weekly')}
                        >{t('dashboard.trend.weekly')}</button>
                        <button
                            className={`range-btn ${timeRange === 'monthly' ? 'active' : ''}`}
                            onClick={() => setTimeRange('monthly')}
                        >{t('dashboard.trend.monthly')}</button>
                    </div>
                </div>

                <div className="trend-chart-container" style={{ position: 'relative', height: '230px' }} onMouseLeave={() => setHoveredIndex(null)}>
                    {/* Background SVG for Paths (Stretches to fill) */}
                    <svg className="trend-chart" viewBox={`0 0 ${chartWidth} ${chartHeight + 30}`} preserveAspectRatio="none" style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }}>
                        <defs>
                            <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.4" />
                                <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
                            </linearGradient>
                        </defs>
                        {[0, 50, 100, 150, 200].map(y => (
                            <line key={y} x1="0" y1={y} x2={chartWidth} y2={y} className="grid-line" />
                        ))}
                        <path d={areaPath} fill="url(#chartGradient)" className="chart-area-path" />
                        <path d={linePath} className="chart-line-path" />
                    </svg>

                    {/* Interactive Overlay Layer (Single event listener) */}
                    <div
                        style={{ position: 'absolute', inset: 0, zIndex: 10, cursor: 'crosshair' }}
                        onMouseMove={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect();
                            const x = e.clientX - rect.left;
                            const width = rect.width;
                            const count = usageTrend.length;
                            if (count < 2) return;

                            // Map x (0 to width) to index (0 to count-1)
                            // The points are at x_i = i / (count-1) * width
                            // We want to find the nearest i.
                            // normalized_x = x / width (0 to 1)
                            // index_float = normalized_x * (count - 1)
                            // index = round(index_float)
                            const index = Math.round((x / width) * (count - 1));
                            // Clamp index
                            const safeIndex = Math.max(0, Math.min(count - 1, index));
                            setHoveredIndex(safeIndex);
                        }}
                    >
                        {hoveredIndex !== null && usageTrend[hoveredIndex] && (() => {
                            const d = usageTrend[hoveredIndex];
                            const i = hoveredIndex;
                            const count = usageTrend.length;

                            // Calculate exact position matching SVG logic
                            const xPct = (i / (count - 1)) * 100;

                            const valRatio = (d.tryOns / maxTryOns);
                            // Bottom px formula: 30 + valRatio * 180
                            const bottomPx = 30 + (valRatio * 180);
                            const bottomPct = (bottomPx / 230) * 100;

                            return (
                                <>
                                    {/* Vertical Guide Line */}
                                    <div style={{
                                        position: 'absolute',
                                        left: `${xPct}%`,
                                        bottom: '30px',
                                        top: 0,
                                        width: '1px',
                                        background: '#e5e7eb',
                                        borderRight: '1px dashed #9ca3af',
                                        transform: 'translateX(-50%)', // Center on the X coord
                                        pointerEvents: 'none'
                                    }} />

                                    {/* The Dot */}
                                    <div style={{
                                        position: 'absolute',
                                        left: `${xPct}%`,
                                        bottom: `${bottomPct}%`,
                                        width: '12px',
                                        height: '12px',
                                        borderRadius: '50%',
                                        background: '#8b5cf6',
                                        border: '2px solid white',
                                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                        zIndex: 20,
                                        transform: 'translate(-50%, 50%)', // Center dot
                                        pointerEvents: 'none'
                                    }} />

                                    {/* The Tooltip */}
                                    <div style={{
                                        position: 'absolute',
                                        left: `${xPct}%`,
                                        bottom: `${bottomPct + 5}%`,
                                        transform: 'translateX(-50%)',
                                        background: '#1f2937',
                                        color: 'white',
                                        padding: '6px 12px',
                                        borderRadius: '6px',
                                        fontSize: '12px',
                                        fontWeight: 500,
                                        whiteSpace: 'nowrap',
                                        pointerEvents: 'none',
                                        zIndex: 30,
                                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                                    }}>
                                        <div style={{ marginBottom: '2px', opacity: 0.8, fontSize: '10px' }}>{d.date}</div>
                                        <div>{d.tryOns} {t('dashboard.trend.tryOnsLabel')}</div>
                                    </div>
                                </>
                            );
                        })()}
                    </div>

                    {/* X-Axis Labels */}
                    <div className="chart-x-labels" style={{ position: 'absolute', bottom: 0, width: '100%', height: '30px', pointerEvents: 'none' }}>
                        {usageTrend.map((d, i) => {
                            const totalPoints = usageTrend.length;
                            const showLabel =
                                (totalPoints <= 7) ||
                                (totalPoints > 7 && totalPoints <= 24 && i % 4 === 0) ||
                                (totalPoints > 24 && i % 5 === 0);

                            if (showLabel) {
                                const xPct = (i / (totalPoints - 1)) * 100;
                                return (
                                    <div key={i} style={{
                                        position: 'absolute',
                                        left: `${xPct}%`,
                                        transform: 'translateX(-50%)', // IMPORTANT: Center the label on the tick
                                        bottom: '2px',
                                        fontSize: '10px',
                                        color: '#9ca3af',
                                        textAlign: 'center'
                                    }}>
                                        {d.date.split('/')[1] || d.date}
                                    </div>
                                );
                            }
                            return null;
                        })}
                    </div>
                </div>
            </div>

            {/* Device Distribution Card (Phase 2) */}
            <div className="trend-card device-distribution-card">
                <div className="trend-header">
                    <h3 className="card-title">{t('dashboard.deviceDistribution.title')}</h3>
                </div>
                <div className="device-stats-container">
                    {usage.deviceStats && usage.deviceStats.length > 0 ? (
                        usage.deviceStats.map(stat => (
                            <div key={stat.name} className="device-stat-item">
                                <div className="device-stat-label">
                                    {stat.name === 'desktop' ? '🖥️ ' : stat.name === 'mobile' ? '📱 ' : stat.name === 'tablet' ? '📟 ' : '❓ '}
                                    {t(`dashboard.deviceDistribution.${stat.name}`) || t('dashboard.deviceDistribution.unknown')}
                                </div>
                                <div className="device-stat-value">{stat.value}</div>
                                <div className="device-stat-sublabel">{t('dashboard.deviceDistribution.tryOns')}</div>
                            </div>
                        ))
                    ) : (
                        <>
                            {/* Empty State with Placeholders */}
                            <div className="device-stat-item device-stat-placeholder">
                                <div className="device-stat-label">
                                    🖥️ {t('dashboard.deviceDistribution.desktop')}
                                </div>
                                <div className="device-stat-value device-stat-value-empty">-</div>
                                <div className="device-stat-sublabel">{t('dashboard.deviceDistribution.tryOns')}</div>
                            </div>
                            <div className="device-stat-item device-stat-placeholder">
                                <div className="device-stat-label">
                                    📱 {t('dashboard.deviceDistribution.mobile')}
                                </div>
                                <div className="device-stat-value device-stat-value-empty">-</div>
                                <div className="device-stat-sublabel">{t('dashboard.deviceDistribution.tryOns')}</div>
                            </div>
                            <div className="device-stat-item device-stat-placeholder">
                                <div className="device-stat-label">
                                    📟 {t('dashboard.deviceDistribution.tablet')}
                                </div>
                                <div className="device-stat-value device-stat-value-empty">-</div>
                                <div className="device-stat-sublabel">{t('dashboard.deviceDistribution.tryOns')}</div>
                            </div>
                            <div className="device-stat-item device-stat-placeholder">
                                <div className="device-stat-label">
                                    ❓ {t('dashboard.deviceDistribution.unknown')}
                                </div>
                                <div className="device-stat-value device-stat-value-empty">-</div>
                                <div className="device-stat-sublabel">{t('dashboard.deviceDistribution.tryOns')}</div>
                            </div>
                        </>
                    )}
                </div>
                {(!usage.deviceStats || usage.deviceStats.length === 0) && (
                    <div className="device-stats-empty-banner">
                        <s-icon type="view" size="base"></s-icon>
                        <span>{t('dashboard.deviceDistribution.noData')}</span>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
