import { useState } from "react";
import { X, Download, Calendar, ChevronLeft, ChevronRight, BarChart2 } from "lucide-react";

// Inline Styles
const styles = {
    overlay: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        backdropFilter: 'blur(4px)',
        zIndex: 9998,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
    },
    modal: {
        backgroundColor: 'white',
        borderRadius: '16px',
        maxWidth: '900px',
        width: '100%',
        height: '80vh',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        zIndex: 9999,
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
    },
    header: {
        padding: '20px 24px',
        borderBottom: '1px solid #E5E7EB',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    title: {
        fontSize: '18px',
        fontWeight: 600,
        color: '#111827',
        margin: 0
    },
    body: {
        flex: 1,
        overflowY: 'auto',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px'
    },
    metricsGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '16px'
    },
    metricCard: {
        padding: '16px',
        backgroundColor: '#F9FAFB',
        borderRadius: '8px',
        border: '1px solid #F3F4F6'
    },
    metricLabel: {
        fontSize: '12px',
        color: '#6B7280',
        fontWeight: 500,
        textTransform: 'uppercase',
        marginBottom: '8px'
    },
    metricValue: {
        fontSize: '24px',
        fontWeight: 700,
        color: '#111827'
    },
    tabs: {
        display: 'flex',
        borderBottom: '1px solid #E5E7EB',
        marginBottom: '16px'
    },
    tab: {
        padding: '12px 24px',
        cursor: 'pointer',
        fontWeight: 500,
        fontSize: '14px',
        borderBottom: '2px solid transparent',
        color: '#6B7280'
    },
    activeTab: {
        color: '#7C3AED',
        borderBottomColor: '#7C3AED'
    },
    table: {
        width: '100%',
        borderCollapse: 'collapse',
        fontSize: '14px'
    },
    th: {
        textAlign: 'left',
        padding: '12px 16px',
        backgroundColor: '#F9FAFB',
        borderBottom: '1px solid #E5E7EB',
        color: '#6B7280',
        fontWeight: 500
    },
    td: {
        padding: '12px 16px',
        borderBottom: '1px solid #F3F4F6',
        color: '#374151'
    },
    pagination: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: '16px',
        borderTop: '1px solid #E5E7EB'
    },
    btn: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '8px 16px',
        borderRadius: '6px',
        border: '1px solid #D1D5DB',
        backgroundColor: 'white',
        cursor: 'pointer',
        fontSize: '14px',
        fontWeight: 500,
        color: '#374151'
    }
};

export const UsageDetailsModal = ({ isOpen, onClose }) => {
    const [activeTab, setActiveTab] = useState("daily");
    const [page, setPage] = useState(1);

    if (!isOpen) return null;

    // Mock Data
    const metrics = [
        { label: "Total Try-Ons", value: "842" },
        { label: "Active Products", value: "24" },
        { label: "Success Rate", value: "98.5%" },
        { label: "Avg. Duration", value: "45s" }
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
        <div style={styles.overlay} onClick={onClose}>
            <div style={styles.modal} onClick={e => e.stopPropagation()}>

                {/* Header */}
                <div style={styles.header}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <h2 style={styles.title}>Usage Details</h2>
                        <span style={{ fontSize: '12px', background: '#F3F4F6', padding: '4px 8px', borderRadius: '4px', color: '#6B7280' }}>Last 30 Days</span>
                    </div>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <button style={styles.btn}>
                            <Download size={16} />
                            Export Report
                        </button>
                        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF' }}>
                            <X size={24} />
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div style={styles.body}>

                    {/* Metrics */}
                    <div style={styles.metricsGrid}>
                        {metrics.map((m, i) => (
                            <div key={i} style={styles.metricCard}>
                                <div style={styles.metricLabel}>{m.label}</div>
                                <div style={styles.metricValue}>{m.value}</div>
                            </div>
                        ))}
                    </div>

                    {/* Chart Mock */}
                    <div style={{ ...styles.metricCard, height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', color: '#9CA3AF' }}>
                        <BarChart2 size={48} style={{ marginBottom: '12px', opacity: 0.5 }} />
                        <span style={{ fontSize: '14px' }}>Usage Trends Visualization (Mock)</span>
                    </div>

                    {/* Table Section */}
                    <div>
                        <div style={styles.tabs}>
                            <div
                                style={{ ...styles.tab, ...(activeTab === "daily" ? styles.activeTab : {}) }}
                                onClick={() => setActiveTab("daily")}
                            >
                                Daily Breakdown
                            </div>
                            <div
                                style={{ ...styles.tab, ...(activeTab === "product" ? styles.activeTab : {}) }}
                                onClick={() => setActiveTab("product")}
                            >
                                Usage by Product
                            </div>
                        </div>

                        <table style={styles.table}>
                            <thead>
                                <tr>
                                    {activeTab === "daily" ? (
                                        <>
                                            <th style={styles.th}>Date</th>
                                            <th style={styles.th}>Try-Ons</th>
                                            <th style={styles.th}>Unique Users</th>
                                            <th style={styles.th}>Conversion Est.</th>
                                        </>
                                    ) : (
                                        <>
                                            <th style={styles.th}>Product Name</th>
                                            <th style={styles.th}>SKU</th>
                                            <th style={styles.th}>Total Try-Ons</th>
                                            <th style={styles.th}>Active Widget</th>
                                        </>
                                    )}
                                </tr>
                            </thead>
                            <tbody>
                                {currentData.map((row, i) => (
                                    <tr key={i}>
                                        {activeTab === "daily" ? (
                                            <>
                                                <td style={styles.td}>{row.date}</td>
                                                <td style={styles.td}>{row.tryOns}</td>
                                                <td style={styles.td}>{row.uniqueUsers}</td>
                                                <td style={styles.td}>{row.conversion}</td>
                                            </>
                                        ) : (
                                            <>
                                                <td style={styles.td} style={{ ...styles.td, fontWeight: 500 }}>{row.name}</td>
                                                <td style={styles.td} style={{ ...styles.td, fontFamily: 'monospace' }}>{row.sku}</td>
                                                <td style={styles.td}>{row.tryOns}</td>
                                                <td style={styles.td}>
                                                    <span style={{
                                                        padding: '2px 8px', borderRadius: '99px', fontSize: '12px',
                                                        backgroundColor: row.active === 'Yes' ? '#D1FAE5' : '#F3F4F6',
                                                        color: row.active === 'Yes' ? '#065F46' : '#6B7280'
                                                    }}>
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
                        <div style={styles.pagination}>
                            <button
                                style={{ ...styles.btn, opacity: page === 1 ? 0.5 : 1 }}
                                disabled={page === 1}
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                            >
                                <ChevronLeft size={16} />
                                Previous
                            </button>
                            <span style={{ fontSize: '14px', color: '#6B7280' }}>Page {page} of 5</span>
                            <button
                                style={{ ...styles.btn, opacity: page === 5 ? 0.5 : 1 }}
                                disabled={page === 5}
                                onClick={() => setPage(p => Math.min(5, p + 1))}
                            >
                                Next
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
