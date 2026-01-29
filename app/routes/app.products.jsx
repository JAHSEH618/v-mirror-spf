import { useLoaderData, Link } from "react-router";
import { authenticate } from "../shopify.server";
import { DashboardLayout } from "../components/DashboardLayout";
import { useLanguage } from "../components/LanguageContext";
import prisma from "../db.server";
import adminStyles from "../styles/admin.css?url";
import {
    ArrowLeft,
    ShoppingCart,
    Package,
    DollarSign,
    Eye
} from 'lucide-react';

export const links = () => [
    { rel: "stylesheet", href: adminStyles },
];

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
    const { storeName, products, totals } = useLoaderData();
    const { t } = useLanguage();

    return (
        <DashboardLayout merchantName={storeName}>
            <div className="products-page">
                {/* Header */}
                <div className="products-header">
                    <Link to="/app/dashboard" className="products-back-link">
                        <ArrowLeft size={16} />
                        {t('common.back') || 'Back'}
                    </Link>
                    <h1 className="products-title">{t('products.title') || 'Product Analytics'}</h1>
                </div>

                {/* Summary Stats */}
                <div className="products-stats-grid">
                    <div className="products-stat-card">
                        <div className="products-stat-icon purple">
                            <Eye size={20} color="#7C3AED" />
                        </div>
                        <div className="products-stat-value">{totals.tryOns.toLocaleString()}</div>
                        <div className="products-stat-label">{t('products.totalTryOns') || 'Total Try-Ons'}</div>
                    </div>
                    <div className="products-stat-card">
                        <div className="products-stat-icon blue">
                            <ShoppingCart size={20} color="#3B82F6" />
                        </div>
                        <div className="products-stat-value">{totals.addToCarts.toLocaleString()}</div>
                        <div className="products-stat-label">{t('products.totalAddToCarts') || 'Add to Carts'}</div>
                    </div>
                    <div className="products-stat-card">
                        <div className="products-stat-icon green">
                            <Package size={20} color="#10B981" />
                        </div>
                        <div className="products-stat-value">{totals.orders.toLocaleString()}</div>
                        <div className="products-stat-label">{t('products.totalOrders') || 'Orders'}</div>
                    </div>
                    <div className="products-stat-card">
                        <div className="products-stat-icon yellow">
                            <DollarSign size={20} color="#F59E0B" />
                        </div>
                        <div className="products-stat-value">${totals.revenue.toLocaleString()}</div>
                        <div className="products-stat-label">{t('products.totalRevenue') || 'Revenue Impact'}</div>
                    </div>
                </div>

                {/* Products Table */}
                <div className="products-table-card">
                    <div className="products-table-header">
                        <h2 className="products-table-title">
                            {t('products.allProducts') || 'All Products'} ({products.length})
                        </h2>
                    </div>

                    {products.length > 0 ? (
                        <div className="products-table-scroll">
                            <table className="products-table">
                                <thead>
                                    <tr>
                                        <th>{t('products.product') || 'Product'}</th>
                                        <th>{t('products.tryOns') || 'Try-Ons'}</th>
                                        <th>{t('products.addToCarts') || 'Add to Cart'}</th>
                                        <th>{t('products.orders') || 'Orders'}</th>
                                        <th>{t('products.revenue') || 'Revenue'}</th>
                                        <th style={{ minWidth: '140px' }}>{t('products.conversion') || 'Conversion'}</th>
                                        <th>{t('products.lastTryOn') || 'Last Try-On'}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {products.map((product) => (
                                        <tr key={product.id}>
                                            <td>
                                                <div className="products-product-cell">
                                                    {product.image ? (
                                                        <img
                                                            src={product.image}
                                                            alt={product.title}
                                                            className="products-product-image"
                                                        />
                                                    ) : (
                                                        <div className="products-product-icon">
                                                            <Eye size={20} />
                                                        </div>
                                                    )}
                                                    <span className="products-product-title">{product.title}</span>
                                                </div>
                                            </td>
                                            <td>{product.tryOns}</td>
                                            <td>{product.addToCarts}</td>
                                            <td>{product.orders}</td>
                                            <td>${product.revenue.toFixed(2)}</td>
                                            <td>
                                                <div className="products-conversion-bar">
                                                    <div className="products-bar-track">
                                                        <div
                                                            className="products-bar-fill"
                                                            style={{ width: `${Math.min(product.conversion * 100, 100)}%` }}
                                                        />
                                                    </div>
                                                    <span className="products-conversion-value">
                                                        {(product.conversion * 100).toFixed(0)}%
                                                    </span>
                                                </div>
                                            </td>
                                            <td>{product.lastTryOn}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="products-empty-state">
                            <div className="products-empty-icon">
                                <Eye size={28} />
                            </div>
                            <div className="products-empty-title">
                                {t('products.emptyTitle') || 'No product data yet'}
                            </div>
                            <div className="products-empty-text">
                                {t('products.emptyText') || 'Product analytics will appear here after customers use the try-on feature.'}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}
