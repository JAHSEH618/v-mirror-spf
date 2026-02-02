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
    EmptyState,
    InlineGrid,
    BlockStack,
    Box,
    useIndexResourceState,
    Icon,
    Tooltip
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

    // Execute queries in parallel for better performance
    const [productStats, totalsResult] = await Promise.all([
        // Get all product stats with pagination support
        prisma.productStat.findMany({
            where: { shop },
            orderBy: { tryOnCount: 'desc' }
        }),
        // Use aggregate for totals (more efficient than fetching all + reducing)
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

    // Extract totals from aggregate result
    const totals = {
        tryOns: totalsResult._sum.tryOnCount || 0,
        addToCarts: totalsResult._sum.addToCartCount || 0,
        orders: totalsResult._sum.orderedCount || 0,
        revenue: totalsResult._sum.revenue || 0
    };

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
        })
    }));

    return {
        storeName: shop.split('.')[0],
        products,
        totals
    };
};

export default function ProductsPage() {
    const { products, totals } = useLoaderData();
    const { t } = useLanguage();
    const navigate = useNavigate();

    const resourceName = {
        singular: 'product',
        plural: 'products',
    };

    // IndexTable requires unique IDs for selection state management
    const { selectedResources, allResourcesSelected, handleSelectionChange } =
        useIndexResourceState(products);

    // Stats Card Component
    const StatCard = ({ icon, value, label, tone = "base" }) => (
        <LegacyCard sectioned>
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
        </LegacyCard>
    );

    const rowMarkup = products.map(
        (
            { id, title, image, tryOns, addToCarts, orders, revenue, conversion, lastTryOn },
            index,
        ) => (
            <IndexTable.Row
                id={id}
                key={id}
                selected={selectedResources.includes(id)}
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
                <IndexTable.Cell>{tryOns}</IndexTable.Cell>
                <IndexTable.Cell>{addToCarts}</IndexTable.Cell>
                <IndexTable.Cell>{orders}</IndexTable.Cell>
                <IndexTable.Cell>${revenue.toFixed(2)}</IndexTable.Cell>
                <IndexTable.Cell>
                    <Badge tone={conversion > 0.1 ? "success" : undefined}>
                        {(conversion * 100).toFixed(0)}%
                    </Badge>
                </IndexTable.Cell>
                <IndexTable.Cell>{lastTryOn}</IndexTable.Cell>
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
                {/* Summary Stats */}
                <Layout.Section>
                    <InlineGrid columns={{ xs: 1, sm: 2, md: 4 }} gap="400">
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
                            tone="base" // Info tone not directly mapped to text, keep base or use logic
                        />
                        <StatCard
                            icon={DeliveryIcon}
                            value={totals.orders.toLocaleString()}
                            label={t('products.totalOrders') || 'Orders'}
                            tone="success"
                        />
                        <StatCard
                            icon={CurrencyDollarIcon}
                            value={`$${totals.revenue.toLocaleString()}`}
                            label={t('products.totalRevenue') || 'Revenue Impact'}
                            tone="caution" // Mapped to critical usually for money if needed, or base
                        />
                    </InlineGrid>
                </Layout.Section>

                {/* Products Table */}
                <Layout.Section>
                    <LegacyCard>
                        {products.length > 0 ? (
                            <IndexTable
                                resourceName={resourceName}
                                itemCount={products.length}
                                selectedItemsCount={
                                    allResourcesSelected ? 'All' : selectedResources.length
                                }
                                onSelectionChange={handleSelectionChange}
                                headings={[
                                    { title: t('products.product') || 'Product' },
                                    { title: t('products.tryOns') || 'Try-Ons' },
                                    { title: t('products.addToCarts') || 'Add to Cart' },
                                    { title: t('products.orders') || 'Orders' },
                                    { title: t('products.revenue') || 'Revenue' },
                                    { title: t('products.conversion') || 'Conversion' },
                                    { title: t('products.lastTryOn') || 'Last Try-On' },
                                ]}
                                selectable={false} // Disable selection if not needed
                            >
                                {rowMarkup}
                            </IndexTable>
                        ) : (
                            <EmptyState
                                heading={t('products.emptyTitle') || 'No product data yet'}
                                image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
                            >
                                <p>{t('products.emptyText') || 'Product analytics will appear here after customers use the try-on feature.'}</p>
                            </EmptyState>
                        )}
                    </LegacyCard>
                </Layout.Section>
            </Layout>
        </Page>
    );
}
