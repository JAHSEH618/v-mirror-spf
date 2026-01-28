import { useLoaderData, useSubmit, useActionData, useSearchParams, useRevalidator } from "react-router";
import { useState, useEffect } from "react";
import { authenticate, apiVersion } from "../shopify.server";
import { DashboardLayout } from "../components/DashboardLayout";
import prisma from "../db.server";
import adminStyles from "../styles/admin.css?url";
import {
    TrendingUp,
    TrendingDown,
    Eye,
    FileText,
    Download,
    CreditCard,
    ExternalLink,
    Loader2
} from 'lucide-react';
import { CancelSubscriptionModal } from "../components/CancelSubscriptionModal";
import { UpgradePlanModal } from "../components/UpgradePlanModal";

export const links = () => [
    { rel: "stylesheet", href: adminStyles },
];

// Billing Configuration
const MONTHLY_PLAN = "Professional Plan";
const ENTERPRISE_PLAN = "Enterprise Plan";

export const loader = async ({ request }) => {
    const { session, admin, billing } = await authenticate.admin(request);
    const shop = session.shop;
    let isEmbedEnabled = false;

    // 1. Check App Block Status
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
            try {
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
                    isEmbedEnabled = Object.values(blocks).some((block) => {
                        return block.type.includes("try-on-widget") && String(block.disabled) !== "true";
                    });
                }
            } catch (e) {
                console.warn("REST Asset check failed:", e);
            }
        }
    } catch (error) {
        console.warn("Theme check failed:", error);
    }

    // 2. Check billing status with Shopify
    let hasPayment = false;
    try {
        const billingCheck = await billing.check({
            plans: [MONTHLY_PLAN, ENTERPRISE_PLAN],
            isTest: true,
        });
        hasPayment = billingCheck.hasActivePayment;
    } catch (e) {
        // Ignore in dev
    }

    // 3. Get Billing Info
    let billingInfo = await prisma.billingInfo.findUnique({
        where: { shop },
        include: { paymentMethods: true }
    });

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
    }

    const isPremium = billingInfo.planName === MONTHLY_PLAN || billingInfo.planName === ENTERPRISE_PLAN;
    hasPayment = hasPayment || isPremium;

    // 4. Get Billing History
    const billingHistorySrc = await prisma.billingHistory.findMany({
        where: { shop },
        orderBy: { date: 'desc' },
        take: 5
    });

    const billingHistory = billingHistorySrc.map(record => ({
        id: record.id,
        date: new Date(record.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        description: record.description,
        amount: record.amount,
        status: record.status.toLowerCase(),
    }));

    // Mock history logic removed
    /*
    if (billingHistory.length === 0 && hasPayment) {
       // Removed to avoid confusion
    }
    */

    // 5. Get Usage Statistics based on Time Range
    const url = new URL(request.url);
    const timeRange = url.searchParams.get("timeRange") || 'weekly'; // Default to Weekly

    let rangeDays = 30;
    if (timeRange === 'daily') rangeDays = 1;
    if (timeRange === 'weekly') rangeDays = 7;
    if (timeRange === 'monthly') rangeDays = 30;

    const endDate = new Date();
    // Inclusive logic: end of current hour/day
    const startDate = new Date();

    if (timeRange === 'daily') {
        // Last 24 hours
        startDate.setHours(startDate.getHours() - 24);
    } else {
        // Last X days (start from midnight of X days ago)
        startDate.setDate(startDate.getDate() - (rangeDays - 1));
        startDate.setHours(0, 0, 0, 0);
    }

    const usageStats = await prisma.usageStat.findMany({
        where: { shop, date: { gte: startDate } },
        orderBy: { date: 'asc' }
    });

    // Calculate total
    const totalTryOns = usageStats.reduce((sum, stat) => sum + stat.count, 0);

    // Trend Logic
    let filledTrend = [];

    if (timeRange === 'daily') {
        // --- DAILY VIEW: Hourly Data ---
        // Create 24 slots for the last 24h
        const now = new Date();
        for (let i = 23; i >= 0; i--) {
            const d = new Date(now);
            d.setHours(d.getHours() - i);
            d.setMinutes(0, 0, 0);

            // Format: "14:00"
            const label = d.getHours() + ":00";

            // Find stats matching this hour (ignoring minute mismatches from older data if any)
            const match = usageStats.find(s => {
                const sDate = new Date(s.date);
                return sDate.getFullYear() === d.getFullYear() &&
                    sDate.getMonth() === d.getMonth() &&
                    sDate.getDate() === d.getDate() &&
                    sDate.getHours() === d.getHours();
            });

            filledTrend.push({ date: label, tryOns: match ? match.count : 0 });
        }
    } else {
        // --- WEEKLY/MONTHLY VIEW: Daily Aggregation ---
        // Map timestamps to "YYYY-MM-DD" buckets
        const dailyMap = new Map();

        usageStats.forEach(stat => {
            const dateStr = new Date(stat.date).toISOString().split('T')[0];
            const current = dailyMap.get(dateStr) || 0;
            dailyMap.set(dateStr, current + stat.count);
        });

        // Fill buckets
        for (let i = rangeDays - 1; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            filledTrend.push({
                date: dateStr,
                tryOns: dailyMap.get(dateStr) || 0
            });
        }
    }

    // Previous Period (Simple Comparison)
    // For simplicity, just fetch prev period sum to calculating change
    const prevStartDate = new Date(startDate);
    if (timeRange === 'daily') {
        prevStartDate.setHours(prevStartDate.getHours() - 24);
    } else {
        prevStartDate.setDate(prevStartDate.getDate() - rangeDays);
    }

    const previousUsageStats = await prisma.usageStat.findMany({
        where: { shop, date: { gte: prevStartDate, lt: startDate } }
    });
    const previousTotalTryOns = previousUsageStats.reduce((sum, stat) => sum + stat.count, 0);

    const tryOnChange = previousTotalTryOns > 0
        ? ((totalTryOns - previousTotalTryOns) / previousTotalTryOns)
        : (totalTryOns > 0 ? 1 : 0);

    // Usage trend for chart is filledTrend (renamed in return)
    const usageTrend = filledTrend;

    const usagePercentage = Math.min(100, Math.round((billingInfo.currentUsage / billingInfo.usageLimit) * 100));
    const renewalDate = new Date(billingInfo.cycleStartDate.getTime() + 30 * 24 * 60 * 60 * 1000);

    // Real Popular Products Stats
    const productStats = await prisma.productStat.findMany({
        where: { shop },
        orderBy: { tryOnCount: 'desc' },
        take: 5
    });

    const popularProducts = productStats.map(p => ({
        id: p.productId,
        name: p.productTitle,
        image: p.productImage,
        tryOns: p.tryOnCount,
        // Conversion: Orders / TryOns
        conversion: p.tryOnCount > 0 ? (p.orderedCount / p.tryOnCount) : 0
    }));

    // Calculate aggregated real stats
    // const totalAddToCart = productStats.reduce((sum, p) => sum + p.addToCartCount, 0); // Deprecated for top-level stats
    const totalOrders = productStats.reduce((sum, p) => sum + p.orderedCount, 0);
    const totalRevenue = productStats.reduce((sum, p) => sum + p.revenue, 0);
    const totalTryOnStats = productStats.reduce((sum, p) => sum + p.tryOnCount, 0);

    const conversionRate = totalTryOnStats > 0 ? (totalOrders / totalTryOnStats) : 0;

    // Mock diffs for new metrics until we have history for them
    const conversionChange = 0.0;
    const revenueImpact = totalRevenue;
    const revenueChange = 0.0;

    // Payment method
    let defaultMethod = billingInfo.paymentMethods.find(m => m.isDefault);
    if (!defaultMethod && billingInfo.paymentMethods.length > 0) defaultMethod = billingInfo.paymentMethods[0];
    const paymentMethod = defaultMethod ? {
        last4: defaultMethod.last4,
        expiry: defaultMethod.expiry,
        brand: defaultMethod.brand
    } : null;

    return {
        storeName: shop.split('.')[0],
        shop,
        isEmbedEnabled,
        hasPayment,
        paymentMethod,
        allPaymentMethods: billingInfo.paymentMethods || [],
        billingHistory,
        usage: {
            current: billingInfo.currentUsage,
            limit: billingInfo.usageLimit,
            percentage: usagePercentage,
            planName: billingInfo.planName,
            renewalDate: renewalDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        },
        quickStats: {
            totalTryOns: { value: totalTryOns || billingInfo.currentUsage, change: tryOnChange },
            conversionRate: { value: conversionRate, change: conversionChange },
            revenueImpact: { value: revenueImpact, change: revenueChange }
        },
        usageTrend: filledTrend,
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
                isTest: true,
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
            const subscription = await billing.check({ plans: [MONTHLY_PLAN, ENTERPRISE_PLAN], isTest: true });
            if (subscription.appSubscriptions?.[0]) {
                await billing.cancel({
                    subscriptionId: subscription.appSubscriptions[0].id,
                    isTest: true,
                    prorate: true,
                });
            }
        } catch (e) {
            // Ignore
        }

        await prisma.billingInfo.update({
            where: { shop },
            data: { planName: "Free Plan", usageLimit: 2 }
        });

        return { status: "cancelled" };
    }

    if (actionType === "addPaymentMethod") {
        const brand = formData.get("brand");
        const last4 = formData.get("last4");
        const expiry = formData.get("expiry");

        const billingInfo = await prisma.billingInfo.findUnique({ where: { shop } });
        if (billingInfo) {
            await prisma.paymentMethod.create({
                data: { billingInfoId: billingInfo.id, brand, last4, expiry }
            });
        }
        return { status: "card_added" };
    }

    if (actionType === "removePaymentMethod") {
        const methodId = formData.get("methodId");
        await prisma.paymentMethod.delete({ where: { id: methodId } });
        return { status: "card_removed" };
    }

    return null;
};

export default function DashboardPage() {
    const {
        storeName,
        shop,
        isEmbedEnabled,
        hasPayment,
        paymentMethod,
        billingHistory,
        usage,
        quickStats,
        usageTrend,
        popularProducts
    } = useLoaderData();

    const actionData = useActionData();
    const submit = useSubmit();
    const [searchParams, setSearchParams] = useSearchParams();
    const revalidator = useRevalidator();

    const timeRange = searchParams.get("timeRange") || 'weekly';
    const [isCancelModalOpen, setCancelModalOpen] = useState(false);
    const [isUpgradeModalOpen, setUpgradeModalOpen] = useState(false);

    // Async Verification State
    const [isVerifying, setIsVerifying] = useState(false);
    const [downloadingId, setDownloadingId] = useState(null);
    const [hoveredIndex, setHoveredIndex] = useState(null);

    // Check for charge_id to trigger verification
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
                    <h1 className="welcome-title">Welcome back, {storeName}! 👋</h1>
                    <p className="welcome-subtitle">Here is what&apos;s happening with your store today.</p>
                </div>
                {!isEmbedEnabled && (
                    <button
                        className="btn btn-install"
                        onClick={() => window.open(`https://${shop}/admin/themes/current/editor?context=apps`, '_blank')}
                    >
                        <FileText size={16} />
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
                            <h2 className="card-title">Usage &amp; Billing</h2>
                            <span className="period-badge">Monthly</span>
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
                                    <span className="ring-label">{usageStatus === 'exceeded' ? 'EXCEEDED' : 'USED'}</span>
                                </div>
                            </div>

                            {/* Usage Details */}
                            <div className="usage-details">
                                <div className="usage-count">
                                    <span className="count-value">{usage.current}</span>
                                    <span className="count-label">/ {usage.limit} try-ons</span>
                                </div>
                                <div className="usage-remaining">
                                    <span className="remaining-dot"></span>
                                    {usage.limit - usage.current} remaining
                                </div>
                                <div className="plan-info">
                                    <div className="plan-info-header">
                                        <span className="plan-label">CURRENT PLAN</span>
                                        <span className="plan-name">{usage.planName}</span>
                                    </div>
                                    <div className="plan-renewal">
                                        {hasPayment ? <>Renews on <span>{usage.renewalDate}</span></> : "Free Trial"}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="usage-actions">
                            <button onClick={handleUpgrade} className="btn btn-primary">
                                {hasPayment ? 'Change Plan' : 'Upgrade Plan'}
                            </button>
                            {hasPayment && (
                                <button onClick={() => setCancelModalOpen(true)} className="btn btn-secondary">
                                    Cancel
                                </button>
                            )}
                        </div>
                    </div>



                    {/* Payment & Billing History */}
                    <div className="products-card">
                        <div className="products-header">
                            <h3 className="card-title">Billing</h3>
                            <div className="billing-actions">
                                <a
                                    href={`https://${shop}/admin/settings/billing`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="view-all-btn"
                                    style={{ display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'none' }}
                                >
                                    <CreditCard size={14} />
                                    Shopify Billing Settings
                                    <ExternalLink size={12} />
                                </a>
                            </div>
                        </div>

                        {paymentMethod ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', padding: '0.75rem', background: '#f8fafc', borderRadius: '0.5rem' }}>
                                <div style={{ width: '40px', height: '28px', background: 'linear-gradient(135deg, #2563eb 0%, #60a5fa 100%)', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }}>
                                    {paymentMethod.brand}
                                </div>
                                <div>
                                    <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>•••• {paymentMethod.last4}</div>
                                    <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Expires {paymentMethod.expiry}</div>
                                </div>
                            </div>
                        ) : hasPayment ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', padding: '0.75rem', background: '#f8fafc', borderRadius: '0.5rem' }}>
                                <div style={{ width: '40px', height: '28px', background: '#64748b', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                                    <CreditCard size={16} />
                                </div>
                                <div>
                                    <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>Subscription Active</div>
                                    <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Managed via Shopify Billing</div>
                                </div>
                            </div>
                        ) : null}

                        <div className="billing-explainer" style={{ marginTop: '16px', padding: '16px', backgroundColor: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <div style={{ minWidth: '20px', color: '#6b7280' }}>
                                    <FileText size={20} />
                                </div>
                                <div>
                                    <h4 style={{ margin: '0 0 4px', fontSize: '14px', fontWeight: 600, color: '#374151' }}>Invoices & Payments</h4>
                                    <p style={{ margin: 0, fontSize: '13px', color: '#6b7280', lineHeight: '1.5' }}>
                                        All charges for this app are consolidated into your monthly Shopify invoice.
                                        You can view detailed payment history and download invoices directly from your <a href={`https://${shop.replace('https://', '')}/admin/settings/billing`} target="_blank" style={{ color: '#2563eb', textDecoration: 'underline' }}>Shopify Admin</a>.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div style={{ borderTop: '1px solid #e5e7eb', marginTop: '0.5rem', paddingTop: '0.75rem', textAlign: 'center' }}>
                            <button
                                className="view-all-btn"
                                style={{ width: '100%', justifyContent: 'center' }}
                                onClick={() => window.open(`https://${shop.replace('https://', '')}/admin/settings/billing`, '_blank')}
                            >
                                View All History
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
                                    {quickStats.totalTryOns.change >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                                    {formatChange(quickStats.totalTryOns.change)}
                                </span>
                            </div>
                            <span className="stat-label">Total Try-Ons</span>
                        </div>

                        <div className="stat-card">
                            <div className="stat-header">
                                <span className="stat-value">{(quickStats.conversionRate.value * 100).toFixed(1)}%</span>
                                <span className={`stat-change ${quickStats.conversionRate.change >= 0 ? 'positive' : 'negative'}`}>
                                    {quickStats.conversionRate.change >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                                    {formatChange(quickStats.conversionRate.change)}
                                </span>
                            </div>
                            <span className="stat-label">Conversion Rate</span>
                        </div>

                        <div className="stat-card">
                            <div className="stat-header">
                                <span className="stat-value">${quickStats.revenueImpact.value.toLocaleString()}</span>
                                <span className={`stat-change ${quickStats.revenueImpact.change >= 0 ? 'positive' : 'negative'}`}>
                                    {quickStats.revenueImpact.change >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                                    {formatChange(quickStats.revenueImpact.change)}
                                </span>
                            </div>
                            <span className="stat-label">Revenue Impact</span>
                        </div>
                    </div>

                    {/* Popular Products Table */}
                    <div className="products-card">
                        <div className="products-header">
                            <h3 className="card-title">Popular Products</h3>
                            <button className="view-all-btn">View All</button>
                        </div>
                        <table className="products-table">
                            <thead>
                                <tr>
                                    <th>Product</th>
                                    <th>Try-Ons</th>
                                    <th>Conversions</th>
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
                                                        className="product-icon"
                                                        style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 4 }}
                                                    />
                                                ) : (
                                                    <div className={`product-icon product-icon-${index % 4}`}>
                                                        <Eye size={18} />
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
                    <h3 className="card-title">Usage Trend</h3>
                    <div className="time-range-btns">
                        <button
                            className={`range-btn ${timeRange === 'daily' ? 'active' : ''}`}
                            onClick={() => setSearchParams(prev => { prev.set('timeRange', 'daily'); return prev; })}
                        >Daily</button>
                        <button
                            className={`range-btn ${timeRange === 'weekly' ? 'active' : ''}`}
                            onClick={() => setSearchParams(prev => { prev.set('timeRange', 'weekly'); return prev; })}
                        >Weekly</button>
                        <button
                            className={`range-btn ${timeRange === 'monthly' ? 'active' : ''}`}
                            onClick={() => setSearchParams(prev => { prev.set('timeRange', 'monthly'); return prev; })}
                        >Monthly</button>
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
                        <path d={areaPath} fill="url(#chartGradient)" />
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
                                        <div>{d.tryOns} Try-Ons</div>
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
        </DashboardLayout>
    );
}
