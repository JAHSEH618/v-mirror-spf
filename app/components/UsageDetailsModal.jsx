import { useState } from "react";
// Note: lucide-react removed - using Polaris s-icon and emoji for icons
import { useLanguage } from "../components/LanguageContext";

export const UsageDetailsModal = ({ isOpen, onClose }) => {
    const { t } = useLanguage();
    const [activeTab, setActiveTab] = useState("daily");
    const [page, setPage] = useState(1);

    if (!isOpen) return null;

    // Mock Data
    const metrics = [
        { label: t('usageModal.metrics.totalTryOns'), value: "842" },
        { label: t('usageModal.metrics.activeProducts'), value: "24" },
        { label: t('usageModal.metrics.successRate'), value: "98.5%" },
        { label: t('usageModal.metrics.avgDuration'), value: "45s" }
    ];

    const dailyData = Array.from({ length: 5 }).map((_, i) => ({
        date: `Jan ${26 - i}, 2026`,
        tryOns: Math.floor(Math.random() * 50) + 10,
        uniqueUsers: Math.floor(Math.random() * 30) + 5,
        conversion: `${(Math.random() * 5 + 1).toFixed(1)}%`
    }));

    const productData = [
        { name: "Summer Dress", sku: "SD-001", tryOns: 124, active: "Yes" },
        { name: "Blue Jeans", sku: "BJ-202", tryOns: 98, active: "Yes" },
        { name: "Red Scarf", sku: "RS-103", tryOns: 45, active: "No" },
        { name: "Leather Jacket", sku: "LJ-555", tryOns: 210, active: "Yes" },
    ];

    const currentData = activeTab === "daily" ? dailyData : productData;

    return (
        <div className="usage-modal-overlay" onClick={onClose}>
            <div className="usage-modal" onClick={e => e.stopPropagation()}>

                {/* Header */}
                <div className="usage-modal-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <h2 className="usage-modal-title">{t('usageModal.title')}</h2>
                        <span className="usage-modal-period-badge">{t('usageModal.period')}</span>
                    </div>
                    <div className="usage-modal-header-actions">
                        <button className="usage-modal-btn">
                            <span style={{ marginRight: '4px' }}>⬇️</span>
                            {t('usageModal.exportReport')}
                        </button>
                        <button onClick={onClose} className="usage-modal-close-btn">
                            <s-icon type="x" size="base"></s-icon>
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div className="usage-modal-body">

                    {/* Metrics */}
                    <div className="usage-modal-metrics-grid">
                        {metrics.map((m, i) => (
                            <div key={i} className="usage-modal-metric-card">
                                <div className="usage-modal-metric-label">{m.label}</div>
                                <div className="usage-modal-metric-value">{m.value}</div>
                            </div>
                        ))}
                    </div>

                    {/* Chart Mock */}
                    <div className="usage-modal-metric-card usage-modal-chart-mock">
                        <span className="usage-modal-chart-icon">📊</span>
                        <span className="usage-modal-chart-label">Usage Trends Visualization (Mock)</span>
                    </div>

                    {/* Table Section */}
                    <div>
                        <div className="usage-modal-tabs">
                            <button
                                className={`usage-modal-tab ${activeTab === "daily" ? "active" : ""}`}
                                onClick={() => setActiveTab("daily")}
                            >
                                {t('usageModal.tabs.daily')}
                            </button>
                            <button
                                className={`usage-modal-tab ${activeTab === "product" ? "active" : ""}`}
                                onClick={() => setActiveTab("product")}
                            >
                                {t('usageModal.tabs.product')}
                            </button>
                        </div>

                        <table className="usage-modal-table">
                            <thead>
                                <tr>
                                    {activeTab === "daily" ? (
                                        <>
                                            <th>{t('usageModal.dailyHeaders.date')}</th>
                                            <th>{t('usageModal.dailyHeaders.tryOns')}</th>
                                            <th>{t('usageModal.dailyHeaders.uniqueUsers')}</th>
                                            <th>{t('usageModal.dailyHeaders.conversionEst')}</th>
                                        </>
                                    ) : (
                                        <>
                                            <th>{t('usageModal.productHeaders.productName')}</th>
                                            <th>{t('usageModal.productHeaders.sku')}</th>
                                            <th>{t('usageModal.productHeaders.totalTryOns')}</th>
                                            <th>{t('usageModal.productHeaders.activeWidget')}</th>
                                        </>
                                    )}
                                </tr>
                            </thead>
                            <tbody>
                                {currentData.map((row, i) => (
                                    <tr key={i}>
                                        {activeTab === "daily" ? (
                                            <>
                                                <td>{row.date}</td>
                                                <td>{row.tryOns}</td>
                                                <td>{row.uniqueUsers}</td>
                                                <td>{row.conversion}</td>
                                            </>
                                        ) : (
                                            <>
                                                <td className="usage-modal-product-name">{row.name}</td>
                                                <td className="usage-modal-sku">{row.sku}</td>
                                                <td>{row.tryOns}</td>
                                                <td>
                                                    <span className={`usage-modal-active-badge ${row.active === 'Yes' ? 'yes' : 'no'}`}>
                                                        {row.active}
                                                    </span>
                                                </td>
                                            </>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {/* Pagination */}
                        <div className="usage-modal-pagination">
                            <button
                                className="usage-modal-btn"
                                disabled={page === 1}
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                            >
                                <s-icon type="chevron-left" size="small"></s-icon>
                                {t('usageModal.pagination.previous')}
                            </button>
                            <span className="usage-modal-pagination-info">
                                {t('usageModal.pagination.pageOf', { page, total: 5 })}
                            </span>
                            <button
                                className="usage-modal-btn"
                                disabled={page === 5}
                                onClick={() => setPage(p => Math.min(5, p + 1))}
                            >
                                {t('usageModal.pagination.next')}
                                <s-icon type="chevron-right" size="small"></s-icon>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
