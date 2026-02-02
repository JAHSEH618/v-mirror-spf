import { useLoaderData, useNavigate } from "react-router";
import { authenticate } from "../shopify.server";
import { useLanguage } from "../components/LanguageContext";
import prisma from "../db.server";
import {
    Page,
    Layout,
    LegacyCard,
    IndexTable,
    Text,
    Badge,
    Thumbnail,
    InlineGrid,
    BlockStack,
    Card,
    Icon
} from "@shopify/polaris";
import {
    ViewIcon,
    CartIcon,
    DeliveryIcon,
    CashDollarIcon,
    ImageIcon
} from "@shopify/polaris-icons";

export const loader = async ({ request }) => {
    const { session } = await authenticate.admin(request);
    const shop = session.shop;

    const limit = 50; // Increased limit as per request
    const where = { shop };

    // Hardcoded default sort: TryOns > AddToCarts > Orders > Revenue (descending)
    const orderBy = [
        { tryOnCount: 'desc' },
        { addToCartCount: 'desc' },
        { orderedCount: 'desc' },
        { revenue: 'desc' }
    ];

    // Execute queries
    const [productStats, totalsResult] = await Promise.all([
        prisma.productStat.findMany({
            where,
            orderBy,
            take: limit,
        }),
        prisma.productStat.aggregate({
            where: { shop },
            _sum: {
                tryOnCount: true,
                addToCartCount: true,
                orderedCount: true,
                revenue: true
            }
        })
    ]);

    // Compute totals
    const totals = {
        tryOns: totalsResult._sum.tryOnCount || 0,
        addToCarts: totalsResult._sum.addToCartCount || 0,
        orders: totalsResult._sum.orderedCount || 0,
        revenue: totalsResult._sum.revenue || 0
    };

    // Transform data
    const products = productStats.map(p => ({
        id: p.id,
        productId: p.productId,
        title: p.productTitle,
        image: p.productImage,
        tryOns: p.tryOnCount,
        addToCarts: p.addToCartCount,
        orders: p.orderedCount,
        revenue: p.revenue,
        conversion: p.tryOnCount > 0 ? (p.orderedCount / p.tryOnCount) : 0,
        lastTryOn: new Date(p.lastTryOn).toLocaleDateString('en-US', {
            month: 'short', day: 'numeric', year: 'numeric'
        }),
        rawLastTryOn: p.lastTryOn
    }));

    return {
        products,
        totals
    };
};

const StatCard = ({ icon, value, label, tone = "base" }) => (
    <Card>
        <BlockStack gap="200">
            <InlineGrid columns="auto 1fr" gap="200" alignItems="center">
                <div style={{ color: 'var(--p-color-icon-subdued)' }}>
                    <Icon source={icon} tone="base" />
                </div>
                <Text variant="headingLg" as="h3" tone={tone === "success" ? "success" : tone === "caution" ? "critical" : "base"}>
                    {value}
                </Text>
            </InlineGrid>
            <Text variant="bodyMd" as="p" tone="subdued">
                {label}
            </Text>
        </BlockStack>
    </Card>
);

export default function ProductsPage() {
    const { products, totals } = useLoaderData();
    const { t } = useLanguage();
    const navigate = useNavigate();

    const resourceName = {
        singular: t('products.product') || 'product',
        plural: t('products.products') || 'products',
    };

    const rowMarkup = products.map(
        (
            { id, title, image, tryOns, addToCarts, orders, revenue, conversion, lastTryOn },
            index,
        ) => (
            <IndexTable.Row
                id={id}
                key={id}
                position={index}
            >
                <IndexTable.Cell>
                    <InlineGrid columns="auto 1fr" gap="300" alignItems="center">
                        <Thumbnail
                            source={image || ImageIcon}
                            alt={title}
                            size="small"
                        />
                        <Text variant="bodyMd" fontWeight="bold" as="span">
                            {title}
                        </Text>
                    </InlineGrid>
                </IndexTable.Cell>
                <IndexTable.Cell>
                    <Text as="span" numeric>{tryOns}</Text>
                </IndexTable.Cell>
                <IndexTable.Cell>
                    <Text as="span" numeric>{addToCarts}</Text>
                </IndexTable.Cell>
                <IndexTable.Cell>
                    <Text as="span" numeric>{orders}</Text>
                </IndexTable.Cell>
                <IndexTable.Cell>
                    <Text as="span" numeric>${revenue.toFixed(2)}</Text>
                </IndexTable.Cell>
                <IndexTable.Cell>
                    <Badge tone={conversion > 0.1 ? "success" : undefined}>
                        {(conversion * 100).toFixed(0)}%
                    </Badge>
                </IndexTable.Cell>
                <IndexTable.Cell>
                    <Text as="span" tone="subdued">{lastTryOn}</Text>
                </IndexTable.Cell>
            </IndexTable.Row>
        ),
    );

    return (
        <Page
            title={t('products.title') || 'Product Analytics'}
            backAction={{ content: t('common.back') || 'Back', onAction: () => navigate("/app/dashboard") }}
            fullWidth
            subtitle={t('products.subtitle') || "Detailed performance metrics for your try-on products"}
        >
            <Layout>
                <Layout.Section>
                    <InlineGrid columns={{ xs: 1, sm: 2, md: 4 }} gap="400" alignItems="stretch">
                        <StatCard
                            icon={ViewIcon}
                            value={totals.tryOns.toLocaleString()}
                            label={t('products.totalTryOns') || 'Total Try-Ons'}
                            tone="success"
                        />
                        <StatCard
                            icon={CartIcon}
                            value={totals.addToCarts.toLocaleString()}
                            label={t('products.totalAddToCarts') || 'Add to Carts'}
                            tone="base"
                        />
                        <StatCard
                            icon={DeliveryIcon}
                            value={totals.orders.toLocaleString()}
                            label={t('products.totalOrders') || 'Orders'}
                            tone="success"
                        />
                        <StatCard
                            icon={CashDollarIcon}
                            value={`$${totals.revenue.toLocaleString()}`}
                            label={t('products.totalRevenue') || 'Revenue Impact'}
                            tone="caution"
                        />
                    </InlineGrid>
                </Layout.Section>

                <Layout.Section>
                    <LegacyCard>
                        <IndexTable
                            resourceName={resourceName}
                            itemCount={products.length}
                            selectedItemsCount="All"
                            headings={[
                                { title: t('products.product') || 'Product' },
                                { title: t('products.tryOns') || 'Try-Ons' },
                                { title: t('products.addToCarts') || 'Add to Cart' },
                                { title: t('products.orders') || 'Orders' },
                                { title: t('products.revenue') || 'Revenue' },
                                { title: t('products.conversion') || 'Conversion' },
                                { title: t('products.lastTryOn') || 'Last Try-On' },
                            ]}
                            selectable={false}
                        >
                            {rowMarkup}
                        </IndexTable>
                    </LegacyCard>
                </Layout.Section>
            </Layout>
        </Page>
    );
}
